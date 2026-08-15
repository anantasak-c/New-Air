import React from 'react';
import { Plane, Moon, Sun, MapPin, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function UberTopBar({ weather }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-black/80 dark:bg-black/80 border-b border-[#222222] dark:border-[#222222] transition-colors">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Brand & Base Status */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white dark:bg-white text-black flex items-center justify-center font-black text-lg shadow-sm">
            ✈️
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">
                FlightRest
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#222222] text-[#a6a6a6]">
                Pro
              </span>
            </div>
            <p className="text-[11px] text-[#a6a6a6] flex items-center gap-1">
              <MapPin className="w-3 h-3 text-uber-blue" />
              <span>Base: Bangkok (BKK)</span>
            </p>
          </div>
        </div>

        {/* Right Actions: Weather Pill & Theme Toggle */}
        <div className="flex items-center gap-2">
          {weather && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#141414] border border-[#292929] text-xs font-semibold text-white">
              <span>{weather.iconName === 'Sun' || weather.iconName === 'SunMedium' ? '☀️' : '🌤️'}</span>
              <span>{weather.minTemp}° - {weather.maxTemp}°C</span>
              <span className="text-[#6b6b6b]">•</span>
              <span className="text-sky-400">ฝน {weather.rainProb}%</span>
            </div>
          )}

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full bg-[#141414] dark:bg-[#141414] border border-[#292929] dark:border-[#292929] flex items-center justify-center text-white hover:bg-[#1f1f1f] transition active:scale-90"
            title={isDark ? "สลับเป็น Light Mode" : "สลับเป็น Dark Mode"}
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-300" />
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
