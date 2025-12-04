import React, { useState, useEffect } from "react";
import { FaLightbulb } from "react-icons/fa";
import { FaRegCopy } from "react-icons/fa";

export default function RecipePanel() {
  const [recipe, setRecipe] = useState("");
  const [query, setQuery] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [saveNote, setSaveNote] = useState("");
  const [saveOk, setSaveOk] = useState(true);
  const [hasAI, setHasAI] = useState(false);
  const [hasLLM, setHasLLM] = useState(false); // true when LLM endpoint responds OK
  const [forceDemo, setForceDemo] = useState(false);
    const [model, setModel] = useState("gemini-1.5-flash");
    const [availableModels, setAvailableModels] = useState([]);
  const [creativity, setCreativity] = useState(0.9); // temperature
  const [nutrition, setNutrition] = useState(null);
  const [subs, setSubs] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [lang, setLang] = useState('en');
  const [translated, setTranslated] = useState('');
  const [showTranslated, setShowTranslated] = useState(false);

  // Listen for ingredient updates from the IngredientBank
  useEffect(() => {
    const handler = (e) => {
      const selectedIngredients = e.detail || [];
      setIngredients(selectedIngredients);
      if (selectedIngredients.length) {
        const ingredientNames = selectedIngredients.map(i => i.name).join(', ');
        setQuery(`Create a creative, waste-minimizing recipe using: ${ingredientNames}. Be concise. Include a brief "Sustainability Tip" section at the end on how to use scraps or store ingredients efficiently.`);
      } else {
        setQuery("");
      }
    };
    window.addEventListener('ingredients:update', handler);
    return () => window.removeEventListener('ingredients:update', handler);
  }, []);

  useEffect(() => {
    // check env quickly; non-blocking
    (async () => {
      try {
        const res = await fetch('/api/config-check');
        if (!res.ok) return;
        const j = await res.json();
        setHasAI(Boolean(j?.hasGeminiKey));
      } catch (_) { /* ignore */ }
      try {
        // Quick connectivity check for the LLM backend
        const p = await fetch('/api/diagnose/llm');
        if (p.ok) {
          const pj = await p.json();
          setHasLLM(Boolean(pj?.ok));
          const list = pj?.models || [];
          if (Array.isArray(list) && list.length) {
            const names = list.map(m => m.name).filter(Boolean);
            setAvailableModels(names);
            // If the currently selected model isn't available, pick first
            if (names.length && !names.includes(model)) setModel(names[0]);
          }
        } else setHasLLM(false);
      } catch (_) { setHasLLM(false); }
    })();
  }, []);

  // Load recipe from history
  useEffect(() => {
    const loadHandler = (e) => {
      const item = e.detail;
      if (!item) return;
      setRecipe(item.body || "");
      setError("");
      setFallbackUsed(false);
      setQuery("");
      setSaveOk(true);
      setSaveNote('Loaded from history');
      setTimeout(() => setSaveNote(''), 1200);
    };
    window.addEventListener('recipe:load', loadHandler);
    return () => window.removeEventListener('recipe:load', loadHandler);
  }, []);

  const generateRecipe = async () => {
    if (!query.trim()) return;
    if (forceDemo) {
      const offline = buildOfflineRecipe(ingredients, query);
      setRecipe(offline);
      setFallbackUsed(true);
      setError('Using offline demo mode');
      return;
    }

    setLoading(true);
    setError("");
    setRecipe("");
    setFallbackUsed(false);
  setNutrition(null);
  setSubs(null);

    try {
      // Optionally enrich the prompt with quick web info for the first ingredient
      let finalPrompt = query;
      try {
        if (ingredients.length) {
          const primary = ingredients[0].name;
          const wi = await fetch(`/api/webinfo?q=${encodeURIComponent(primary)}`);
          if (wi.ok) {
            const wj = await wi.json();
            const hints = (wj.meals || []).map(m => `- ${m.name} (${m.category || ''} ${m.area ? '• ' + m.area : ''})`).slice(0, 3).join('\n');
            if (hints) {
              finalPrompt = `${query}\n\nConsider inspiration from popular dishes:\n${hints}`;
            }
          }
        }
      } catch (_) {
        // best-effort; ignore enrichment errors
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: finalPrompt,
          model,
          generationConfig: { temperature: Number(creativity) }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate recipe");
      setRecipe(data.recipe);

      // Analyze nutrition and substitutions (best-effort)
      setAnalyzing(true);
      try {
        const [nr, sr] = await Promise.all([
          fetch('/api/analyze', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: data.recipe, task: 'nutrition', model })
          }),
          fetch('/api/analyze', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: data.recipe, task: 'substitutions', model })
          })
        ]);
        if (nr.ok) setNutrition(await nr.json());
        if (sr.ok) setSubs(await sr.json());
      } catch (_) { /* non-blocking */ }
      finally { setAnalyzing(false); }

      // On success, update statistics
      await fetch('/api/statistics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipesTried: 1, wasteReduced: ingredients.length * 0.1 }), // Example metric
      });

    } catch (e) {
      // Build an offline fallback so demos never block
      const offline = buildOfflineRecipe(ingredients, query);
      setRecipe(offline);
      setFallbackUsed(true);
      // Keep an unobtrusive note for visibility; but show error details so users can act
      setError(e?.message || 'AI generation failed');
      // Attempt heuristic analysis on offline text as well
      try {
        setAnalyzing(true);
        const [nr, sr] = await Promise.all([
          fetch('/api/analyze', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: offline, task: 'nutrition', model })
          }),
          fetch('/api/analyze', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: offline, task: 'substitutions', model })
          })
        ]);
        if (nr.ok) setNutrition(await nr.json());
        if (sr.ok) setSubs(await sr.json());
      } catch (_) { /* ignore */ }
      finally { setAnalyzing(false); }
    } finally {
      setLoading(false);
    }
  };

  function buildOfflineRecipe(selected, originalPrompt) {
    const names = (selected || []).map(i => i.name);
    const title = names.length
      ? `${names[0]} ${names[1] ? 'and ' + names[1] : ''} One-Pan Bowl`
      : 'Quick Pantry-Friendly Bowl';

    const pantry = ['Olive Oil', 'Rice', 'Salt', 'Pepper'];
    const unique = Array.from(new Set([...names, ...pantry]));

    const methods = [
      'Sauté', 'Roast', 'Stir-fry', 'Simmer', 'Air-fry'
    ];
    const seasonings = [
      'garlic + paprika', 'ginger + soy', 'cumin + coriander', 'chili + lime', 'oregano + lemon', 'turmeric + pepper'
    ];
    const method = methods[Math.floor(Math.random() * methods.length)];
    const spice = seasonings[Math.floor(Math.random() * seasonings.length)];

    const steps = [
      'Prep: Rinse and chop your produce into bite-size pieces.',
      `${method}: Warm a pan with a little oil. Add aromatics (onion/garlic) if available.`,
      `Cook: Add ${names.slice(0, 2).join(' and ') || 'key ingredients'} with ${spice}. Toss for 4-6 minutes.`,
      'Bulk: Stir in cooked grains (rice/quinoa) or bread cubes for body (optional).',
      'Finish: Brighten with a dash of lemon/lime or vinegar. Garnish with herbs.',
    ];

    const sustainability = [
      'Save scraps for stock (onion skins, carrot ends).',
      'Store herbs in a jar of water in the fridge to extend life.',
      'Leftovers? Cool quickly and label with today’s date for tomorrow’s lunch.',
    ];

    const promptLine = originalPrompt ? `Prompt: ${originalPrompt}\n\n` : '';
    return [
      `# ${title}`,
      '',
      promptLine.trim(),
      '## Ingredients',
      ...unique.map(i => `- ${i}`),
      '',
      '## Instructions',
      ...steps.map((s, idx) => `${idx + 1}. ${s}`),
      '',
      '## Sustainability Tip',
      `- ${sustainability[Math.floor(Math.random() * sustainability.length)]}`,
    ].filter(Boolean).join('\n');
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-5 items-stretch md:items-end">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-header mb-1">AI Prompt</label>
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            rows={4}
            className="w-full p-4 rounded-xl border border-header/15 bg-white/70 focus:outline-none focus:ring-2 focus:ring-accent/60 text-dark text-sm shadow-inner"
            placeholder="Select ingredients to auto-generate a prompt, or write your own!"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 w-full md:w-auto md:min-w-[320px]">
          <div>
              <label className="block text-xs font-semibold text-header mb-1">AI Model {!hasAI && <span className="text-amber-600">(Demo)</span>} {!hasLLM && hasAI && <span className="text-red-600">(Key present but blocked)</span>}</label>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              className="w-full md:w-48 h-12 px-3 rounded-xl border border-header/15 bg-white/70 focus:outline-none focus:ring-2 focus:ring-accent/60 text-sm"
                disabled={!hasAI || !hasLLM}
            >
              {availableModels.length ? (
                availableModels.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))
              ) : (
                <>
                  <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental) ⚡</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast) 🚀</option>
                  <option value="gemini-1.5-flash-8b">Gemini 1.5 Flash-8B (Fastest) ⚡⚡</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Best Quality) 👑</option>
                  <option value="gemini-pro">Gemini Pro (Legacy) 📝</option>
                </>
              )}
            </select>
          </div>
          <div className="flex items-center gap-2 text-xs mt-2">
            <input id="forceDemo" type="checkbox" checked={forceDemo} onChange={(e) => setForceDemo(e.target.checked)} />
            <label htmlFor="forceDemo" className="text-xs text-header/70">Force Demo Mode (use offline recipes)</label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-header mb-1">Creativity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={creativity}
              onChange={e => setCreativity(e.target.value)}
              className="w-full"
            />
            <div className="text-[11px] text-header/70">Temperature: {creativity}</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-header mb-1">Language</label>
            <select
              value={lang}
              onChange={e => setLang(e.target.value)}
              className="w-full md:w-40 h-12 px-3 rounded-xl border border-header/15 bg-white/70 focus:outline-none focus:ring-2 focus:ring-accent/60 text-sm"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="hi">हिन्दी</option>
            </select>
          </div>
        </div>
        <button
          onClick={generateRecipe}
          disabled={loading || !query.trim()}
          className="h-12 md:h-auto px-8 py-3 rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-accent via-gold to-orange-400 bg-[length:200%_200%] animate-[shimmer_10s_linear_infinite] text-white hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 justify-center"
        >
          {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
          {loading ? 'Generating...' : '⚡ Generate Recipe'}
        </button>
      </div>
        {!hasAI && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="text-3xl">🔑</div>
              <div className="flex-1">
                <h4 className="font-bold text-blue-900 mb-1">Demo Mode Active</h4>
                <p className="text-sm text-blue-800">
                  AI is temporarily unavailable on this server. Recipes will be generated using the built-in demo mode. 
                  Site owners can enable full AI features by adding a server-side GEMINI_API_KEY in the root .env and restarting the server.
                </p>
              </div>
            </div>
          </div>
        )}
          {error && <p className="mt-4 text-red-600 font-semibold text-sm bg-red-100/50 p-3 rounded-lg">{error}</p>}
      {fallbackUsed && (
        <div className="mt-4 text-amber-900 bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm">
          AI offline or blocked — showing a locally generated demo recipe so you can keep going.
        </div>
      )}
      {saveNote && (
        <div className={`mt-3 text-sm p-2 rounded-lg border ${saveOk ? 'text-emerald-900 bg-emerald-50 border-emerald-200' : 'text-red-900 bg-red-50 border-red-200'}`}>
          {saveNote}
        </div>
      )}

      {recipe && (
        <div className="mt-3 flex gap-3">
          <button
            onClick={async () => {
              const title = (recipe.match(/^#\s*(.*)$/m)?.[1] || 'Saved Recipe').trim();
              try {
                const res = await fetch('/api/recipes', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title,
                    body: recipe,
                    ingredients: ingredients.map(i => i.name),
                    source: fallbackUsed ? 'offline' : 'ai',
                  }),
                });
                if (!res.ok) throw new Error('Save failed');
                const evt2 = new CustomEvent('toast:show', { detail: { message: 'Saved to history', type: 'success' } });
                window.dispatchEvent(evt2);
              } catch (_) {
                // non-blocking
                const evt2 = new CustomEvent('toast:show', { detail: { message: 'Save failed', type: 'error' } });
                window.dispatchEvent(evt2);
              }
            }}
            className="px-4 py-2 rounded-full bg-header text-white font-semibold hover:bg-accent transition"
          >Save to History</button>
        </div>
      )}
      
      {!recipe && !loading && (
        <div className="mt-8 text-center p-10 rounded-3xl bg-gradient-to-br from-white/90 to-white/70 border-2 border-dashed border-accent/30 shadow-inner">
          <div className="inline-block p-4 rounded-full bg-gradient-to-br from-gold/20 to-accent/20 mb-4">
            <FaLightbulb className="text-5xl text-gold" />
          </div>
          <h3 className="font-extrabold text-2xl text-header mb-2">Ready to Create Magic? ✨</h3>
          <p className="text-base text-header/70 max-w-md mx-auto leading-relaxed">
            Select some ingredients above or write a custom prompt to generate your perfect recipe. 
            Our AI will create a sustainable, waste-minimizing dish just for you!
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center text-sm">
            <span className="px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold">Zero Waste</span>
            <span className="px-4 py-2 rounded-full bg-gold/10 text-header font-semibold">AI-Powered</span>
            <span className="px-4 py-2 rounded-full bg-header/10 text-header font-semibold">Personalized</span>
          </div>
        </div>
      )}

      {recipe && (
        <div className="mt-6 p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-[0_4px_24px_-6px_#2B677711]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg text-header">Generated Recipe:</h3>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(recipe);
                  const evt2 = new CustomEvent('toast:show', { detail: { message: 'Copied recipe to clipboard', type: 'success' } });
                  window.dispatchEvent(evt2);
                } catch (_) {
                  const evt2 = new CustomEvent('toast:show', { detail: { message: 'Copy failed', type: 'error' } });
                  window.dispatchEvent(evt2);
                }
              }}
              className="px-3 py-1.5 rounded-full text-sm font-semibold bg-white border border-header/20 text-header hover:bg-header/5 flex items-center gap-2"
            >
              <FaRegCopy /> Copy
            </button>
          </div>
          {/* Translate controls */}
          <div className="mb-3 flex flex-wrap gap-2 items-center">
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: recipe, target: lang, model }) });
                  const j = await res.json();
                  if (typeof j.text === 'string') {
                    setTranslated(j.text);
                    setShowTranslated(true);
                  }
                } catch (_) {}
              }}
              className="px-3 py-1.5 rounded-full text-sm font-semibold bg-white border border-header/20 text-header hover:bg-header/5"
            >
              Translate
            </button>
            {translated && (
              <button
                onClick={() => setShowTranslated(v => !v)}
                className="px-3 py-1.5 rounded-full text-sm font-semibold bg-white border border-header/20 text-header hover:bg-header/5"
              >
                {showTranslated ? 'Show Original' : 'Show Translation'}
              </button>
            )}
          </div>
          {/* Optional print button for sharing */}
          <div className="mb-3">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-full text-sm font-semibold bg-white border border-header/20 text-header hover:bg-header/5"
            >
              Print Recipe
            </button>
          </div>
          {/* Using a div with prose for better formatting from markdown */}
          <div className="prose prose-sm max-w-none text-dark/90">
            {(showTranslated && translated ? translated : recipe).split('\n').map((line, index) => {
              if (line.startsWith('###') || line.startsWith('##') || line.startsWith('#')) {
                return <h3 key={index} className="font-extrabold text-header">{line.replace(/#/g, '').trim()}</h3>;
              }
              if (line.startsWith('* ') || line.startsWith('- ')) {
                return <li key={index}>{line.substring(2)}</li>;
              }
              return <p key={index}>{line}</p>;
            })}
          </div>
          {/* Cooking Mode: Extract steps and render stepper */}
          <CookingMode recipe={recipe} />

          {/* Nutrition Snapshot */}
          {(analyzing || nutrition) && (
            <div className="mt-6 p-4 rounded-2xl bg-white/80 border border-white/60">
              <h4 className="font-bold text-header mb-2">Nutrition Snapshot</h4>
              {analyzing && !nutrition && (
                <div className="text-sm text-header/70">Analyzing nutrition…</div>
              )}
              {nutrition && (
                <div className="space-y-2 text-sm text-header/90">
                  {nutrition.summary && <div className="text-header/80">{nutrition.summary}</div>}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <MacroPill label="Calories" value={nutrition.calories} unit="kcal" color="bg-amber-100 text-amber-900"/>
                    <MacroPill label="Protein" value={nutrition.protein_g} unit="g" color="bg-emerald-100 text-emerald-900"/>
                    <MacroPill label="Carbs" value={nutrition.carbs_g} unit="g" color="bg-sky-100 text-sky-900"/>
                    <MacroPill label="Fat" value={nutrition.fat_g} unit="g" color="bg-rose-100 text-rose-900"/>
                  </div>
                  {Array.isArray(nutrition.tags) && nutrition.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {nutrition.tags.slice(0,6).map((t,i) => (
                        <span key={i} className="px-2 py-1 rounded-full text-xs bg-header/10 text-header/80">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Smart Substitutions */}
          {(analyzing || (subs && Array.isArray(subs.substitutions))) && (
            <div className="mt-4 p-4 rounded-2xl bg-white/80 border border-white/60">
              <h4 className="font-bold text-header mb-2">Smart Substitutions</h4>
              {analyzing && !(subs && subs.substitutions) && (
                <div className="text-sm text-header/70">Generating smart swaps…</div>
              )}
              {subs && Array.isArray(subs.substitutions) && subs.substitutions.length > 0 && (
                <ul className="space-y-2 text-sm">
                  {subs.substitutions.slice(0,5).map((s, i) => (
                    <li key={i} className="bg-white/70 border border-white/60 rounded-xl p-3">
                      <div className="font-semibold text-header">{s.item}</div>
                      {Array.isArray(s.alternatives) && s.alternatives.length > 0 && (
                        <div className="text-header/80">Alternatives: {s.alternatives.slice(0,3).join(', ')}</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CookingMode({ recipe }) {
  const [open, setOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const steps = React.useMemo(() => {
    const lines = recipe.split('\n');
    const startIdx = lines.findIndex(l => /^##\s*Instructions/i.test(l.trim()));
    if (startIdx === -1) return [];
    const after = lines.slice(startIdx + 1);
    const stepLines = after.filter(l => /^\d+\./.test(l.trim()) || /^[-*]\s+/.test(l.trim()));
    return stepLines.map(l => l.replace(/^\d+\.|^[-*]\s+/, '').trim()).filter(Boolean);
  }, [recipe]);

  if (!steps.length) return null;

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen(v => !v)}
        className="px-4 py-2 rounded-full bg-header text-white font-semibold hover:bg-accent transition"
      >
        {open ? 'Hide Cooking Mode' : 'Start Cooking Mode'}
      </button>
      {open && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => {
                try {
                  window.speechSynthesis.cancel();
                  setSpeaking(false);
                } catch (_) {}
              }}
              className="px-3 py-1.5 rounded-full text-sm font-semibold bg-white border border-header/20 text-header hover:bg-header/5"
            >
              Stop Voice
            </button>
            <button
              onClick={() => {
                if (!steps.length) return;
                try {
                  window.speechSynthesis.cancel();
                  const utter = new SpeechSynthesisUtterance(steps[currentIdx]);
                  utter.onend = () => setSpeaking(false);
                  setSpeaking(true);
                  window.speechSynthesis.speak(utter);
                } catch (_) {}
              }}
              className="px-3 py-1.5 rounded-full text-sm font-semibold bg-white border border-header/20 text-header hover:bg-header/5"
            >
              Read Current Step
            </button>
            <button
              onClick={() => setCurrentIdx(i => (i > 0 ? i - 1 : 0))}
              className="px-3 py-1.5 rounded-full text-sm font-semibold bg-white border border-header/20 text-header hover:bg-header/5"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentIdx(i => (i < steps.length - 1 ? i + 1 : i))}
              className="px-3 py-1.5 rounded-full text-sm font-semibold bg-white border border-header/20 text-header hover:bg-header/5"
            >
              Next
            </button>
            <span className="text-xs text-header/60">Step {steps.length ? currentIdx + 1 : 0}/{steps.length}</span>
          </div>
          <ol className="space-y-3">
            {steps.map((s, i) => (
              <li key={i} className={`flex items-start gap-3 p-3 rounded-xl border shadow-sm ${i === currentIdx ? 'bg-accent/10 border-accent/30' : 'bg-white/80 border-white/50'}`}>
                <span className="min-w-6 h-6 rounded-full bg-accent/15 text-accent font-bold text-sm flex items-center justify-center">{i + 1}</span>
                <span className="text-sm text-header/90">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function MacroPill({ label, value, unit, color }) {
  const v = typeof value === 'number' ? value : (value ? Number(value) : null);
  return (
    <div className={`rounded-lg px-3 py-2 ${color} flex items-baseline gap-1`}>
      <span className="text-xs font-semibold opacity-80">{label}</span>
      <span className="text-sm font-bold">{v ?? '—'}</span>
      <span className="text-[11px] opacity-70">{v != null ? unit : ''}</span>
    </div>
  );
}
