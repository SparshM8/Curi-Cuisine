import React, { useEffect, useState } from "react";

export default function ToastCenter() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const { message, type = 'info', timeout = 1800 } = e.detail || {};
      if (!message) return;
      const id = Math.random().toString(36).slice(2);
      setToasts((list) => [...list, { id, message, type }]);
      setTimeout(() => setToasts((list) => list.filter(t => t.id !== id)), timeout);
    };
    window.addEventListener('toast:show', handler);
    return () => window.removeEventListener('toast:show', handler);
  }, []);

  const color = (type) => {
    switch (type) {
      case 'success': return 'text-emerald-900 bg-emerald-50 border-emerald-200';
      case 'error': return 'text-red-900 bg-red-50 border-red-200';
      case 'warning': return 'text-amber-900 bg-amber-50 border-amber-200';
      default: return 'text-header bg-white border-white/60';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[1000] flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`px-3 py-2 rounded-lg text-sm font-semibold border shadow-sm ${color(t.type)}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
