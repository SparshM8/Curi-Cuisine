module.exports.default = async function handler(req, res) {
  try {
    const { imageBase64 } = req.body || {};
    if (!imageBase64) return res.status(400).json({ error: 'Missing imageBase64' });

    const provider = (process.env.VISION_PROVIDER || 'google').toLowerCase();
    const apiKey = process.env.VISION_API_KEY || process.env.GOOGLE_VISION_KEY;

    // Helper: return labels array
    const fromGoogle = async () => {
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_KEY}`,
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
      if (!response.ok) throw new Error(data.error?.message || 'Upstream error');
      return data.responses?.[0]?.labelAnnotations?.map(l => l.description) || [];
    };

    const fromAzure = async () => {
      const endpoint = process.env.VISION_AZURE_ENDPOINT; // e.g. https://<region>.api.cognitive.microsoft.com
      if (!apiKey || !endpoint) throw new Error('Azure Vision configuration missing (VISION_API_KEY and VISION_AZURE_ENDPOINT)');
      const blob = Buffer.from(imageBase64, 'base64');
      const u = `${endpoint.replace(/\/$/, '')}/vision/v3.2/analyze?visualFeatures=Tags,Description`;
      const response = await fetch(u, {
        method: 'POST',
        headers: { 'Ocp-Apim-Subscription-Key': apiKey, 'Content-Type': 'application/octet-stream' },
        body: blob
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Upstream error');
      return (data.tags || []).map(t => t.name);
    };

    const fromClarifai = async () => {
      if (!apiKey) throw new Error('Clarifai API key missing (VISION_API_KEY)');
      // Clarifai v2: model can be general or a specific model ID
      const model = process.env.CLARIFAI_MODEL || 'general-image-recognition';
      const r = await fetch(`https://api.clarifai.com/v2/models/${encodeURIComponent(model)}/outputs`, {
        method: 'POST',
        headers: { 'Authorization': `Key ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: [ { data: { image: { base64: imageBase64 } } } ] })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.status?.description || JSON.stringify(data));
      const concepts = data?.outputs?.[0]?.data?.concepts || [];
      return concepts.map(c => c.name);
    };

    let labels = [];
    switch (provider) {
      case 'azure':
        labels = await fromAzure();
        break;
      case 'clarifai':
        labels = await fromClarifai();
        break;
      case 'google':
      default:
        labels = await fromGoogle();
        break;
    }

    res.status(200).json({ labels });
  } catch (err) {
    console.error('vision error', err);
    res.status(500).json({ error: err.message });
  }
};
