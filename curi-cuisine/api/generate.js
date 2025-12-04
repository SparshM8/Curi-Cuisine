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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: query }] }],
          generationConfig: mergedGenCfg
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      // Improve error messages for rate-limit and quota issues
      const body = (data && data.error) ? data.error.message || JSON.stringify(data.error) : JSON.stringify(data);
      console.error('generate upstream error', response.status, body);
      if (response.status === 429) {
        const retryAfter = response.headers && response.headers.get ? response.headers.get('retry-after') : null;
        return res.status(429).json({ error: 'Quota limit reached; please retry later', retryAfter, details: body });
      }
      if (response.status === 403) {
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
              const retry = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(candidate.name)}:generateContent?key=${apiKey}`,
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
