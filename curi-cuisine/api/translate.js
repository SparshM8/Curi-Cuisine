module.exports.default = async function translateHandler(req, res) {
  try {
    const { text, target = 'en', model } = req.body || {};
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'Missing text' });
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = (typeof model === 'string' && model.trim()) ? model.trim() : 'gemini-2.5-flash';

    const prompt = `Translate the following markdown recipe text into language code "${target}". Preserve headings and lists. RETURN STRICT JSON only in this schema: { "text": string }\n\n---\n${text}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, topP: 0.9, maxOutputTokens: 1024 }
        })
      }
    );

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Upstream translate error' });
    const parts = data.candidates?.[0]?.content?.parts || [];
    const textOut = parts.map(p => p.text).filter(Boolean).join('\n');
    let json;
    try {
      json = JSON.parse(textOut.trim());
    } catch (_) {
      const m = textOut.match(/\{[\s\S]*\}/);
      if (m) { try { json = JSON.parse(m[0]); } catch (_) {} }
    }
    if (!json || typeof json.text !== 'string') throw new Error('Failed to parse translation');
    res.json(json);
  } catch (err) {
    console.error('translate error', err.message);
    // graceful fallback: return original text if offline
    res.json({ text: req.body?.text || '' });
  }
};
