import React, { useEffect, useState } from 'react';
import { 
  Sun, 
  SunMedium, 
  Cloud, 
  CloudSun, 
  CloudRain, 
  CloudDrizzle, 
  CloudFog, 
  CloudLightning, 
  Umbrella, 
  RefreshCw,
  Info,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { fetchBangkokTomorrowWeather } from '../services/weatherService';

const ICON_COMPONENTS = {
  Sun: Sun,
  SunMedium: SunMedium,
  Cloud: Cloud,
  CloudSun: CloudSun,
  CloudRain: CloudRain,
  CloudDrizzle: CloudDrizzle,
  CloudFog: CloudFog,
  CloudLightning: CloudLightning,
};

export default function WeatherBadge({ onWeatherLoaded }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  const loadWeather = async () => {
    setLoading(true);
    const data = await fetchBangkokTomorrowWeather();
    setWeather(data);
    if (onWeatherLoaded) onWeatherLoaded(data);
    setLoading(false);
  };

  useEffect(() => {
    loadWeather();
  }, []);

  if (loading) {
    return (
      <div className="w-full p-4 rounded-2xl bg-[#141414] dark:bg-[#141414] border border-[#292929] text-xs text-[#a6a6a6] flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-uber-blue" />
          <span>กำลังโหลดสภาพอากาศกรุงเทพฯ (Open-Meteo)...</span>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const WeatherIcon = ICON_COMPONENTS[weather.iconName] || CloudSun;

  return (
    <div className="w-full rounded-2xl bg-[#141414] dark:bg-[#141414] border border-[#292929] p-4 transition-all shadow-uber-sm">
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Left: Weather Condition & Temperature */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#1f1f1f] border border-[#333333] flex items-center justify-center">
            <WeatherIcon className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#a6a6a6] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-uber-blue" />
                กรุงเทพฯ วันพรุ่งนี้
              </span>
              <span className="text-[10px] px-1.5 py-0.2 bg-[#262626] text-[#a6a6a6] rounded font-mono">
                Open-Meteo
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black tracking-tight text-white">
                {weather.minTemp}° - {weather.maxTemp}°C
              </span>
              <span className="text-xs font-semibold text-[#a6a6a6]">
                {weather.label}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Rain Pill & Expand Action */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1f1f1f] border border-[#333333] text-xs font-bold text-sky-400">
            <Umbrella className="w-3.5 h-3.5" />
            <span>ฝน {weather.rainProb}%</span>
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 rounded-xl bg-[#1f1f1f] hover:bg-[#262626] border border-[#333333] text-white transition active:scale-95"
            title="ดูคำแนะนำการเดินทาง"
          >
            <Info className="w-4 h-4 text-[#a6a6a6]" />
          </button>

          <button
            onClick={loadWeather}
            className="p-2 rounded-xl bg-[#1f1f1f] hover:bg-[#262626] border border-[#333333] text-white transition active:scale-95"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className="w-4 h-4 text-[#a6a6a6]" />
          </button>
        </div>
      </div>

      {/* Expandable Advisory Box */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-[#262626] text-xs leading-relaxed text-[#a6a6a6] bg-[#1a1a1a] p-3 rounded-xl border border-[#333333] animate-fade-in flex items-start gap-2">
          <span className="text-sm shrink-0">💡</span>
          <div>
            <strong className="text-white">คำแนะนำการเดินทาง:</strong> {weather.travelTip}
          </div>
        </div>
      )}
    </div>
  );
}
