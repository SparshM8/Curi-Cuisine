import React, { useState, useEffect, useMemo, useRef } from "react";
import { FaPlus } from "react-icons/fa";

// Debounce hook for search
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function IngredientBank() {
  const [allIngredients, setAllIngredients] = useState([]);
  const [selected, setSelected] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newIngredientName, setNewIngredientName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);

  const defaultIngredients = useMemo(() => ([
    { id: 'apple', name: 'Apple', category: 'Fruit' },
    { id: 'banana', name: 'Banana', category: 'Fruit' },
    { id: 'chicken_breast', name: 'Chicken Breast', category: 'Meat' },
    { id: 'carrot', name: 'Carrot', category: 'Vegetable' },
    { id: 'rice', name: 'Rice', category: 'Pantry' },
    { id: 'olive_oil', name: 'Olive Oil', category: 'Pantry' },
    { id: 'garlic', name: 'Garlic', category: 'Vegetable' },
    { id: 'onion', name: 'Onion', category: 'Vegetable' },
  ]), []);

  const slugify = (name) => name.toLowerCase().trim().replace(/\s+/g, '_');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch ingredients from the API
  const fetchIngredients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/ingredients');
      if (!response.ok) throw new Error('Failed to fetch ingredients');
      const data = await response.json();
      setAllIngredients(data);
      setError(null);
      setOfflineMode(false);
    } catch (err) {
      console.error(err);
      setOfflineMode(true);
      setAllIngredients(defaultIngredients);
      setError('Could not reach server. Using offline demo data.');
    } finally {
      setIsLoading(false);
    }
  };

  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    fetchIngredients();
  }, []);

  useEffect(() => {
    // Listen for external additions (e.g., from camera/voice)
    const handleExternalAdd = (event) => {
      const newNames = event.detail || [];
      // Ensure items exist in the bank
      setAllIngredients(prevAll => {
        const next = [...prevAll];
        for (const name of newNames) {
          const id = slugify(name);
          if (!next.some(i => i.id === id)) {
            next.push({ id, name, category: 'Pantry' });
          }
        }
        return next;
      });
      // Select them
      setSelected(prevSel => {
        const toAdd = [];
        for (const name of newNames) {
          const id = slugify(name);
          if (!prevSel.includes(id)) toAdd.push(id);
        }
        return toAdd.length ? [...prevSel, ...toAdd] : prevSel;
      });
    };
    window.addEventListener('ingredients:add', handleExternalAdd);
    return () => window.removeEventListener('ingredients:add', handleExternalAdd);
  }, []);

  const handleAddIngredient = async (e) => {
    e.preventDefault();
    if (!newIngredientName.trim()) return;

    try {
      if (offlineMode) {
        const newId = slugify(newIngredientName);
        const newItem = { id: newId, name: newIngredientName.trim(), category: 'Pantry' };
        setAllIngredients(prev => prev.some(i => i.id === newId) ? prev : [...prev, newItem]);
        setSelected(prev => prev.includes(newId) ? prev : [...prev, newId]);
        setNewIngredientName('');
        return;
      }

      const response = await fetch('/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newIngredientName.trim() }),
      });
      if (response.ok || response.status === 409) {
        const newId = slugify(newIngredientName);
        setNewIngredientName('');
        await fetchIngredients(); // Refresh list
        if (response.status !== 409) setSelected(prev => [...prev, newId]);
      } else {
        throw new Error('Failed to add ingredient');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleIngredient = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Broadcast selection changes
  useEffect(() => {
    const selectedIngredients = allIngredients.filter(i => selected.includes(i.id));
    const event = new CustomEvent('ingredients:update', { detail: selectedIngredients });
    window.dispatchEvent(event);
  }, [selected, allIngredients]);

  const filteredIngredients = useMemo(() => {
    const categories = {};
    const filtered = allIngredients.filter(i =>
      i.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );

    filtered.forEach(i => {
      if (!categories[i.category]) categories[i.category] = [];
      categories[i.category].push(i);
    });

    return Object.entries(categories).sort((a, b) => a[0].localeCompare(b[0]));
  }, [allIngredients, debouncedSearchTerm]);

  const copySelected = async () => {
    const names = allIngredients.filter(i => selected.includes(i.id)).map(i => i.name);
    if (!names.length) return;
    try {
      await navigator.clipboard.writeText(names.join(', '));
      const evt = new CustomEvent('toast:show', { detail: { message: 'Copied selected ingredients', type: 'success' } });
      window.dispatchEvent(evt);
    } catch (_) {
      const evt = new CustomEvent('toast:show', { detail: { message: 'Copy failed', type: 'error' } });
      window.dispatchEvent(evt);
    }
  };

  const clearSelected = () => {
    setSelected([]);
    const evt = new CustomEvent('toast:show', { detail: { message: 'Cleared selection', type: 'info' } });
    window.dispatchEvent(evt);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="🔍 Search ingredients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-5 py-3 rounded-full border-2 border-header/20 bg-white/90 focus:border-accent focus:ring-4 focus:ring-accent/20 focus:outline-none transition-all text-sm font-medium shadow-sm"
        />
        <form onSubmit={handleAddIngredient} className="flex gap-2 flex-1">
          <input
            type="text"
            placeholder="➕ Add new ingredient..."
            value={newIngredientName}
            onChange={(e) => setNewIngredientName(e.target.value)}
            className="flex-1 px-5 py-3 rounded-full border-2 border-header/20 bg-white/90 focus:border-accent focus:ring-4 focus:ring-accent/20 focus:outline-none transition-all text-sm font-medium shadow-sm"
          />
          <button 
            type="submit" 
            className="px-6 py-3 rounded-full bg-gradient-to-r from-header to-accent text-white font-bold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2 shadow-md"
          >
            <FaPlus className="text-sm" /> Add
          </button>
        </form>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="spinner"></div>
          <p className="ml-3 text-header/70 font-medium">Loading ingredients...</p>
        </div>
      )}
      {offlineMode && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 mb-4">
          <span>{error || 'Offline mode: using demo ingredients.'}</span>
          <button
            onClick={fetchIngredients}
            className="px-3 py-1.5 rounded-full bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700"
          >Retry</button>
        </div>
      )}
      {!offlineMode && error && <p className="text-red-500">{error}</p>}

      <div className="space-y-5 max-h-[400px] overflow-y-auto pr-2">
        {filteredIngredients.map(([category, ingredients]) => (
          <div key={category}>
            <h3 className="font-bold text-header mb-2 text-sm uppercase tracking-wider opacity-60">{category}</h3>
            <div className="flex flex-wrap gap-3">
              {ingredients.map((item) => {
                const active = selected.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleIngredient(item.id)}
                    className={`relative px-4 py-2 rounded-full text-sm font-semibold tracking-wide transition-all
                      ring-1 ring-inset backdrop-blur
                      ${active ? 'bg-gradient-to-r from-accent to-gold text-white shadow-lg shadow-accent/30 scale-105 ring-accent/40' : 'bg-white/70 text-header ring-header/15 hover:bg-accent/10 hover:shadow-md'}
                    `}
                  >
                    <span className="flex items-center gap-1.5">
                      {active && <span className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_4px_24px_-6px_#2B677711]">
        <div className="flex items-center justify-between mb-2">
          <p className="font-bold text-header text-sm uppercase tracking-wide opacity-70">Selected Ingredients</p>
          <div className="flex gap-2">
            <button onClick={copySelected} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-header/20 text-header hover:bg-header/5">Copy</button>
            <button onClick={clearSelected} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-header/20 text-header hover:bg-header/5">Clear</button>
          </div>
        </div>
        <div className="min-h-[1.5rem] text-lg font-medium text-header/90">
          {selected.length ? (
            <span className="flex flex-wrap gap-2">
              {allIngredients.filter(i => selected.includes(i.id)).map(s => (
                <span key={s.id} className="px-3 py-1 rounded-full text-xs bg-accent/15 text-header font-semibold">{s.name}</span>
              ))}
            </span>
          ) : (
            <span className="text-header/40 text-sm italic">None selected. Search or add ingredients above.</span>
          )}
        </div>
      </div>
    </div>
  );
}
