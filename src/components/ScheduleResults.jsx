import React, { useState } from 'react';
import { 
  Sun, 
  Moon, 
  Car, 
  Plane, 
  Copy, 
  Check, 
  BedDouble, 
  Sparkles, 
  Clock, 
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import LiveCountdown from './LiveCountdown';

export default function ScheduleResults({ data, weather }) {
  const [copied, setCopied] = useState(false);
  const [showSleepCalc, setShowSleepCalc] = useState(false);
  const [customBedTime, setCustomBedTime] = useState('');
  const [sleepResult, setSleepResult] = useState(null);

  if (!data) return null;

  const {
    reportDate,
    wakeupDate,
    departureDate,
    bedTime8hDate,
    bedTime7hDate,
    bedTime6hDate,
    bedTime5hDate,
    prepTimeFormatted,
    travelTimeFormatted,
    formatTime,
    formatDateShort,
  } = data;

  const handleCopyBriefing = () => {
    const weatherSummary = weather 
      ? `สภาพอากาศ กทม. พรุ่งนี้: ${weather.label} ${weather.minTemp}-${weather.maxTemp}°C (ฝน ${weather.rainProb}%)`
      : `สภาพอากาศ กทม. พรุ่งนี้: โปรดตรวจสอบก่อนออกเดินทาง`;

    const text = `FLIGHT & REST SCHEDULE BRIEFING
━━━━━━━━━━━━━━━━━━━━
เริ่มงาน / ติ๊กต็อก: ${formatTime(reportDate)} (${formatDateShort(reportDate)})
เวลาตื่นนอนแนะนำ: ${formatTime(wakeupDate)}
เวลาแต่งตัว: ${prepTimeFormatted}
เวลาออกจากบ้าน: ${formatTime(departureDate)} (เดินทาง ${travelTimeFormatted})
ถึงหน้างาน: ${formatTime(reportDate)}
${weatherSummary}
━━━━━━━━━━━━━━━━━━━━
ตารางเวลานอนแนะนำ (คืนก่อนหน้า):
• นอนเต็มอิ่ม 8 ชม.: ${formatTime(bedTime8hDate)}
• นอนสบาย 7 ชม.: ${formatTime(bedTime7hDate)}
• นอนมาตรฐาน 6 ชม.: ${formatTime(bedTime6hDate)}
• นอนขั้นต่ำ 5 ชม.: ${formatTime(bedTime5hDate)}
━━━━━━━━━━━━━━━━━━━━
ขอให้การเดินทางราบรื่นและปลอดภัยเสมอ`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.85 },
        colors: ['#0f172a', '#276ef1', '#05944f']
      });
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleCalculateCustomSleep = () => {
    if (!customBedTime || !wakeupDate) return;
    const bed = new Date(customBedTime);
    let diffMs = wakeupDate.getTime() - bed.getTime();
    if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const totalHoursFloat = hours + minutes / 60;

    let label = 'นอนเต็มอิ่ม ร่างกายพร้อมปฏิบัติงาน 100%';
    let color = 'bg-emerald-500 text-emerald-700 dark:text-emerald-300';

    if (totalHoursFloat >= 8) {
      label = 'นอนเต็มอิ่ม ฟื้นฟูร่างกายสมบูรณ์แบบ';
      color = 'bg-emerald-500 text-emerald-700 dark:text-emerald-300';
    } else if (totalHoursFloat >= 7) {
      label = 'พักผ่อนเพียงพอ ไม่ง่วงระหว่างวัน';
      color = 'bg-sky-500 text-sky-700 dark:text-sky-300';
    } else if (totalHoursFloat >= 6) {
      label = 'พอใช้ได้ แต่อาจมีเพลียเล็กน้อย';
      color = 'bg-amber-500 text-amber-700 dark:text-amber-300';
    } else {
      label = 'นอนน้อย ควรหาเวลาพักผ่อนเพิ่ม';
      color = 'bg-rose-500 text-rose-700 dark:text-rose-300';
    }

    setSleepResult({
      hours,
      minutes,
      percentage: Math.min(100, (totalHoursFloat / 9) * 100),
      label,
      color,
    });
  };

  return (
    <div className="w-full space-y-3 animate-slide-up">
      
      {/* Live Countdown Status */}
      <LiveCountdown wakeupDate={wakeupDate} departureDate={departureDate} />

      {/* 1. Hero Wake-up Target Card (Glanceable 1-Screen) */}
      <div className="w-full rounded-2xl bg-white dark:bg-[#121212] border-2 border-slate-900/10 dark:border-white/20 p-4 sm:p-5 shadow-sm transition-colors">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Sun className="w-4 h-4 text-amber-500" />
            เวลาตื่นนอนที่แนะนำ: (แต่งตัว {prepTimeFormatted} + เดินทาง {travelTimeFormatted})
          </span>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tabular-nums">
            {formatDateShort(wakeupDate)}
          </span>
        </div>

        <div className="text-4xl sm:text-5xl font-black text-slate-950 dark:text-white tracking-tight tabular-nums mt-1">
          {formatTime(wakeupDate)}
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#1f1f1f] flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            เวลาเริ่มงาน: <strong className="text-slate-900 dark:text-white">{formatTime(reportDate)}</strong>
          </span>

          <button
            onClick={handleCopyBriefing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-lg text-xs font-bold transition active:scale-95 shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                <span>คัดลอกเรียบร้อยแล้ว</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Quick Copy สรุปส่งแชท</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Departure & Arrival Twin Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        
        {/* Departure Time */}
        <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-[#181818] border border-purple-200/80 dark:border-[#262626] transition-colors">
          <div className="flex items-center gap-1.5 text-purple-900 dark:text-purple-300 text-xs font-bold mb-0.5">
            <Car className="w-3.5 h-3.5" />
            <span>เวลาออกจากบ้าน</span>
          </div>
          <div className="text-2xl font-black text-purple-950 dark:text-white tabular-nums">
            {formatTime(departureDate)}
          </div>
          <span className="text-[11px] text-purple-700 dark:text-slate-400 block mt-0.5">
            เผื่อเวลาเดินทาง {travelTimeFormatted}
          </span>
        </div>

        {/* Arrival Time */}
        <div className="p-3.5 rounded-xl bg-pink-50/70 dark:bg-[#181818] border border-pink-200/80 dark:border-[#262626] transition-colors">
          <div className="flex items-center gap-1.5 text-pink-900 dark:text-pink-300 text-xs font-bold mb-0.5">
            <Plane className="w-3.5 h-3.5" />
            <span>เวลาถึงจุดหมาย / หน้างาน</span>
          </div>
          <div className="text-2xl font-black text-pink-950 dark:text-white tabular-nums">
            {formatTime(reportDate)}
          </div>
          <span className="text-[11px] text-pink-700 dark:text-slate-400 block mt-0.5">
            พร้อมเริ่มงานตรงเวลา
          </span>
        </div>

      </div>

      {/* 3. Bedtime 4-Box Matrix */}
      <div className="w-full rounded-2xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#222222] p-4 shadow-sm transition-colors">
        <div className="flex items-center gap-1.5 mb-3 text-slate-900 dark:text-white text-xs font-bold">
          <Moon className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
          <span>เวลาเข้านอนแนะนำ (คืนก่อนไฟลท์)</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* 8 Hours */}
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-[#16221a] border border-emerald-200 dark:border-emerald-900/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">นอนเต็มอิ่ม 8 ชม.</span>
            </div>
            <div className="text-xl font-black text-emerald-950 dark:text-emerald-100 tabular-nums mt-0.5">
              {formatTime(bedTime8hDate)}
            </div>
          </div>

          {/* 7 Hours */}
          <div className="p-3 rounded-xl bg-lime-50 dark:bg-[#1a2316] border border-lime-200 dark:border-lime-900/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-lime-800 dark:text-lime-300">นอนสบาย 7 ชม.</span>
            </div>
            <div className="text-xl font-black text-lime-950 dark:text-lime-100 tabular-nums mt-0.5">
              {formatTime(bedTime7hDate)}
            </div>
          </div>

          {/* 6 Hours */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-[#241f14] border border-amber-200 dark:border-amber-900/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">นอน 6 ชม.</span>
            </div>
            <div className="text-xl font-black text-amber-950 dark:text-amber-100 tabular-nums mt-0.5">
              {formatTime(bedTime6hDate)}
            </div>
          </div>

          {/* 5 Hours */}
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-[#241618] border border-rose-200 dark:border-rose-900/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300">นอน 5 ชม. (ขั้นต่ำ)</span>
            </div>
            <div className="text-xl font-black text-rose-950 dark:text-rose-100 tabular-nums mt-0.5">
              {formatTime(bedTime5hDate)}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Sleep Calculator Inline Toggle */}
      <div className="w-full rounded-xl bg-slate-100 dark:bg-[#141414] border border-slate-200 dark:border-[#222222] p-3 transition-colors">
        <button
          type="button"
          onClick={() => setShowSleepCalc(!showSleepCalc)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>คำนวณชั่วโมงการนอนตามเวลาที่คุณจะนอนจริง</span>
          </div>
          {showSleepCalc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showSleepCalc && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-[#262626] space-y-2.5 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="datetime-local"
                value={customBedTime}
                onChange={(e) => setCustomBedTime(e.target.value)}
                className="flex-1 bg-white dark:bg-[#1c1c1c] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#333333] text-xs font-bold text-slate-900 dark:text-white tabular-nums"
              />
              <button
                type="button"
                onClick={handleCalculateCustomSleep}
                className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-lg text-xs font-bold transition active:scale-95"
              >
                คำนวณ
              </button>
            </div>

            {sleepResult && (
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#292929] space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-500 dark:text-slate-400">ชั่วโมงนอน:</span>
                  <span className="text-slate-950 dark:text-white tabular-nums">
                    {sleepResult.hours} ชม. {sleepResult.minutes} นาที
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  {sleepResult.label}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
