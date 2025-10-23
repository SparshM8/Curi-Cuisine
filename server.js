// Simple Express server to serve API endpoints and static frontend
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const envPath = path.join(__dirname, '.env');
// Load env from the project root explicitly to avoid CWD issues
dotenv.config({ path: envPath });

// Manual .env parser fallback with BOM handling and minimal diagnostics
try {
  if (!process.env.GEMINI_API_KEY && fs.existsSync(envPath)) {
    let raw = fs.readFileSync(envPath, 'utf8');
    // Strip BOM if present
    if (raw && raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    raw.split(/\r?\n/).forEach(line => {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m) {
        const k = m[1];
        let v = m[2];
        // Strip surrounding quotes if present
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        if (!process.env[k]) process.env[k] = v;
      }
    });
  }
} catch (_) { /* ignore */ }

// Minimal startup diagnostics (non-sensitive)
try {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  const keyLen = hasKey ? String(process.env.GEMINI_API_KEY).length : 0;
  console.log(`[env] .env at ${envPath} exists=${fs.existsSync(envPath)} GEMINI_API_KEY=${hasKey ? 'present(len=' + keyLen + ')' : 'missing'}`);
} catch (_) { /* ignore */ }

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Simple request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Quick config check (do not leak actual keys)
app.get('/api/config-check', (_req, res) => {
  const key = process.env.GEMINI_API_KEY;
  res.json({
    hasGeminiKey: Boolean(key),
    keyLength: key ? key.length : 0,
    hasVisionKey: Boolean(process.env.GOOGLE_VISION_KEY),
    port: process.env.PORT || 3001,
  });
});

// --- New Database API Endpoints ---
const db = require('./curi-cuisine/api/db');

// Ensure global fetch exists for Node <18 (fallback to node-fetch)
if (typeof fetch === 'undefined') {
  global.fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
}

// Get all ingredients
app.get('/api/ingredients', async (_req, res) => {
  await db.read();
  res.json(db.data.ingredients);
});

// Get statistics
app.get('/api/statistics', async (_req, res) => {
  await db.read();
  res.json(db.data.statistics);
});

// Update statistics
app.post('/api/statistics', async (req, res) => {
  const { mealsSaved, wasteReduced, recipesTried } = req.body;
  await db.read();
  const stats = db.data.statistics;
  if (mealsSaved) stats.mealsSaved += mealsSaved;
  if (wasteReduced) stats.wasteReduced += wasteReduced;
  if (recipesTried) stats.recipesTried += recipesTried;
  await db.write();
  res.json(stats);
});

// Add an ingredient
app.post('/api/ingredients', async (req, res) => {
  const { name, category = 'Pantry' } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Ingredient name is required.' });
  }
  await db.read();
  const newIngredient = {
    id: name.toLowerCase().replace(/\s+/g, '_'),
    name,
    category,
  };
  // Avoid duplicates
  if (db.data.ingredients.some(ing => ing.id === newIngredient.id)) {
    return res.status(409).json({ message: 'Ingredient already exists.' });
  }
  db.data.ingredients.push(newIngredient);
  await db.write();
  res.status(201).json(newIngredient);
});

// --- Recipe History Endpoints ---
// List recipes
app.get('/api/recipes', async (_req, res) => {
  await db.read();
  res.json(db.data.recipes || []);
});

// Add a recipe
app.post('/api/recipes', async (req, res) => {
  const { title, body, ingredients = [], source = 'manual' } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: 'title and body are required' });
  await db.read();
  const item = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    title,
    body,
    ingredients,
    source,
    createdAt: new Date().toISOString(),
  };
  db.data.recipes = db.data.recipes || [];
  db.data.recipes.unshift(item);
  await db.write();
  res.status(201).json(item);
});

// Delete a recipe
app.delete('/api/recipes/:id', async (req, res) => {
  const { id } = req.params;
  await db.read();
  const before = (db.data.recipes || []).length;
  db.data.recipes = (db.data.recipes || []).filter(r => r.id !== id);
  if (db.data.recipes.length === before) return res.status(404).json({ error: 'Not found' });
  await db.write();
  res.json({ ok: true });
});

// Clear all recipes
app.delete('/api/recipes', async (_req, res) => {
  await db.read();
  db.data.recipes = [];
  await db.write();
  res.json({ ok: true });
});

// Import API handlers (converted ESM default exports to usage here)
const generateHandler = require('./curi-cuisine/api/generate');
const analyzeHandler = require('./curi-cuisine/api/analyze');
const translateHandler = require('./curi-cuisine/api/translate');
const visionHandler = require('./curi-cuisine/api/vision');

// API routes with basic validation wrappers
app.post('/api/generate', async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set in environment.' });
  }
  return generateHandler.default(req, res);
});

app.post('/api/vision', async (req, res) => {
  if (!process.env.GOOGLE_VISION_KEY) {
    return res.status(500).json({ error: 'GOOGLE_VISION_KEY not set in environment.' });
  }
  return visionHandler.default(req, res);
});

// Nutrition / substitutions analysis
app.post('/api/analyze', async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    // handler has heuristic fallback but we keep UX consistent
    console.warn('GEMINI_API_KEY not set; analyze will use heuristic fallback');
  }
  return analyzeHandler.default(req, res);
});

// Translate recipe to a target language
app.post('/api/translate', async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not set; translate will echo original text');
  }
  return translateHandler.default(req, res);
});

// Quick diagnose endpoint to verify upstream connectivity
app.get('/api/diagnose/llm', async (_req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) return res.status(400).json({ ok: false, reason: 'missing_key' });
    const ping = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const status = ping.status;
    res.json({ ok: status >= 200 && status < 300, status });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Lightweight internet data fetch for enrichment
app.get('/api/webinfo', async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (!q) return res.status(400).json({ error: 'Missing q' });
  try {
    const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`;
    const response = await fetch(url);
    const data = await response.json();
    const meals = (data.meals || []).slice(0, 3).map(m => ({
      id: m.idMeal,
      name: m.strMeal,
      category: m.strCategory,
      area: m.strArea,
      instructions: (m.strInstructions || '').split('\r\n').slice(0, 6).join(' '),
      source: m.strSource,
      youtube: m.strYoutube,
    }));
    res.json({ meals });
  } catch (err) {
    console.error('webinfo error', err);
    res.status(500).json({ error: 'Failed to fetch web info' });
  }
});

// Static frontend (only if build exists)
const distPath = path.join(__dirname, 'curi-cuisine', 'dist');
app.use(express.static(distPath));
app.use('/assets', express.static(path.join(distPath, 'assets')));

// SPA fallback
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// 404 for any unmatched API route
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
