import React, { useEffect, useRef, useState } from "react";
import { FaTrashAlt, FaHistory } from "react-icons/fa";
import { FaRegCopy } from "react-icons/fa";

export default function RecipeHistory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const fileRef = useRef(null);

  const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch('/api/recipes');
      if (!res.ok) throw new Error('Failed to load history');
      const data = await res.json();
      setItems(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    const prev = items;
    setItems(i => i.filter(x => x.id !== id));
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setInfo('Deleted');
      setTimeout(() => setInfo(''), 1200);
    } catch (e) {
      setItems(prev); // revert
      setError(e.message);
    }
  };

  const clearAll = async () => {
    const prev = items;
    setItems([]);
    try {
      const res = await fetch('/api/recipes', { method: 'DELETE' });
      if (!res.ok) throw new Error('Clear failed');
      setInfo('Cleared');
      setTimeout(() => setInfo(''), 1200);
    } catch (e) {
      setItems(prev);
      setError(e.message);
    }
  };

  const loadIntoGenerator = (item) => {
    const evt = new CustomEvent('recipe:load', { detail: item });
    window.dispatchEvent(evt);
    setInfo('Loaded into generator');
    setTimeout(() => setInfo(''), 1200);
  };

  const downloadMd = (item) => {
    const title = item.title || 'Recipe';
    const body = item.body || `# ${title}`;
    const blob = new Blob([body], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${slugify(title)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  };

  const onImportClick = () => fileRef.current?.click();

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const titleMatch = text.match(/^#\s*(.+)$/m);
      const title = (titleMatch?.[1] || file.name.replace(/\.md$/i, '')).trim();
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body: text, ingredients: [], source: 'import' }),
      });
      if (!res.ok) throw new Error('Import failed');
      setInfo('Imported');
      await load();
      setTimeout(() => setInfo(''), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl p-8 shadow-[0_4px_40px_-4px_#2B677711] overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-extrabold flex items-center gap-3 text-header">
          <span className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gradient-to-br from-header to-accent text-white shadow-md"><FaHistory /></span>
          Recipe History
        </h2>
        <div className="flex gap-2">
          <input ref={fileRef} onChange={handleImport} type="file" accept=".md,text/markdown" className="hidden" />
          <button onClick={onImportClick} className="px-3 py-1.5 rounded-full text-sm font-semibold bg-gold text-header hover:brightness-110 transition">Import .md</button>
          <button onClick={load} className="px-3 py-1.5 rounded-full text-sm font-semibold bg-header text-white hover:bg-accent transition">Refresh</button>
          <button onClick={clearAll} className="px-3 py-1.5 rounded-full text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition">Clear All</button>
        </div>
      </div>
      {info && <div className="mb-3 text-emerald-800 bg-emerald-50 border border-emerald-200 p-2 rounded text-sm">{info}</div>}
      {loading && <p>Loading history…</p>}
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      {!loading && items.length === 0 && (
        <p className="text-header/60 text-sm">No recipes saved yet.</p>
      )}
      <ul className="space-y-3">
        {items.map(item => (
          <li key={item.id} className="p-4 rounded-xl bg-white/80 border border-white/60">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-bold text-header">{item.title}</div>
                <div className="text-xs text-header/60">{new Date(item.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(item.body || '');
                    const evt2 = new CustomEvent('toast:show', { detail: { message: 'Copied recipe', type: 'success' } });
                    window.dispatchEvent(evt2);
                  } catch (_) {
                    const evt2 = new CustomEvent('toast:show', { detail: { message: 'Copy failed', type: 'error' } });
                    window.dispatchEvent(evt2);
                  }
                }} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-header border border-header/20 hover:bg-header/5 transition flex items-center gap-2"><FaRegCopy /> Copy</button>
                <button onClick={() => downloadMd(item)} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-header border border-header/20 hover:bg-header/5 transition">Download .md</button>
                <button onClick={() => loadIntoGenerator(item)} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-accent text-white hover:brightness-110 transition">Load into Generator</button>
                <button onClick={() => remove(item.id)} className="text-red-600 hover:text-red-700" title="Delete">
                  <FaTrashAlt />
                </button>
              </div>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-header/80">View</summary>
              <div className="prose prose-sm max-w-none mt-2 whitespace-pre-wrap">{item.body}</div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
