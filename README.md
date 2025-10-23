# 🍳 Curi-Cuisine

**AI-powered recipe generator to reduce food waste.**

[![React](https://img.shields.io/badge/Frontend-React-blue?logo=react)](https://react.dev/) [![Vite](https://img.shields.io/badge/Build-Vite-purple?logo=vite)](https://vitejs.dev/) [![Express](https://img.shields.io/badge/Backend-Express-green?logo=express)](https://expressjs.com/) [![Gemini API](https://img.shields.io/badge/AI-Gemini-yellow?logo=google)](https://makersuite.google.com/app/apikey)

---

## 🚀 Features
- **Ingredient Bank**: Add, scan (camera), or speak ingredients
- **AI Recipe Generator**: Multiple Gemini models, creativity controls
- **Cooking Mode**: Step-by-step, voice read-out, print-friendly
- **Recipe History**: Save, load, delete, import/export markdown
- **Nutrition & Substitutions**: AI-powered, with offline fallback
- **Sustainability Dashboard**: Track meals saved, waste reduced
- **Multi-language Translation**: Translate recipes instantly

---

## 🛠️ Setup

1. **Install Node.js 18+**
2. **Create `.env` in project root** (see `.env.example`):
   ```env
   GEMINI_API_KEY=your_google_generative_ai_key
   GOOGLE_VISION_KEY=your_google_vision_key
   PORT=3001
   ```
   *Tip: The app works in demo mode if keys are missing.*

3. **Install dependencies**:
   ```bash
   npm install
   cd curi-cuisine
   npm install
   cd ..
   npm run dev:full
   ```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:3001](http://localhost:3001)

---

## 🧪 API Endpoints
- `POST /api/generate` — Generate recipe
- `POST /api/vision` — Scan ingredients (camera)
- `GET/POST /api/ingredients` — Manage ingredients
- `GET/POST /api/statistics` — Dashboard stats
- `GET/POST/DELETE /api/recipes` — Recipe history
- `GET /api/webinfo?q=term` — Enrich with TheMealDB
- `POST /api/analyze` — Nutrition/substitutions
- `POST /api/translate` — Translate recipe
- `GET /api/config-check` — Check API keys
- `GET /api/diagnose/llm` — Gemini API health

---

## 💡 Demo Tips
- Try different Gemini models for speed/quality
- Use Cooking Mode for hands-free step navigation
- Import/export recipes as markdown
- App works offline with fallback logic

---

## 📚 Further Reading
- [Strategic Report](curi-cuisine/STRATEGIC_REPORT.md)
- [Frontend Quick Start](curi-cuisine/README.md)
- [How to Get Your API Key](GET_API_KEY.md)

---

## 📝 License
MIT
