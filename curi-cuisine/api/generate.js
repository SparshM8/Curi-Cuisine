module.exports.default = async function handler(req, res) {
  try {
    const { query, model, generationConfig } = req.body || {};
    if (!query) return res.status(400).json({ error: 'Missing query' });
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = typeof model === 'string' && model.trim()
      ? model.trim()
      : 'gemini-pro';

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
      const upstream = (data && data.error) ? data.error.message || JSON.stringify(data.error) : data?.error || 'Upstream error';
      // Provide friendlier messages for the two common issues
      if (response.status === 403) {
        return res.status(403).json({ error: 'Your API key cannot access the Generative Language API. Check the key or enable the API for your Google Cloud project.' });
      }
      if (response.status === 404) {
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
