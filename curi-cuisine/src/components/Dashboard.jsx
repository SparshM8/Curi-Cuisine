import React, { useState, useEffect } from "react";
import { FaUtensils, FaLeaf, FaRecycle } from "react-icons/fa";

function InsightCard({ icon, label, value, color, unit = '' }) {
  const displayValue = Number.isFinite(value) ? value.toFixed(1) : '0.0';
  return (
    <div className="relative group rounded-2xl p-[1px] bg-gradient-to-br from-white/40 to-white/10 shadow-inner overflow-hidden">
      <div className="rounded-2xl h-full w-full bg-white/70 backdrop-blur-xl p-6 flex flex-col gap-4 shadow-[0_4px_20px_-4px_#2B677711] relative overflow-hidden">
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${color} mix-blend-soft-light`} />
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/15 to-gold/15 flex items-center justify-center text-xl text-header">{icon}</div>
          <div className="text-3xl font-extrabold bg-gradient-to-r from-header via-accent to-gold bg-clip-text text-transparent drop-shadow-sm">
            {displayValue}{unit}
          </div>
        </div>
        <div className="font-semibold text-header tracking-wide text-sm uppercase opacity-70">{label}</div>
        <div className="mt-auto">
          <div className="h-2 w-full rounded-full bg-header/10 overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${Math.min(100, parseFloat(displayValue) * 8)}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({ mealsSaved: 0, wasteReduced: 0, recipesTried: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/statistics');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats.recipesTried) {
    return (
      <div className="grid gap-8 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl bg-white/50 p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-header/10"></div>
              <div className="w-16 h-8 rounded bg-header/10"></div>
            </div>
            <div className="w-24 h-4 rounded bg-header/10"></div>
            <div className="mt-4 h-2 w-full rounded-full bg-header/10"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <InsightCard icon={<FaUtensils />} label="Meals Saved" value={stats.mealsSaved} color="from-accent to-emerald-500" />
      <InsightCard icon={<FaLeaf />} label="Waste Reduced" value={stats.wasteReduced} unit="kg" color="from-gold to-orange-400" />
      <InsightCard icon={<FaRecycle />} label="Recipes Generated" value={stats.recipesTried} color="from-header to-accent" />
    </div>
  );
}
