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
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import LiveCountdown from './LiveCountdown';
import SleepBottomSheet from './SleepBottomSheet';

export default function ScheduleResults({ data, weather }) {
  const [copied, setCopied] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

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
      ? `🌤️ อากาศ กทม. พรุ่งนี้: ${weather.label} ${weather.minTemp}-${weather.maxTemp}°C (ฝน ${weather.rainProb}%)`
      : `🌤️ อากาศ กทม. พรุ่งนี้: ตรวจสอบข้อมูลก่อนออกเดินทาง`;

    const text = `✈️ FLIGHT & DUTY SCHEDULE BRIEFING
━━━━━━━━━━━━━━━━━━━━
📍 เริ่มงาน / ติ๊กต็อก: ${formatTime(reportDate)} (${formatDateShort(reportDate)})
⏰ เวลาตื่นนอนแนะนำ: ${formatTime(wakeupDate)}
💄 เวลาแต่งตัว: ${prepTimeFormatted}
🚗 เวลาออกจากบ้าน: ${formatTime(departureDate)} (เดินทาง ${travelTimeFormatted})
✈️ ถึงหน้างาน / พร้อมบิน: ${formatTime(reportDate)}
${weatherSummary}
━━━━━━━━━━━━━━━━━━━━
🌙 ตารางเวลานอนแนะนำ (คืนก่อนหน้า):
• นอนเต็มอิ่ม 8 ชม.: ${formatTime(bedTime8hDate)}
• นอนสบาย 7 ชม.: ${formatTime(bedTime7hDate)}
• นอนมาตรฐาน 6 ชม.: ${formatTime(bedTime6hDate)}
• นอนขั้นต่ำ 5 ชม.: ${formatTime(bedTime5hDate)}
━━━━━━━━━━━━━━━━━━━━
ขอให้การเดินทางราบรื่น ปลอดภัย และตรงต่อเวลาเสมอ ✈️`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.85 },
        colors: ['#ffffff', '#276ef1', '#05944f']
      });
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="w-full space-y-4 animate-slide-up">
      
      {/* Live Countdown Badge */}
      <LiveCountdown wakeupDate={wakeupDate} departureDate={departureDate} />

      {/* Hero Wake-Up Card (Uber High-Contrast) */}
      <div className="w-full rounded-2xl bg-[#141414] dark:bg-[#141414] border border-[#292929] p-5 sm:p-7 shadow-uber-elevated relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                <Sun className="w-3.5 h-3.5" />
                เวลาตื่นนอนที่แนะนำ (Wake-Up Target)
              </span>
            </div>

            <div className="text-5xl sm:text-6xl font-black text-white tracking-tight tabular-nums mt-1">
              {formatTime(wakeupDate)}
            </div>

            <p className="text-xs text-[#a6a6a6] mt-2 flex items-center gap-2 flex-wrap font-medium">
              <span>📅 {formatDateShort(wakeupDate)}</span>
              <span className="text-[#444444]">•</span>
              <span>แต่งตัว {prepTimeFormatted} + เดินทาง {travelTimeFormatted}</span>
            </p>
          </div>

          <div className="sm:text-right bg-[#1f1f1f] p-4 rounded-xl border border-[#333333] shrink-0">
            <span className="text-[11px] font-bold text-[#a6a6a6] block uppercase tracking-wider">
              เวลาเริ่มงาน / ไฟลท์
            </span>
            <span className="text-xl font-black text-white tabular-nums">
              {formatTime(reportDate)}
            </span>
            <span className="text-xs text-[#6b6b6b] block mt-0.5 font-medium">
              ({formatDateShort(reportDate)})
            </span>
          </div>
        </div>

        {/* Quick Action Buttons inside Hero Card */}
        <div className="mt-5 pt-4 border-t border-[#222222] flex items-center justify-between flex-wrap gap-2">
          <button
            onClick={handleCopyBriefing}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-slate-200 rounded-xl text-xs font-bold transition active:scale-95 shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-uber-green" />
                <span className="text-uber-green">คัดลอกสรุปส่งแชทแล้ว!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-black" />
                <span>Quick Copy สรุปส่งแชท</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsBottomSheetOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1f1f1f] hover:bg-[#262626] border border-[#333333] text-white rounded-xl text-xs font-semibold transition active:scale-95"
          >
            <BedDouble className="w-4 h-4 text-uber-blue" />
            <span>เช็คชั่วโมงการนอน</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#6b6b6b]" />
          </button>
        </div>
      </div>

      {/* Visual Flight Timeline Strip */}
      <div className="w-full rounded-2xl bg-[#141414] dark:bg-[#141414] border border-[#292929] p-4 sm:p-5 shadow-uber-sm">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-uber-blue" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            เส้นทางลำดับเวลา (Flight Timeline Strip)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative">
          {/* Step 1: Wake Up */}
          <div className="p-3.5 rounded-xl bg-[#1a1a1a] border border-[#292929] flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center shrink-0 font-bold text-xs">
              1
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#a6a6a6] block uppercase tracking-wider">
                ตื่นนอน
              </span>
              <span className="text-lg font-black text-white tabular-nums">
                {formatTime(wakeupDate)}
              </span>
              <span className="text-[11px] text-[#6b6b6b] block">
                แต่งตัว {prepTimeFormatted}
              </span>
            </div>
          </div>

          {/* Step 2: Departure */}
          <div className="p-3.5 rounded-xl bg-[#1a1a1a] border border-[#292929] flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-uber-blue/10 text-uber-blue border border-uber-blue/20 flex items-center justify-center shrink-0 font-bold text-xs">
              2
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#a6a6a6] block uppercase tracking-wider">
                ออกจากบ้าน
              </span>
              <span className="text-lg font-black text-white tabular-nums">
                {formatTime(departureDate)}
              </span>
              <span className="text-[11px] text-[#6b6b6b] block">
                เดินทาง {travelTimeFormatted}
              </span>
            </div>
          </div>

          {/* Step 3: Report Duty */}
          <div className="p-3.5 rounded-xl bg-[#1a1a1a] border border-[#292929] flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-uber-green/10 text-uber-green border border-uber-green/20 flex items-center justify-center shrink-0 font-bold text-xs">
              3
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#a6a6a6] block uppercase tracking-wider">
                ถึงสถานที่นัดหมาย
              </span>
              <span className="text-lg font-black text-white tabular-nums">
                {formatTime(reportDate)}
              </span>
              <span className="text-[11px] text-[#6b6b6b] block">
                เริ่มงานตรงเวลา
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bedtime Matrix (4 Steps) */}
      <div className="w-full rounded-2xl bg-[#141414] dark:bg-[#141414] border border-[#292929] p-4 sm:p-5 shadow-uber-sm">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-slate-300" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              แผนเวลาเข้านอนแนะนำ (คืนก่อนเดินทาง)
            </h3>
          </div>
          <span className="text-[11px] text-[#6b6b6b]">นับจากเวลาตื่น {formatTime(wakeupDate)}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* 8 Hours */}
          <div className="p-3 rounded-xl bg-[#1a1a1a] border border-[#292929]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#a6a6a6]">8 ชม.</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-semibold">
                เต็มอิ่ม
              </span>
            </div>
            <div className="text-base sm:text-lg font-black text-white tabular-nums mt-1">
              {formatTime(bedTime8hDate)}
            </div>
            <span className="text-[10px] text-[#6b6b6b] block mt-0.5">สดชื่น 100%</span>
          </div>

          {/* 7 Hours */}
          <div className="p-3 rounded-xl bg-[#1a1a1a] border border-[#292929]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#a6a6a6]">7 ชม.</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 font-semibold">
                กำลังดี
              </span>
            </div>
            <div className="text-base sm:text-lg font-black text-white tabular-nums mt-1">
              {formatTime(bedTime7hDate)}
            </div>
            <span className="text-[10px] text-[#6b6b6b] block mt-0.5">พักผ่อนเพียงพอ</span>
          </div>

          {/* 6 Hours */}
          <div className="p-3 rounded-xl bg-[#1a1a1a] border border-[#292929]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#a6a6a6]">6 ชม.</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 font-semibold">
                มาตรฐาน
              </span>
            </div>
            <div className="text-base sm:text-lg font-black text-white tabular-nums mt-1">
              {formatTime(bedTime6hDate)}
            </div>
            <span className="text-[10px] text-[#6b6b6b] block mt-0.5">อาจเพลียบ่าย</span>
          </div>

          {/* 5 Hours */}
          <div className="p-3 rounded-xl bg-[#1a1a1a] border border-[#292929]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#a6a6a6]">5 ชม.</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 font-semibold">
                ขั้นต่ำ
              </span>
            </div>
            <div className="text-base sm:text-lg font-black text-white tabular-nums mt-1">
              {formatTime(bedTime5hDate)}
            </div>
            <span className="text-[10px] text-[#6b6b6b] block mt-0.5">ควรหาเวลางีบ</span>
          </div>
        </div>
      </div>

      {/* Sleep Bottom Sheet Modal */}
      <SleepBottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        wakeupDate={wakeupDate}
        formatTime={formatTime}
      />

    </div>
  );
}
