module.exports.default = async function handler(req, res) {
  try {
    const { imageBase64 } = req.body || {};
    if (!imageBase64) return res.status(400).json({ error: 'Missing imageBase64' });
    const apiKey = process.env.GOOGLE_VISION_KEY;

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: imageBase64 },
              features: [{ type: 'LABEL_DETECTION', maxResults: 5 }]
            }
          ]
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Upstream error' });
    }
    const labels = data.responses?.[0]?.labelAnnotations?.map(l => l.description) || [];
    res.status(200).json({ labels });
  } catch (err) {
    console.error('vision error', err);
    res.status(500).json({ error: err.message });
  }
};
