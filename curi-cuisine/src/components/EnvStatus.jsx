import React, { useEffect, useState } from 'react';

export default function EnvStatus() {
  const [status, setStatus] = useState({ loading: true, hasGeminiKey: false, hasVisionKey: false, port: 3001 });
  const [open, setOpen] = useState(false);

  const fetchStatus = async () => {
    try {
      setStatus(s => ({ ...s, loading: true }));
      const res = await fetch('/api/config-check');
      const data = await res.json();
      setStatus({ loading: false, ...data });
    } catch (e) {
      setStatus(s => ({ ...s, loading: false }));
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const allGood = status.hasGeminiKey && status.hasVisionKey;

  return (
    <div className="relative select-none">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title="Environment status"
        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors shadow-sm ${
          status.loading
            ? 'bg-white/70 text-header border-header/20'
            : allGood
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-amber-100 text-amber-800 border-amber-300'
        }`}
      >
        {status.loading ? 'Checking…' : allGood ? 'Env OK' : 'Setup Needed'}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 p-3 rounded-xl bg-white/90 backdrop-blur border border-white/70 shadow-xl z-50">
          <div className="text-sm font-semibold text-header mb-2">Environment</div>
          <ul className="space-y-1 text-sm">
            <li className="flex items-center justify-between">
              <span>Gemini Key</span>
              <span className={`text-xs font-bold ${status.hasGeminiKey ? 'text-emerald-600' : 'text-amber-600'}`}>
                {status.hasGeminiKey ? 'Present' : 'Missing'}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>Vision Key</span>
              <span className={`text-xs font-bold ${status.hasVisionKey ? 'text-emerald-600' : 'text-amber-600'}`}>
                {status.hasVisionKey ? 'Present' : 'Missing'}
              </span>
            </li>
          </ul>
          <div className="mt-3 flex items-center justify-between gap-2">
            <button onClick={fetchStatus} className="px-2 py-1 rounded-md text-xs font-semibold bg-header text-white hover:bg-accent transition">
              Refresh
            </button>
            <a
              className="text-xs text-header/70 underline hover:text-accent"
              href="/api/config-check"
              target="_blank" rel="noreferrer"
            >API</a>
          </div>
        </div>
      )}
    </div>
  );
}
