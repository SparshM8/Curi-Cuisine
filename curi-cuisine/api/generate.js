let cachedPreferredModel = null;
let lastModelRefresh = 0;
const MODEL_REFRESH_WINDOW = 1000 * 60 * 5; // 5 minutes

async function listSupportedGenerateModels(apiKey) {
  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!resp.ok) return null;
    const j = await resp.json();
    const models = j?.models || [];
    // Prefer models that support generateContent (if supportedMethods available)
    const filtered = models.filter(m => {
      if (m?.supportedMethods && Array.isArray(m.supportedMethods)) {
        return m.supportedMethods.includes('generateContent');
      }
      // Fallback: try to pick naming that suggests generation
      return /generate|content|gemini|bison/i.test(m?.name || '');
    });
    return filtered.map(m => m.name).filter(Boolean);
  } catch (err) {
    console.error('listSupportedGenerateModels error', err.message || err);
    return null;
  }
}

module.exports.default = async function handler(req, res) {
  try {
    const { query, model, generationConfig } = req.body || {};
    if (!query) return res.status(400).json({ error: 'Missing query' });
    const apiKey = process.env.GEMINI_API_KEY;

    // Determine model name: use client-provided if present; else use cachedPreferredModel or list models
    let modelName = typeof model === 'string' && model.trim() ? model.trim() : null;
    const now = Date.now();
    if (!modelName) {
      if (!cachedPreferredModel || (now - lastModelRefresh > MODEL_REFRESH_WINDOW)) {
        const candidates = await listSupportedGenerateModels(apiKey);
        if (candidates && candidates.length) {
          cachedPreferredModel = candidates[0];
          lastModelRefresh = now;
        }
      }
      modelName = cachedPreferredModel || 'gemini-2.0-flash-exp';
    }

    // Merge generationConfig overrides safely
    const defaults = { temperature: 0.9, topP: 0.95, topK: 40, maxOutputTokens: 1024 };
    const allowed = ['temperature', 'topP', 'topK', 'maxOutputTokens'];
    const mergedGenCfg = { ...defaults };
    if (generationConfig && typeof generationConfig === 'object') {
      for (const k of allowed) {
        if (k in generationConfig) {
          mergedGenCfg[k] = generationConfig[k];
        }
      }
    }

    // Normalize modelName: accept both 'models/name' and 'name'
    const apiModelPath = modelName && modelName.startsWith('models/') ? modelName : `models/${modelName}`;
    const modelPart = apiModelPath.replace(/^models\//, '');

    // If the chosen model name looks like an embedding model or another non-generation model,
    // return a demo fallback immediately so the user gets a helpful response instead of an upstream error.
    if (/embed|embedding|embedding-/i.test(modelPart)) {
      console.warn('generate: requested model appears to be an embedding/non-generation model:', modelPart);
      const demo = `# Quick Demo Recipe\n\nAI offline or blocked — showing a locally generated demo recipe so you can keep going.\n\n## Ingredients\n- 1 cup rice\n- 2 tbsp olive oil\n- 1 clove garlic (minced)\n\n## Instructions\n1. Heat oil in a pan over medium heat.\n2. Add garlic and sauté until fragrant.\n3. Add rice and 2 cups water; simmer until tender.\n4. Season with salt and pepper and serve.\n\n## Sustainability Tip\n- Use vegetable scraps to make a simple stock for future soups.`;
      return res.status(200).json({ recipe: demo, offline: true, message: 'AI offline or blocked — showing a locally generated demo recipe so you can keep going.' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelPart)}:generateContent?key=${apiKey}`;
    console.error('generate calling', url, 'modelPart', modelPart);
    const requestBody = {
      contents: [{ parts: [{ text: query }] }],
      generationConfig: mergedGenCfg
    };
    console.error('generate request body', JSON.stringify(requestBody).slice(0, 200));
    const response = await fetch(url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    const data = await response.json();
    if (!response.ok) {
      // Build a normalized error string for detection
      const body = (data && data.error) ? data.error.message || JSON.stringify(data.error) : JSON.stringify(data);
      const bodyLower = String(body || '').toLowerCase();
      console.error('generate upstream error', response.status, body);

      // If upstream indicates a model type that does not support generateContent (e.g., an embedding model)
      // or the model is not found for this API version, return a friendly offline/demo recipe so the app remains usable.
      if (/embedding|not found for api version|not supported for generatecontent|model not found/i.test(bodyLower)) {
        console.warn('generate: upstream model unsupported for generation — returning demo fallback');
        const demo = `# Quick Demo Recipe\n\nAI offline or blocked — showing a locally generated demo recipe so you can keep going.\n\n## Ingredients\n- 1 cup rice\n- 2 tbsp olive oil\n- 1 clove garlic (minced)\n\n## Instructions\n1. Heat oil in a pan over medium heat.\n2. Add garlic and sauté until fragrant.\n3. Add rice and 2 cups water; simmer until tender.\n4. Season with salt and pepper and serve.\n\n## Sustainability Tip\n- Use vegetable scraps to make a simple stock for future soups.`;
        return res.status(200).json({ recipe: demo, offline: true, message: 'AI offline or blocked — showing a locally generated demo recipe so you can keep going.' });
      }

      // Improve error messages for rate-limit and quota issues
      if (response.status === 429 || /quota/i.test(body)) {
        const retryAfter = response.headers && response.headers.get ? response.headers.get('retry-after') : null;
        return res.status(429).json({ error: 'Quota limit reached; please check your Google Cloud billing/quota and try again', retryAfter, reason: 'quota_exceeded', details: body, docs: 'https://ai.google.dev/gemini-api/docs/rate-limits' });
      }
      if (response.status === 403) {
        if (/unregistered callers|method doesn.t allow unregistered callers/i.test(body)) {
          return res.status(403).json({ error: 'Your API key does not have permission to call the Generative Language API; enable the API and ensure your key is valid', reason: 'forbidden', details: body, docs: 'https://developers.google.com/ai/apis/generative/overview' });
        }
        return res.status(403).json({ error: 'Your API key cannot access the Generative Language API. Check the key or enable the API for your Google Cloud project.' });
      }
      console.error('generate upstream error', response.status, data?.error?.message || data);
      const upstream = (data && data.error) ? data.error.message || JSON.stringify(data.error) : data?.error || 'Upstream error';
      // Provide friendlier messages for the two common issues
      if (response.status === 403) {
        return res.status(403).json({ error: 'Your API key cannot access the Generative Language API. Check the key or enable the API for your Google Cloud project.' });
      }
      if (response.status === 404) {
        // Model not available: Try to find a supported model from ListModels and retry once
        try {
          const modelsResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
          if (modelsResp.ok) {
            const j = await modelsResp.json();
            const models = j?.models || [];
            const candidate = models.find(m => m.name && (m.supportedMethods?.includes('generateContent') || /generate|content|gemini|bison/i.test(m.name)));
            if (candidate && candidate.name) {
              console.error('generate will retry with candidate model', candidate.name);
              // Try again with a safe candidate model name
              const retryModelPath = candidate.name && candidate.name.startsWith('models/') ? candidate.name : `models/${candidate.name}`;
              const retryModelPart = retryModelPath.replace(/^models\//, '');
              const retry = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(retryModelPart)}:generateContent?key=${apiKey}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ contents: [{ parts: [{ text: query }] }], generationConfig: mergedGenCfg })
                }
              );
              const rj = await retry.json();
              if (retry.ok) {
                const candParts = rj.candidates?.[0]?.content?.parts || [];
                const text = candParts.map(p => p.text).filter(Boolean).join('\n');
                return res.status(200).json({ recipe: text });
              }
            }
          }
        } catch (_) {}
        return res.status(404).json({ error: upstream || 'Model not supported by the current API version.' });
      }
      return res.status(response.status).json({ error: upstream || 'Upstream error' });
    }
    let text = 'No recipe found.';
    const cand = data.candidates?.[0]?.content?.parts || [];
    if (Array.isArray(cand) && cand.length) {
      text = cand.map(p => p.text).filter(Boolean).join('\n');
    }
    res.status(200).json({ recipe: text });
  } catch (err) {
    console.error('generate error', err);
    res.status(500).json({ error: err.message });
  }
};
