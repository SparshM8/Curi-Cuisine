import React, { useState, useRef, useEffect } from "react";
import { FaCamera, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

export default function CameraScanner() {
  const [preview, setPreview] = useState(null);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const [hasVisionKey, setHasVisionKey] = useState(false);
  const [useLocalClassifier, setUseLocalClassifier] = useState(false);

  const handleCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setLabels([]);
    setError("");
    setLoading(true);

    try {
      const base64 = await toBase64(file);
      // If the server is configured with a Vision key, call it
      let detectedLabels = [];
      if (hasVisionKey) {
        const res = await fetch('/api/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64.split(',')[1] })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Vision API failed');
        detectedLabels = data.labels || [];
        setLabels(detectedLabels);
      } else if (useLocalClassifier) {
        // Try to use local TFJS classifier as fallback (optional and lazy-loads the model)
        try {
          const module = await import('../../tfjs/scanner');
          const img = new Image();
          img.src = URL.createObjectURL(file);
          await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
          const names = await module.classifyImage(img);
          detectedLabels = names || [];
          setLabels(detectedLabels);
        } catch (err) {
          // Fall back to an empty list and show error
          throw new Error('Vision not configured on server and local classifier not available');
        }
      } else {
        throw new Error('Vision API not configured on server and local classifer not enabled.');
      }

      // Dispatch event to add ingredients to the bank
      if (detectedLabels && detectedLabels.length > 0) {
        const event = new CustomEvent('ingredients:add', { detail: detectedLabels });
        window.dispatchEvent(event);
        const evt2 = new CustomEvent('toast:show', { detail: { message: `Added: ${detectedLabels.join(', ')}`, type: 'success' } });
        window.dispatchEvent(evt2);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Read server config to determine whether Vision API is available
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/config-check');
        if (res.ok) {
          const j = await res.json();
          if (mounted) setHasVisionKey(Boolean(j?.hasVisionKey));
        }
      } catch (_) {}
    })();
    return () => { mounted = false; };
  }, []);

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const triggerFileSelect = () => fileInputRef.current?.click();

  return (
    <div>
      <p className="text-sm text-header/70 mb-4">
        Use your device's camera to scan ingredients. The AI will identify them and add them to your list.
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        className="hidden"
      />
      <button
        onClick={triggerFileSelect}
        disabled={loading || (!hasVisionKey && !useLocalClassifier)}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold bg-gradient-to-r from-header to-accent text-white hover:shadow-xl hover:scale-105 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Analyzing Image...
          </>
        ) : (
          <>
            <FaCamera className="text-xl" />
            📸 Scan with Camera
          </>
        )}
      </button>
      {!hasVisionKey && (
        <div className="mt-2 text-xs text-amber-700 flex items-center gap-2">
          <span>Vision server not configured. You can:</span>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={useLocalClassifier} onChange={(e) => setUseLocalClassifier(e.target.checked)} />
            <span>Use local TFJS classifier (may increase bundle size)</span>
          </label>
        </div>
      )}

      {preview && (
        <div className="mt-4 flex flex-col items-center gap-4">
          <img src={preview} alt="Captured" className="w-32 h-32 object-cover rounded-2xl border-2 border-accent/50 shadow-lg" />
          {error && <p className="text-sm text-red-500 font-semibold flex items-center gap-2"><FaTimesCircle /> {error}</p>}
          {labels.length > 0 && (
            <div className="text-center">
              <p className="font-bold text-header flex items-center gap-2 justify-center"><FaCheckCircle className="text-accent" /> Ingredients Added:</p>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {labels.map(l => (
                  <span key={l} className="px-3 py-1 text-xs rounded-full bg-accent/15 text-header font-semibold">{l}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
