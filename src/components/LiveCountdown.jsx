import React, { useState, useEffect } from 'react';
import { Clock, Bell, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function LiveCountdown({ wakeupDate, departureDate }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!wakeupDate) {
      setTimeLeft(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = wakeupDate.getTime();
      const diffMs = target - now;

      if (diffMs <= 0) {
        setTimeLeft({
          isPast: true,
          text: 'ถึงเวลาตื่นนอนแล้ว! เตรียมตัวเริ่มภารกิจ',
          hours: 0,
          minutes: 0,
        });
        return;
      }

      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({
        isPast: false,
        hours,
        minutes,
        seconds,
        text: hours > 0 
          ? `อีก ${hours} ชม. ${minutes} นาที ถึงเวลาตื่นนอน`
          : `อีก ${minutes} นาที ${seconds} วินาที ถึงเวลาตื่นนอน`,
        isUrgent: hours === 0 && minutes < 60,
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [wakeupDate]);

  if (!timeLeft) return null;

  return (
    <div className="w-full animate-fade-in">
      <div 
        className={`px-4 py-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold ${
          timeLeft.isPast 
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
            : timeLeft.isUrgent
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-[#141414] border-[#292929] text-white'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              timeLeft.isPast ? 'bg-amber-400' : timeLeft.isUrgent ? 'bg-rose-400' : 'bg-uber-green'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              timeLeft.isPast ? 'bg-amber-500' : timeLeft.isUrgent ? 'bg-rose-500' : 'bg-uber-green'
            }`}></span>
          </span>
          <span className="font-bold tracking-tight">
            LIVE COUNTDOWN
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-bold tabular-nums">
          <Clock className="w-3.5 h-3.5 opacity-80" />
          <span>{timeLeft.text}</span>
        </div>
      </div>
    </div>
  );
}
