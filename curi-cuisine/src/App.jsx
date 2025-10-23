import React, { useState } from "react";
import { FaLeaf, FaUtensils, FaRecycle, FaGithub, FaTwitter, FaEnvelope, FaCamera, FaMicrophoneAlt, FaBars, FaTimes } from "react-icons/fa";
import IngredientBank from "./components/IngredientBank";
import CameraScanner from "./components/CameraScanner";
import VoiceInput from "./components/VoiceInput";
import RecipePanel from "./components/RecipePanel";
import RecipeHistory from "./components/RecipeHistory";
import Dashboard from "./components/Dashboard";
import EnvStatus from "./components/EnvStatus";
import HeroThreeBG from "./components/HeroThreeBG";
import ToastCenter from "./components/ToastCenter";

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Helper for smooth scroll to top of section
  const handleNavClick = (e, target) => {
    e.preventDefault();
    const el = document.getElementById(target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.scrollTo({ top: el.offsetTop - 20, behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gradient-start via-[#FFF9E6] to-gradient-end font-poppins text-dark">
      <ToastCenter />
      {/* Navbar */}
      <nav className="w-full sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-white/60 shadow-lg transition-all duration-300">
        <div className="max-w-6xl mx-auto px-5 py-4 flex flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 font-extrabold text-xl md:text-2xl tracking-tight text-header">
            <button
              onClick={e => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-accent/40 px-2 py-1 rounded-lg bg-transparent border-none cursor-pointer"
              aria-label="Go to top"
              style={{ background: "none", border: "none" }}
            >
              <span className="text-3xl">🍳</span>
              <span className="bg-gradient-to-r from-header via-accent to-gold bg-clip-text text-transparent">Curi-Cuisine</span>
            </button>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-header/80">
            <a href="#ingredients" onClick={e => handleNavClick(e, "ingredients")} className="flex items-center px-3 py-2 rounded-lg hover:text-accent transition-colors hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent/40">Ingredients</a>
            <a href="#inputs" onClick={e => handleNavClick(e, "inputs")} className="flex items-center px-3 py-2 rounded-lg hover:text-accent transition-colors hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent/40">Scan/Voice</a>
            <a href="#generate" onClick={e => handleNavClick(e, "generate")} className="flex items-center px-3 py-2 rounded-lg hover:text-accent transition-colors hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent/40">Generator</a>
            <a href="#history" onClick={e => handleNavClick(e, "history")} className="flex items-center px-3 py-2 rounded-lg hover:text-accent transition-colors hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent/40">History</a>
            <a href="#insights" onClick={e => handleNavClick(e, "insights")} className="flex items-center px-3 py-2 rounded-lg hover:text-accent transition-colors hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent/40">Sustainability</a>
          </div>
          <div className="flex items-center gap-4">
            <EnvStatus />
            <a 
              href="#generate" 
              onClick={e => handleNavClick(e, "generate")}
              className="hidden sm:inline-block bg-gradient-to-r from-accent via-gold to-orange-400 bg-[length:200%_200%] animate-[shimmer_6s_linear_infinite] text-white font-bold px-6 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              Get Started
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-2xl text-header hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-lg border-b border-white/60 shadow-xl">
            <div className="flex flex-col py-4 px-5 gap-4">
              <a href="#ingredients" onClick={e => handleNavClick(e, "ingredients")} className="text-base font-semibold text-header hover:text-accent transition-colors py-2">🥗 Ingredients</a>
              <a href="#inputs" onClick={e => handleNavClick(e, "inputs")} className="text-base font-semibold text-header hover:text-accent transition-colors py-2">📸 Scan & Voice</a>
              <a href="#generate" onClick={e => handleNavClick(e, "generate")} className="text-base font-semibold text-header hover:text-accent transition-colors py-2">⚡ Generator</a>
              <a href="#history" onClick={e => handleNavClick(e, "history")} className="text-base font-semibold text-header hover:text-accent transition-colors py-2">📚 History</a>
              <a href="#insights" onClick={e => handleNavClick(e, "insights")} className="text-base font-semibold text-header hover:text-accent transition-colors py-2">🌱 Sustainability</a>
              <a href="#generate" onClick={e => handleNavClick(e, "generate")} className="mt-2 text-center bg-gradient-to-r from-accent via-gold to-orange-400 text-white font-bold px-6 py-3 rounded-full shadow-lg">Get Started</a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-to-br from-gradient-start via-white to-gradient-end">
        <HeroThreeBG />
        <div className="absolute inset-0 pointer-events-none select-none opacity-30 bg-[radial-gradient(circle_at_30%_40%,#FFD70033,transparent_60%),radial-gradient(circle_at_70%_60%,#5ED8A333,transparent_55%)]" />
        <div className="max-w-5xl mx-auto px-6 pt-20 md:pt-28 pb-14 md:pb-20 text-center relative z-10">
          <div className="inline-block mb-4 px-4 py-2 bg-accent/10 border border-accent/30 rounded-full text-sm font-semibold text-accent">
            ✨ AI-Powered Kitchen Intelligence
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight bg-gradient-to-r from-header via-accent to-gold bg-clip-text text-transparent drop-shadow-sm mb-6">
            Turn Ingredients into<br />Amazing Recipes with AI 🍳
          </h1>
          <p className="mt-6 text-xl md:text-2xl text-header/70 max-w-3xl mx-auto leading-relaxed">
            Waste less, cook smarter, and explore sustainable dishes personalized by intelligent ingredient analysis.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href="#ingredients" className="px-8 py-4 rounded-full font-bold text-lg bg-header text-white shadow-lg hover:bg-accent hover:shadow-xl hover:scale-105 transition-all duration-300">
              🥗 Select Ingredients
            </a>
            <a href="#generate" className="px-8 py-4 rounded-full font-bold text-lg bg-gradient-to-r from-gold via-accent to-orange-400 bg-[length:200%_200%] animate-[shimmer_6s_linear_infinite] text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              ⚡ Generate Recipe Now
            </a>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm font-semibold text-header/60">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
              AI-Powered
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse"></span>
              Zero Waste
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-header animate-pulse"></span>
              Sustainable
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 pb-20 space-y-20">
        {/* Ingredient Selection */}
        <section id="ingredients" className="scroll-mt-28">
          <div className="rounded-3xl border border-white/50 bg-white/70 backdrop-blur-xl shadow-[0_8px_40px_-8px_#2B677711] p-8 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-gold/30 to-accent/20 rounded-full blur-2xl" />
            <h2 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3 mb-6 text-header">
              <span className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-gold text-white shadow-md">🥗</span>
              Ingredient Selection
            </h2>
            <IngredientBank />
          </div>
        </section>

        {/* Input Methods */}
        <section id="inputs" className="scroll-mt-28">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="group rounded-3xl relative border border-white/60 bg-white/70 backdrop-blur-xl p-7 shadow-[0_4px_30px_-4px_#2B677711] overflow-hidden">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-gold/10 to-accent/10 pointer-events-none" />
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-extrabold text-header flex items-center gap-2"><FaCamera className="text-accent" /> Camera Scan</h3>
                <span className="px-3 py-1 text-xs font-semibold bg-accent/15 text-accent rounded-full">Beta</span>
              </div>
              <CameraScanner />
            </div>
            <div className="group rounded-3xl relative border border-white/60 bg-white/70 backdrop-blur-xl p-7 shadow-[0_4px_30px_-4px_#2B677711] overflow-hidden">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-gold/10 to-accent/10 pointer-events-none" />
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-extrabold text-header flex items-center gap-2"><FaMicrophoneAlt className="text-accent" /> Voice Input</h3>
                <span className="px-3 py-1 text-xs font-semibold bg-gold/15 text-header rounded-full">Live</span>
              </div>
              <VoiceInput />
            </div>
          </div>
        </section>

        {/* Generator */}
        <section id="generate" className="scroll-mt-28">
          <div className="rounded-3xl relative border border-white/60 bg-white/70 backdrop-blur-xl p-8 shadow-[0_4px_40px_-4px_#2B677711] overflow-hidden">
            <div className="absolute -bottom-14 -left-14 w-56 h-56 bg-gradient-to-tr from-accent/25 to-gold/25 rounded-full blur-3xl" />
            <h2 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3 mb-6 text-header">
              <span className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-accent text-header font-black shadow-md">AI</span>
              Recipe Generator
            </h2>
            <RecipePanel />
          </div>
        </section>

        {/* Recipe History */}
        <section id="history" className="scroll-mt-28">
          <RecipeHistory />
        </section>

        {/* Sustainability Dashboard */}
        <section id="insights" className="scroll-mt-28">
          <div className="rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl p-10 shadow-[0_4px_40px_-8px_#2B677711] overflow-hidden relative">
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-72 bg-gradient-to-b from-gold/20 to-transparent rounded-full blur-2xl" />
            <h2 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3 mb-6 text-header relative z-10">
              <span className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-gold text-white shadow-lg text-2xl">🌱</span>
              <div>
                <div>Sustainability Insights</div>
                <p className="text-sm font-normal text-header/60 mt-1">Your positive impact on the environment</p>
              </div>
            </h2>
            <div className="mt-10 relative z-10">
              <Dashboard />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/50 bg-white/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-10 md:items-center justify-between">
          <div>
            <div className="flex items-center gap-3 font-extrabold text-2xl text-header mb-3">
              <span className="text-4xl">🍳</span>
              <span>Curi-Cuisine</span>
            </div>
            <p className="text-header/70 text-sm max-w-md leading-relaxed">
              Empowering a waste-free generation with AI-powered kitchen intelligence. 
              Turn your ingredients into delicious, sustainable recipes.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-header/70">
            <a href="#ingredients" onClick={e => handleNavClick(e, "ingredients")} className="hover:text-accent transition">Ingredients</a>
            <a href="#generate" onClick={e => handleNavClick(e, "generate")} className="hover:text-accent transition">Generator</a>
            <a href="#history" onClick={e => handleNavClick(e, "history")} className="hover:text-accent transition">History</a>
            <a href="#insights" onClick={e => handleNavClick(e, "insights")} className="hover:text-accent transition">Insights</a>
          </div>
        </div>
        <div className="border-t border-white/40">
          <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-header/60 font-semibold">
            <div>© {new Date().getFullYear()} Curi-Cuisine — Sustainable AI Cooking</div>
            <div className="flex gap-4">
              <a href="#" className="hover:text-accent transition">Privacy Policy</a>
              <a href="#" className="hover:text-accent transition">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function InsightCard({ icon, label, value, color }) {
  return (
    <div className="relative group rounded-2xl p-[1px] bg-gradient-to-br from-white/40 to-white/10 shadow-inner overflow-hidden">
      <div className="rounded-2xl h-full w-full bg-white/70 backdrop-blur-xl p-6 flex flex-col gap-4 shadow-[0_4px_20px_-4px_#2B677711] relative overflow-hidden">
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${color} mix-blend-soft-light`} />
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/15 to-gold/15 flex items-center justify-center text-xl text-header">{icon}</div>
          <div className="text-3xl font-extrabold bg-gradient-to-r from-header via-accent to-gold bg-clip-text text-transparent drop-shadow-sm">
            {value}
          </div>
        </div>
        <div className="font-semibold text-header tracking-wide text-sm uppercase opacity-70">{label}</div>
        <div className="mt-auto">
          <div className="h-2 w-full rounded-full bg-header/10 overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${Math.min(100, value * 9)}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
