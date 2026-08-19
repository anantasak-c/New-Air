import React, { useState } from 'react';
import { 
  Sun, 
  Moon, 
  Car, 
  Plane, 
  Copy, 
  Check, 
  BedDouble, 
  Share2,
  ChevronDown,
  ChevronUp,
  Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';
import LiveCountdown from './LiveCountdown';
import { useTheme } from '../context/ThemeContext';
import { downloadIcsFile } from '../utils/icsGenerator';

export default function ScheduleResults({ data, weather }) {
  const { labels, activeTheme } = useTheme();
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

  // Clean, well-structured briefing message with "รักน้องเอ็มสุดหล่อ" at the bottom
  const getCleanBriefingText = () => {
    return `✈️ FLIGHT & REST SCHEDULE
🗓️ ${formatDateShort(reportDate)}
━━━━━━━━━━━━━━
☀️ ตื่นนอน: ${formatTime(wakeupDate)} (แต่งตัว ${prepTimeFormatted})
🚗 ออกจากบ้าน: ${formatTime(departureDate)} (เดินทาง ${travelTimeFormatted})
✈️ เริ่มงาน: ${formatTime(reportDate)}
━━━━━━━━━━━━━━
🌙 เวลานอนแนะนำ (คืนก่อนหน้า):
• 8 ชม. (เต็มอิ่ม): ${formatTime(bedTime8hDate)}
• 7 ชม. (สบาย): ${formatTime(bedTime7hDate)}
• 6 ชม. (มาตรฐาน): ${formatTime(bedTime6hDate)}
• 5 ชม. (ขั้นต่ำ): ${formatTime(bedTime5hDate)}
━━━━━━━━━━━━━━
รักน้องเอ็มสุดหล่อ`;
  };

  const handleShareLine = () => {
    const text = getCleanBriefingText();
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
    window.open(lineUrl, '_blank');
  };

  const handleCopyBriefing = () => {
    const text = getCleanBriefingText();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.85 },
        colors: ['#06c755', '#0f172a', '#276ef1', '#ec4899']
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

    if (totalHoursFloat >= 8) {
      label = 'นอนเต็มอิ่ม ฟื้นฟูร่างกายสมบูรณ์แบบ';
    } else if (totalHoursFloat >= 7) {
      label = 'พักผ่อนเพียงพอ ไม่ง่วงระหว่างวัน';
    } else if (totalHoursFloat >= 6) {
      label = 'พอใช้ได้ แต่อาจมีเพลียเล็กน้อย';
    } else {
      label = 'นอนน้อย ควรหาเวลาพักผ่อนเพิ่ม';
    }

    setSleepResult({
      hours,
      minutes,
      percentage: Math.min(100, (totalHoursFloat / 9) * 100),
      label,
    });
  };

  const wakeupSubText = labels?.wakeupSub 
    ? labels.wakeupSub.replace('{prep}', prepTimeFormatted).replace('{travel}', travelTimeFormatted)
    : `แต่งตัว ${prepTimeFormatted} + เดินทาง ${travelTimeFormatted}`;

  const departureSubText = labels?.departureSub
    ? labels.departureSub.replace('{travel}', travelTimeFormatted)
    : `เผื่อเวลาเดินทาง ${travelTimeFormatted}`;

  return (
    <div className="w-full space-y-2.5 animate-slide-up">
      
      {/* Live Countdown Status */}
      <LiveCountdown wakeupDate={wakeupDate} departureDate={departureDate} />

      {/* 1. Hero Wake-up Target Card */}
      <div className={`w-full rounded-2xl ${activeTheme.cardClass} border-2 border-slate-900/10 dark:border-white/20 p-4 sm:p-5 transition-colors shadow-sm`}>
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Sun className="w-4 h-4 text-amber-500" />
            {labels?.wakeupTitle || 'เวลาตื่นนอนที่แนะนำ:'}
          </span>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tabular-nums">
            {formatDateShort(wakeupDate)}
          </span>
        </div>

        <div className="text-4xl sm:text-5xl font-black text-slate-950 dark:text-white tracking-tight tabular-nums mt-1">
          {formatTime(wakeupDate)}
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
          {wakeupSubText}
        </p>

        {/* Action Buttons Row: LINE Share + Quick Copy */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#222222] flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs text-slate-600 dark:text-slate-400">
            เริ่มงาน: <strong className="text-slate-900 dark:text-white">{formatTime(reportDate)}</strong>
          </span>

          <div className="flex items-center gap-1.5">
            {/* Share to LINE Button */}
            <button
              onClick={handleShareLine}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-lg text-xs font-bold transition active:scale-95 shadow-sm cursor-pointer"
              title="แชร์ตารางเวลาเข้า LINE"
            >
              {/* LINE Icon SVG */}
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.019 9.578.39.084.922.258 1.057.592.121.303.079.777.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967 1.739-1.907 2.589-3.843 2.589-5.962z"/>
              </svg>
              <span>Line</span>
            </button>

            {/* Sync to Calendar Button */}
            <button
              onClick={() => {
                const reportH = String(reportDate.getHours()).padStart(2, '0');
                const reportM = String(reportDate.getMinutes()).padStart(2, '0');
                const singleFlight = [{
                  date: `${reportDate.getDate()} Aug`,
                  pairing: 'Flight Duty',
                  reportTime: `${reportH}:${reportM}`,
                  dutyType: 'flight'
                }];
                downloadIcsFile(singleFlight, data.prepMinutes || 90, data.travelMinutes || 60);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition active:scale-95 shadow-sm cursor-pointer"
              title="บันทึกเข้าปฏิทิน iPhone / Google Calendar"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>ปฏิทิน</span>
            </button>

            {/* Quick Copy Button */}
            <button
              onClick={handleCopyBriefing}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-lg text-xs font-bold transition active:scale-95 shadow-sm cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                  <span>คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอก</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Departure & Arrival Twin Cards */}
      <div className="grid grid-cols-2 gap-2">
        
        {/* Departure Time */}
        <div className="p-3.5 rounded-xl bg-purple-50/80 dark:bg-[#181818] border border-purple-200/80 dark:border-[#262626] transition-colors">
          <div className="flex items-center gap-1.5 text-purple-900 dark:text-purple-300 text-xs font-bold mb-0.5">
            <Car className="w-3.5 h-3.5" />
            <span>{labels?.departureTitle || 'เวลาออกจากบ้าน'}</span>
          </div>
          <div className="text-2xl font-black text-purple-950 dark:text-white tabular-nums">
            {formatTime(departureDate)}
          </div>
          <span className="text-[10px] text-purple-700 dark:text-slate-400 block mt-0.5 font-medium truncate">
            {departureSubText}
          </span>
        </div>

        {/* Arrival Time */}
        <div className="p-3.5 rounded-xl bg-pink-50/80 dark:bg-[#181818] border border-pink-200/80 dark:border-[#262626] transition-colors">
          <div className="flex items-center gap-1.5 text-pink-900 dark:text-pink-300 text-xs font-bold mb-0.5">
            <Plane className="w-3.5 h-3.5" />
            <span>{labels?.arrivalTitle || 'เวลาถึงจุดหมาย'}</span>
          </div>
          <div className="text-2xl font-black text-pink-950 dark:text-white tabular-nums">
            {formatTime(reportDate)}
          </div>
          <span className="text-[10px] text-pink-700 dark:text-slate-400 block mt-0.5 font-medium truncate">
            {labels?.arrivalSub || 'พร้อมเริ่มงานตรงเวลา'}
          </span>
        </div>

      </div>

      {/* 3. Bedtime 4-Box Matrix */}
      <div className={`w-full rounded-2xl ${activeTheme.cardClass} p-4 transition-colors shadow-sm`}>
        <div className="flex items-center gap-1.5 mb-2.5 text-slate-900 dark:text-white text-xs font-bold">
          <Moon className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
          <span>{labels?.bedtimeTitle || 'เวลาเข้านอนแนะนำ (คืนก่อนไฟลท์)'}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* 8 Hours */}
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-[#16221a] border border-emerald-200 dark:border-emerald-900/40">
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block truncate">
              {labels?.bedtime8hTag || '8 ชม. (เต็มอิ่ม)'}
            </span>
            <div className="text-xl font-black text-emerald-950 dark:text-emerald-100 tabular-nums mt-0.5">
              {formatTime(bedTime8hDate)}
            </div>
          </div>

          {/* 7 Hours */}
          <div className="p-3 rounded-xl bg-lime-50 dark:bg-[#1a2316] border border-lime-200 dark:border-lime-900/40">
            <span className="text-[11px] font-bold text-lime-800 dark:text-lime-300 block truncate">
              {labels?.bedtime7hTag || '7 ชม. (สบาย)'}
            </span>
            <div className="text-xl font-black text-lime-950 dark:text-lime-100 tabular-nums mt-0.5">
              {formatTime(bedTime7hDate)}
            </div>
          </div>

          {/* 6 Hours */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-[#241f14] border border-amber-200 dark:border-amber-900/40">
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block truncate">
              {labels?.bedtime6hTag || '6 ชม. (มาตรฐาน)'}
            </span>
            <div className="text-xl font-black text-amber-950 dark:text-amber-100 tabular-nums mt-0.5">
              {formatTime(bedTime6hDate)}
            </div>
          </div>

          {/* 5 Hours */}
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-[#241618] border border-rose-200 dark:border-rose-900/40">
            <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 block truncate">
              {labels?.bedtime5hTag || '5 ชม. (ขั้นต่ำ)'}
            </span>
            <div className="text-xl font-black text-rose-950 dark:text-rose-100 tabular-nums mt-0.5">
              {formatTime(bedTime5hDate)}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Sleep Calculator Inline Toggle */}
      <div className="w-full rounded-xl bg-slate-100/90 dark:bg-[#141414] border border-slate-200 dark:border-[#222222] p-3 transition-colors">
        <button
          type="button"
          onClick={() => setShowSleepCalc(!showSleepCalc)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>{labels?.sleepCalcTitle || 'คำนวณชั่วโมงการนอนตามเวลาที่จะนอนจริง'}</span>
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
                className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer"
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
