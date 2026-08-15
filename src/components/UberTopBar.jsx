import React, { useState } from 'react';
import { Plane, Moon, Sun, MapPin, CloudRain, SunMedium, Info, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function UberTopBar({ weather }) {
  const { isDark, toggleTheme } = useTheme();
  const [showWeatherModal, setShowWeatherModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-black/80 border-b border-slate-200 dark:border-[#222222] transition-colors">
        <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
          
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-sm shadow-sm">
              <Plane className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                  FlightRest
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#222222] text-slate-600 dark:text-slate-400">
                  BKK
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Bangkok Base (UTC+7)
              </span>
            </div>
          </div>

          {/* Right Actions: Compact Weather Pill & Theme Switcher */}
          <div className="flex items-center gap-2">
            {weather && (
              <button
                onClick={() => setShowWeatherModal(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#161616] hover:bg-slate-200 dark:hover:bg-[#222222] border border-slate-200 dark:border-[#2a2a2a] text-xs font-semibold text-slate-800 dark:text-slate-200 transition active:scale-95 cursor-pointer"
                title="ดูพยากรณ์อากาศกรุงเทพฯ วันพรุ่งนี้"
              >
                <SunMedium className="w-3.5 h-3.5 text-amber-500" />
                <span className="tabular-nums">{weather.minTemp}°-{weather.maxTemp}°C</span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-sky-600 dark:text-sky-400 font-bold">{weather.rainProb}%</span>
              </button>
            )}

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#161616] hover:bg-slate-200 dark:hover:bg-[#222222] border border-slate-200 dark:border-[#2a2a2a] flex items-center justify-center text-slate-700 dark:text-slate-200 transition active:scale-90"
              title={isDark ? "สลับเป็น Light Mode" : "สลับเป็น Dark Mode"}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>

        </div>
      </header>

      {/* Weather Modal Popup */}
      {showWeatherModal && weather && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div 
            className="fixed inset-0" 
            onClick={() => setShowWeatherModal(false)}
          ></div>

          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#292929] p-5 shadow-2xl z-10 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222222] pb-3">
              <div className="flex items-center gap-2">
                <SunMedium className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  พยากรณ์อากาศกรุงเทพฯ พรุ่งนี้
                </h3>
              </div>
              <button
                onClick={() => setShowWeatherModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1c1c1c] border border-slate-100 dark:border-[#262626]">
                <span className="font-medium text-slate-500 dark:text-slate-400">สภาพอากาศ:</span>
                <span className="font-bold text-slate-900 dark:text-white">{weather.label}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1c1c1c] border border-slate-100 dark:border-[#262626]">
                <span className="font-medium text-slate-500 dark:text-slate-400">อุณหภูมิ:</span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">{weather.minTemp}°C - {weather.maxTemp}°C</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1c1c1c] border border-slate-100 dark:border-[#262626]">
                <span className="font-medium text-slate-500 dark:text-slate-400">โอกาสเกิดฝน:</span>
                <span className="font-bold text-sky-600 dark:text-sky-400 tabular-nums">{weather.rainProb}%</span>
              </div>

              {/* Advisory */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong>คำแนะนำ:</strong> {weather.travelTip}
              </div>
            </div>

            <button
              onClick={() => setShowWeatherModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition active:scale-95"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </>
  );
}
