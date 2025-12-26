import assert from 'assert';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function checkHealth() {
  const res = await fetch(`${BASE}/api/health`);
  assert(res.ok, '/api/health not ok');
  const j = await res.json();
  console.log('/api/health', j.status);
}

async function checkConfig() {
  const res = await fetch(`${BASE}/api/config-check`);
  assert(res.ok, '/api/config-check not ok');
  const j = await res.json();
  console.log('/api/config-check', j);
}

async function checkIngredients() {
  const res = await fetch(`${BASE}/api/ingredients`);
  assert(res.ok, '/api/ingredients not ok');
  const j = await res.json();
  console.log('/api/ingredients length', (j || []).length);
}

async function checkGenerate() {
  const res = await fetch(`${BASE}/api/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: 'Make me a 2-ingredient salad' }) });
  if (res.status === 400) {
    // no key configured
    console.warn('/api/generate returned 400 (likely missing GEMINI key)');
    return;
  }
  assert(res.ok, '/api/generate not ok');
  const j = await res.json();
  console.log('/api/generate recipe length', (j.recipe || '').slice(0, 80));
}

async function checkTranslate() {
  const res = await fetch(`${BASE}/api/translate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'Hello world', target: 'es' }) });
  assert(res.ok, '/api/translate not ok');
  const j = await res.json();
  console.log('/api/translate', j.text ? (j.text.slice(0, 80)) : 'no text');
}

async function checkRecipeCRUD() {
  // Create
  const create = await fetch(`${BASE}/api/recipes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'QA Test', body: 'Just a test', ingredients: ['rice'] }) });
  if (!create.ok) {
    const text = await create.text();
    throw new Error('/api/recipes POST failed: ' + create.status + ' ' + text);
  }
  const created = await create.json();
  console.log('/api/recipes created id', created.id);

  // List and verify
  const list = await fetch(`${BASE}/api/recipes`);
  assert(list.ok, '/api/recipes GET failed');
  const arr = await list.json();
  const found = arr.find(r => r.id === created.id);
  assert(found, 'Created recipe not found in list');

  // Delete
  const del = await fetch(`${BASE}/api/recipes/${created.id}`, { method: 'DELETE' });
  assert(del.ok, '/api/recipes DELETE failed');
  console.log('/api/recipes delete ok');
}

async function run() {
  try {
    await checkHealth();
    await checkConfig();
    await checkIngredients();
    await checkGenerate();
    await checkTranslate();
    await checkRecipeCRUD();
    console.log('\nQA checks completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('QA check failed:', err.message || err);
    process.exit(2);
  }
}

run();
