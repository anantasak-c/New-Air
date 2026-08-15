import React, { useState } from 'react';
import { X, BedDouble, Moon, Sparkles, CheckCircle2, Clock } from 'lucide-react';

export default function SleepBottomSheet({ isOpen, onClose, wakeupDate, formatTime }) {
  const [customBedTime, setCustomBedTime] = useState(() => {
    if (wakeupDate) {
      const bDate = new Date(wakeupDate.getTime() - 8 * 60 * 60 * 1000);
      const year = bDate.getFullYear();
      const month = String(bDate.getMonth() + 1).padStart(2, '0');
      const day = String(bDate.getDate()).padStart(2, '0');
      const hours = String(bDate.getHours()).padStart(2, '0');
      const minutes = String(bDate.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    return '';
  });
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleCalculateSleep = (e) => {
    if (e) e.preventDefault();
    if (!customBedTime || !wakeupDate) return;

    const bed = new Date(customBedTime);
    let diffMs = wakeupDate.getTime() - bed.getTime();

    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000;
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const totalHoursFloat = hours + minutes / 60;

    let quality = 'excellent';
    let label = '🌟 สุดยอด! นอนเต็มอิ่ม ร่างกายพร้อมปฏิบัติภารกิจ 100%';
    let barColor = 'bg-uber-green';
    let textColor = 'text-uber-green';

    if (totalHoursFloat >= 8) {
      quality = 'excellent';
      label = '🌟 ยอดเยี่ยมมาก! นอนเต็มอิ่ม ฟื้นฟูร่างกาย 100%';
      barColor = 'bg-uber-green';
      textColor = 'text-emerald-400';
    } else if (totalHoursFloat >= 7) {
      quality = 'good';
      label = '😊 ดีเยี่ยม! เพียงพอสำหรับการทำงาน ไม่ง่วงระหว่างวัน';
      barColor = 'bg-sky-500';
      textColor = 'text-sky-400';
    } else if (totalHoursFloat >= 6) {
      quality = 'fair';
      label = '⚠️ พอใช้ได้ แต่อาจมีเพลียบ้างเล็กน้อยช่วงท้ายไฟลท์';
      barColor = 'bg-amber-500';
      textColor = 'text-amber-400';
    } else if (totalHoursFloat >= 5) {
      quality = 'low';
      label = '🚨 นอนน้อย! ควรดื่มน้ำเยอะๆ และหากาแฟช่วย';
      barColor = 'bg-orange-500';
      textColor = 'text-orange-400';
    } else {
      quality = 'critical';
      label = '💀 พักผ่อนไม่พอ! เสี่ยงต่อการล้า พยายามนอนให้เร็วขึ้นนะ';
      barColor = 'bg-rose-500';
      textColor = 'text-rose-400';
    }

    setResult({
      hours,
      minutes,
      percentage: Math.min(100, (totalHoursFloat / 9) * 100),
      label,
      barColor,
      textColor,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="fixed inset-0"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-lg rounded-t-3xl bg-[#141414] border-t border-[#292929] p-6 shadow-uber-sheet animate-sheet-in z-10 max-h-[90vh] overflow-y-auto">
        
        {/* Drag handle bar */}
        <div className="w-12 h-1.5 rounded-full bg-[#333333] mx-auto mb-4"></div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#222222] pb-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1f1f1f] border border-[#333333] flex items-center justify-center text-white">
              <BedDouble className="w-5 h-5 text-uber-blue" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                เช็คชั่วโมงการนอน (Sleep Calculator)
              </h3>
              <p className="text-xs text-[#a6a6a6]">
                เป้าหมายเวลาตื่น: <strong className="text-white">{formatTime(wakeupDate)}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#1f1f1f] hover:bg-[#262626] text-[#a6a6a6] hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleCalculateSleep} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#a6a6a6] mb-2">
              🛏️ เวลาที่คุณวางแผนจะเข้านอน
            </label>
            <input
              type="datetime-local"
              value={customBedTime}
              onChange={(e) => setCustomBedTime(e.target.value)}
              className="w-full bg-[#1a1a1a] px-4 py-3 rounded-xl border border-[#333333] text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-uber-blue"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-uber-blue hover:bg-uber-blue-hover text-white font-bold text-sm rounded-xl transition active:scale-95 shadow-sm flex items-center justify-center gap-2"
          >
            <Clock className="w-4 h-4" />
            <span>คำนวณชั่วโมงการนอน</span>
          </button>
        </form>

        {/* Result Area */}
        {result && (
          <div className="mt-5 p-4 rounded-2xl bg-[#1a1a1a] border border-[#292929] space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#a6a6a6] uppercase tracking-wider">
                ชั่วโมงการนอนที่คุณจะได้รับ:
              </span>
              <span className="text-xl font-black text-white tabular-nums">
                {result.hours} ชม. {result.minutes} นาที
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-[#262626] rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${result.barColor}`}
                style={{ width: `${result.percentage}%` }}
              ></div>
            </div>

            <p className={`text-xs font-semibold ${result.textColor}`}>
              {result.label}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
