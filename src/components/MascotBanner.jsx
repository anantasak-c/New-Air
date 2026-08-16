import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sparkles, Heart } from 'lucide-react';

export default function MascotBanner() {
  const { activeTheme } = useTheme();

  if (!activeTheme.mascot) return null;

  return (
    <div className="w-full rounded-2xl p-3.5 sm:p-4 border transition-all animate-fade-in flex items-center gap-3.5 shadow-sm bg-white/90 dark:bg-[#161329]/90 border-pink-200 dark:border-purple-800/50">
      
      {/* Mascot Avatar */}
      <div className="relative shrink-0">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-white dark:border-purple-500 shadow-md">
          <img 
            src={activeTheme.mascot.image} 
            alt={activeTheme.mascot.name} 
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-purple-950 border border-slate-200 dark:border-purple-800 flex items-center justify-center text-[10px]">
          {activeTheme.icon}
        </div>
      </div>

      {/* Greeting Bubble */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
            {activeTheme.mascot.name}
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-pink-100 dark:bg-purple-900/50 text-pink-700 dark:text-purple-300 font-semibold shrink-0">
            Crew Mate
          </span>
        </div>
        <p className="text-xs text-slate-700 dark:text-purple-200 leading-relaxed font-medium">
          "{activeTheme.mascot.quote}"
        </p>
      </div>

    </div>
  );
}
