import React, { useState } from 'react';
import { Plane, SunMedium, X, Clock, Palette, Check } from 'lucide-react';
import { useTheme, THEMES } from '../context/ThemeContext';

export default function UberTopBar({ weather }) {
  const { activeTheme, themeId, setTheme, labels } = useTheme();
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  return (
    <>
      <header 
        className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-black/80 border-b border-slate-200/80 dark:border-[#222222] transition-colors"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 6px)',
          paddingBottom: '8px'
        }}
      >
        <div className="max-w-xl mx-auto px-4 flex items-center justify-between gap-2">
          
          {/* Brand & Theme Base Label */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
              <Plane className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                  FlightRest
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#222222] text-slate-700 dark:text-slate-300">
                  {labels?.baseTag || 'BKK'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                {labels?.locationSub || 'Bangkok Base (UTC+7)'}
              </span>
            </div>
          </div>

          {/* Right Actions: Compact Weather Pill & 5-Theme Switcher */}
          <div className="flex items-center gap-1.5">
            {weather && (
              <button
                onClick={() => setShowWeatherModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 dark:bg-[#161616] hover:bg-slate-100 dark:hover:bg-[#222222] border border-slate-200 dark:border-[#2a2a2a] text-xs font-semibold text-slate-800 dark:text-slate-200 transition active:scale-95 cursor-pointer shadow-xs"
                title="แตะเพื่อดูพยากรณ์อากาศช่วงเวลาบิน (กรุงเทพฯ)"
              >
                <SunMedium className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="tabular-nums">{weather.minTemp}°-{weather.maxTemp}°C</span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-sky-600 dark:text-sky-400 font-bold">ฝน {weather.rainProb}%</span>
              </button>
            )}

            {/* 5-Theme Switcher Button */}
            <button
              onClick={() => setShowThemeModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 dark:bg-[#161616] hover:bg-slate-100 dark:hover:bg-[#222222] border border-slate-200 dark:border-[#2a2a2a] text-xs font-bold text-slate-800 dark:text-slate-200 transition active:scale-95 cursor-pointer shadow-xs"
              title="เลือกธีมของแอพ (5 สไตล์)"
              aria-label="Select Theme"
            >
              <span>{activeTheme.icon}</span>
              <span className="hidden sm:inline text-[11px] font-medium">{activeTheme.name}</span>
            </button>
          </div>

        </div>
      </header>

      {/* 5-Theme Selection Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div 
            className="fixed inset-0" 
            onClick={() => setShowThemeModal(false)}
          ></div>

          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#292929] p-5 shadow-2xl z-10 space-y-4 animate-slide-up">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222222] pb-3">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-slate-900 dark:text-white" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  เลือกธีมของแอพ (5 สไตล์)
                </h3>
              </div>
              <button
                onClick={() => setShowThemeModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 5 Theme Options */}
            <div className="space-y-2">
              {THEMES.map((theme) => {
                const isSelected = theme.id === themeId;
                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setTheme(theme.id);
                      setShowThemeModal(false);
                    }}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-[#1f1f1f] shadow-sm font-bold'
                        : 'border-slate-200 dark:border-[#262626] bg-slate-50 dark:bg-[#161616] hover:bg-slate-100 dark:hover:bg-[#1c1c1c]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-white dark:bg-black border border-slate-200 dark:border-[#333333] shadow-xs shrink-0">
                        {theme.icon}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          {theme.name}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-normal">
                          {theme.description}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-slate-900 dark:text-white shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowThemeModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-bold transition active:scale-95"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}

      {/* Weather Modal Popup with Detailed Hourly +-3h Breakdown */}
      {showWeatherModal && weather && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div 
            className="fixed inset-0" 
            onClick={() => setShowWeatherModal(false)}
          ></div>

          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#141414] border border-slate-200 dark:border-[#292929] p-5 shadow-2xl z-10 space-y-4 animate-slide-up max-h-[85vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222222] pb-3">
              <div className="flex items-center gap-2">
                <SunMedium className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {labels?.weatherPopupTitle || 'พยากรณ์อากาศช่วงเวลาเดินทาง (กรุงเทพฯ)'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    ฐานการบินกรุงเทพฯ (Bangkok BKK)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWeatherModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* General Conditions */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1c1c1c] border border-slate-100 dark:border-[#262626]">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">อุณหภูมิ:</span>
                <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                  {weather.minTemp}°C - {weather.maxTemp}°C
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1c1c1c] border border-slate-100 dark:border-[#262626]">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">โอกาสเกิดฝนสูงสุด:</span>
                <span className="text-base font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                  {weather.rainProb}%
                </span>
              </div>
            </div>

            {/* Hourly Window Timeline (±3 Hours around flight) */}
            {weather.hourlyWindow && weather.hourlyWindow.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-uber-blue" />
                  สภาพอากาศช่วงเวลาเตรียมตัวบิน (±3 ชั่วโมง):
                </span>

                <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
                  {weather.hourlyWindow.map((hourItem, idx) => (
                    <div
                      key={idx}
                      className={`shrink-0 w-20 p-2.5 rounded-xl border text-center text-xs space-y-1 ${
                        hourItem.isDeparture
                          ? 'bg-purple-500/10 border-purple-500/40 text-purple-900 dark:text-purple-300 ring-1 ring-purple-500/30 font-bold'
                          : hourItem.isReport
                            ? 'bg-pink-500/10 border-pink-500/40 text-pink-900 dark:text-pink-300 ring-1 ring-pink-500/30 font-bold'
                            : 'bg-slate-50 dark:bg-[#1c1c1c] border-slate-200 dark:border-[#2a2a2a] text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span className="text-[11px] font-bold block tabular-nums">
                        {hourItem.hourLabel}
                      </span>
                      <span className="text-[10px] block opacity-80 font-medium">
                        {hourItem.isDeparture ? 'ออกบ้าน' : hourItem.isReport ? 'เริ่มงาน' : '—'}
                      </span>
                      <span className="text-sm block">
                        {hourItem.isRain ? '🌧️' : '☀️'}
                      </span>
                      <span className="text-[11px] font-bold block tabular-nums">
                        {hourItem.temp}°C
                      </span>
                      <span className={`text-[10px] font-bold block tabular-nums ${
                        hourItem.rainProb >= 40 ? 'text-rose-500' : 'text-sky-500'
                      }`}>
                        ฝน {hourItem.rainProb}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Travel Advisory for Flight */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 leading-relaxed space-y-1">
              <strong className="block text-slate-900 dark:text-white">คำแนะนำสภาพอากาศ:</strong>
              <p>{weather.windowSummary || weather.travelTip}</p>
            </div>

            <button
              onClick={() => setShowWeatherModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-bold transition active:scale-95"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </>
  );
}
