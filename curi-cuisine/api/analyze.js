module.exports.default = async function analyzeHandler(req, res) {
  try {
    const { text, task = 'nutrition', model } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Missing text' });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = (typeof model === 'string' && model.trim()) ? model.trim() : 'gemini-2.5-flash';

    const prompts = {
      nutrition: `You are a nutritionist. Analyze the following recipe and RETURN STRICT JSON only. Do not include any extra text.
Schema:
{
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "tags": string[], // choose from: vegan, vegetarian, gluten-free, dairy-free, nut-free, low-carb, high-protein
  "summary": string // <= 160 chars
}
Recipe:\n\n${text}`,
      substitutions: `You are a helpful chef. Suggest up to 5 smart substitutions for unavailable ingredients in the following recipe. RETURN STRICT JSON only.
Schema:
{
  "substitutions": [
    { "item": string, "alternatives": string[] }
  ]
}
Recipe:\n\n${text}`
    };

    const prompt = prompts[task] || prompts.nutrition;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, topP: 0.9, maxOutputTokens: 256 }
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Upstream analyze error');
    }
    const parts = data.candidates?.[0]?.content?.parts || [];
    const textOut = parts.map(p => p.text).filter(Boolean).join('\n');
    let json;
    try {
      json = JSON.parse(textOut.trim());
    } catch (_) {
      // Try to extract JSON substring
      const m = textOut.match(/\{[\s\S]*\}/);
      if (m) {
        try { json = JSON.parse(m[0]); } catch (_) {}
      }
    }
    if (!json) throw new Error('Failed to parse JSON');
    res.json(json);
  } catch (err) {
    console.error('analyze error', err.message);
    // Offline/heuristic fallback
    const { text, task = 'nutrition' } = req.body || {};
    if (task === 'substitutions') {
      const items = (text || '').split('\n').filter(l => l.trim().startsWith('- ')).map(l => l.replace(/^[-*]\s+/, '').trim()).slice(0, 5);
      const subs = items.map(it => ({ item: it, alternatives: ['Similar veggie', 'Tofu/beans', 'Any seasonal produce'] }));
      return res.json({ substitutions: subs });
    } else {
      const words = (text || '').split(/\s+/).length;
      const approxCalories = Math.min(900, 200 + Math.round(words / 10) * 10);
      return res.json({
        calories: approxCalories,
        protein_g: Math.round(approxCalories * 0.15 / 4),
        carbs_g: Math.round(approxCalories * 0.55 / 4),
        fat_g: Math.round(approxCalories * 0.30 / 9),
        tags: ['vegetarian'],
        summary: 'Approximate nutrition based on heuristic since AI is offline.'
      });
    }
  }
};
