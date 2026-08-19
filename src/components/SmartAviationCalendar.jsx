import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plane, 
  Moon, 
  Sun, 
  Coffee, 
  Car, 
  Download, 
  Clock, 
  X, 
  Check, 
  Copy, 
  Sparkles, 
  ExternalLink,
  ShieldAlert,
  Heart
} from 'lucide-react';
import { calculateFlightSchedule } from '../utils/flexBuilder';
import { downloadIcsFile } from '../utils/icsGenerator';

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NAMES_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const WEEKDAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function parseFlightDay(dateStr) {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{1,2})/);
  return match ? parseInt(match[1], 10) : null;
}

export default function SmartAviationCalendar({ 
  flights = [], 
  dressUpMinutes = 90, 
  transitMinutes = 60,
  onSendToLine = null 
}) {
  // Calendar Navigation (Default August 2026)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(7); // 7 = August (0-indexed)
  
  // Selected Event Popover Modal State
  const [activeModalFlight, setActiveModalFlight] = useState(null);
  const [selectedDay, setSelectedDay] = useState(19); // Today marker (Aug 19, 2026)
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'agenda'
  const [copied, setCopied] = useState(false);

  // Group flights by day of month
  const flightsByDay = {};
  flights.forEach(f => {
    const day = parseFlightDay(f.date);
    if (day) {
      flightsByDay[day] = f;
    }
  });

  // Calculate calendar grid days
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayWeekday = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(7);
    setSelectedDay(19);
  };

  // Open modal detail for a flight
  const handleOpenFlightModal = (flight, dayNum) => {
    setSelectedDay(dayNum);
    setActiveModalFlight({ ...flight, dayNum });
  };

  // Modal Schedule Calculation
  const modalSchedule = activeModalFlight && activeModalFlight.dutyType !== 'leave' && activeModalFlight.dutyType !== 'rest'
    ? calculateFlightSchedule(activeModalFlight.reportTime || "06:05", dressUpMinutes, transitMinutes)
    : null;

  const handleCopyEventBrief = () => {
    if (!activeModalFlight) return;
    const isLeave = activeModalFlight.dutyType === 'leave' || activeModalFlight.dutyType === 'rest';
    let text = '';
    if (isLeave) {
      text = `🎉 วันพักผ่อน (DAY OFF)\n🗓️ ${activeModalFlight.date}\n${activeModalFlight.pairing || 'Rest'}\nไม่มีหน้าที่การบิน พักผ่อนได้เต็มที่ครับ! 🛌✨`;
    } else {
      text = `✈️ ${activeModalFlight.pairing}\n🗓️ ${activeModalFlight.date}\n━━━━━━━━━━━━━━\n☀️ ตื่นนอน: ${modalSchedule?.wakeupTime} (แต่งตัว ${dressUpMinutes}m + เดินทาง ${transitMinutes}m)\n🚗 ออกจากบ้าน: ${modalSchedule?.departureTime}\n✈️ รายงานตัว: ${modalSchedule?.reportTime} L (Release: ${activeModalFlight.releaseTime || '--:--'} L)\n🌙 เวลานอนแนะนำ: ${modalSchedule?.bedTime8h} (8 ชม.) / ${modalSchedule?.bedTime7h} (7 ชม.)`;
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden font-[-apple-system,BlinkMacSystemFont,'Google_Sans','SF_Pro_Display','Segoe_UI',Roboto,sans-serif]">
      
      {/* 1. Google Calendar Style Top App Bar */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2.5 bg-white">
        
        {/* Left: Today + Nav Arrows + Month Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goToToday}
            className="px-3 py-1.5 rounded-full border border-slate-300 hover:bg-slate-50 active:scale-95 text-xs font-semibold text-slate-700 transition shadow-2xs"
          >
            Today
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              className="w-8 h-8 rounded-full hover:bg-slate-100 active:scale-90 flex items-center justify-center text-slate-600 transition"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="w-8 h-8 rounded-full hover:bg-slate-100 active:scale-90 flex items-center justify-center text-slate-600 transition"
              title="เดือนถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {MONTH_NAMES_EN[currentMonth]} {currentYear}
          </h2>
        </div>

        {/* Right: Sync ics button + View Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadIcsFile(flights, dressUpMinutes, transitMinutes)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold transition active:scale-95 shadow-sm"
            title="บันทึกไฟล์ .ics เข้า Google / Apple Calendar"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sync เข้า Google/Apple Calendar</span>
            <span className="sm:hidden">Sync</span>
          </button>
        </div>
      </div>

      {/* 2. Google Calendar Monthly Table Grid */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[600px] sm:min-w-full">
          
          {/* Weekdays Header Row */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50 text-center py-2">
            {WEEKDAY_NAMES.map((wd, i) => (
              <div 
                key={wd} 
                className={`text-[11px] font-bold tracking-wider ${
                  i === 0 ? 'text-rose-500' : i === 6 ? 'text-blue-500' : 'text-slate-500'
                }`}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Monthly Day Cells Grid */}
          <div className="grid grid-cols-7 border-collapse">
            
            {/* Previous month filler cells */}
            {Array.from({ length: firstDayWeekday }).map((_, i) => {
              const prevDate = prevMonthDays - firstDayWeekday + i + 1;
              return (
                <div 
                  key={`prev-${i}`} 
                  className="min-h-[90px] sm:min-h-[105px] border-b border-r border-slate-200 p-1.5 bg-slate-50/40 text-slate-300 text-xs font-semibold"
                >
                  {prevDate}
                </div>
              );
            })}

            {/* Current month day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const flight = flightsByDay[dayNum];
              const isToday = currentMonth === 7 && currentYear === 2026 && dayNum === 19; // Today in screenshot

              const isFlight = flight?.dutyType === 'flight';
              const isStandby = flight?.dutyType === 'standby';
              const isLeave = flight?.dutyType === 'leave' || flight?.dutyType === 'rest';

              // Check if early flight tomorrow
              const nextFlight = flightsByDay[dayNum + 1];
              const hasEarlyFlightTomorrow = nextFlight && nextFlight.reportTime && parseInt(nextFlight.reportTime.split(':')[0], 10) < 7;

              return (
                <div
                  key={dayNum}
                  onClick={() => flight ? handleOpenFlightModal(flight, dayNum) : setSelectedDay(dayNum)}
                  className={`min-h-[90px] sm:min-h-[105px] border-b border-r border-slate-200 p-1.5 flex flex-col justify-between transition-colors relative cursor-pointer group ${
                    isToday ? 'bg-blue-50/20' : 'hover:bg-slate-50/70'
                  }`}
                >
                  {/* Day Header Row */}
                  <div className="flex items-center justify-between">
                    <span 
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition ${
                        isToday
                          ? 'bg-[#1a73e8] text-white shadow-xs'
                          : selectedDay === dayNum
                          ? 'bg-slate-200 text-slate-900'
                          : 'text-slate-700 group-hover:text-slate-900'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Moon Icon for Early Bedtime Alert */}
                    {hasEarlyFlightTomorrow && (
                      <span 
                        className="flex items-center text-[10px] text-amber-500 font-bold"
                        title="คืนนี้ต้องรีบเข้านอน (มีบินเช้าพรุ่งนี้)"
                      >
                        <Moon className="w-3 h-3 fill-amber-400 text-amber-500" />
                      </span>
                    )}
                  </div>

                  {/* Google Calendar Style Event Bars / Chips */}
                  <div className="space-y-1 mt-1 flex-1">
                    {flight && (
                      <>
                        {/* 1. Active Flight Duty Bar */}
                        {isFlight && (
                          <div 
                            className="bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded px-1.5 py-0.5 text-[10.5px] font-semibold truncate shadow-2xs flex items-center gap-1 transition"
                            title={`${flight.pairing} (Report: ${flight.reportTime || '--:--'} L)`}
                          >
                            <Plane className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="truncate">
                              {flight.reportTime ? `${flight.reportTime} ` : ''}{flight.pairing.split(':')[0]}
                            </span>
                          </div>
                        )}

                        {/* 2. Standby Bar (Spanning block like STB in user screenshot) */}
                        {isStandby && (
                          <div 
                            className="bg-[#5c6bc0] hover:bg-[#3f51b5] text-white rounded px-1.5 py-0.5 text-[10.5px] font-semibold truncate shadow-2xs flex items-center gap-1 transition"
                            title={`Standby: ${flight.pairing} (${flight.reportTime || '02:00'} L)`}
                          >
                            <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="truncate">
                              {flight.reportTime ? `${flight.reportTime} ` : ''}STB ({flight.pairing.split(':')[0]})
                            </span>
                          </div>
                        )}

                        {/* 3. Day Off Bar */}
                        {isLeave && (
                          <div 
                            className="bg-[#0f9d58] hover:bg-[#0b8043] text-white rounded px-1.5 py-0.5 text-[10.5px] font-semibold truncate shadow-2xs flex items-center gap-1 transition"
                            title={`Day Off: ${flight.pairing || 'Rest'}`}
                          >
                            <span>🎉 Day Off</span>
                          </div>
                        )}

                        {/* 4. Sleep Target Helper Chip (if active flight) */}
                        {isFlight && flight.reportTime && (
                          <div className="hidden sm:flex items-center gap-1 text-[9.5px] text-indigo-700 bg-indigo-50 border border-indigo-200/70 rounded px-1 py-0.2 truncate">
                            <Moon className="w-2 h-2" />
                            <span>นอน {calculateFlightSchedule(flight.reportTime, dressUpMinutes, transitMinutes).bedTime8h}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Cell Bottom Free Time indicator */}
                  {flight && !isLeave && (
                    <div className="text-[9px] text-slate-400 text-right truncate">
                      Release {flight.releaseTime || '15:45'}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Next month filler cells */}
            {Array.from({ length: (7 - ((firstDayWeekday + daysInMonth) % 7)) % 7 }).map((_, i) => (
              <div 
                key={`next-${i}`} 
                className="min-h-[90px] sm:min-h-[105px] border-b border-r border-slate-200 p-1.5 bg-slate-50/40 text-slate-300 text-xs font-semibold"
              >
                {i + 1}
              </div>
            ))}

          </div>
        </div>
      </div>

      {/* 3. Google Calendar Style Event Detail Popover / Modal */}
      {activeModalFlight && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div 
            className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            
            {/* Popover Header Banner */}
            <div className={`p-4 text-white flex items-start justify-between ${
              activeModalFlight.dutyType === 'flight' 
                ? 'bg-[#1a73e8]' 
                : activeModalFlight.dutyType === 'standby'
                ? 'bg-[#5c6bc0]'
                : 'bg-[#0f9d58]'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase opacity-90">
                  {activeModalFlight.dutyType === 'flight' ? (
                    <>
                      <Plane className="w-4 h-4" />
                      <span>FLIGHT DUTY</span>
                    </>
                  ) : activeModalFlight.dutyType === 'standby' ? (
                    <>
                      <Clock className="w-4 h-4" />
                      <span>STANDBY DUTY</span>
                    </>
                  ) : (
                    <>
                      <Sun className="w-4 h-4" />
                      <span>OFF / VACATION LEAVE</span>
                    </>
                  )}
                </div>
                <h3 className="text-lg font-bold leading-tight">
                  {activeModalFlight.pairing}
                </h3>
                <p className="text-xs text-white/90 font-medium">
                  {activeModalFlight.date} • สิงหาคม 2026
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalFlight(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Popover Body */}
            <div className="p-4.5 space-y-3.5 max-h-[70vh] overflow-y-auto">
              
              {/* Flight Duty Timeline */}
              {modalSchedule ? (
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>ไทม์ไลน์การนอน & ปฏิบัติหน้าที่:</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Moon className="w-3.5 h-3.5 text-indigo-600" />
                        เวลานอนแนะนำ (คืนก่อนหน้า):
                      </span>
                      <span className="font-bold text-indigo-700 font-mono">
                        {modalSchedule.bedTime8h} (8h) / {modalSchedule.bedTime7h} (7h)
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        เวลาตื่นนอน & แต่งตัว ({dressUpMinutes}m):
                      </span>
                      <span className="font-bold text-slate-900 font-mono">
                        {modalSchedule.wakeupTime}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Car className="w-3.5 h-3.5 text-emerald-600" />
                        ออกจากบ้าน ({transitMinutes}m):
                      </span>
                      <span className="font-bold text-slate-900 font-mono">
                        {modalSchedule.departureTime}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                      <span className="text-slate-800 font-bold flex items-center gap-1">
                        <Plane className="w-3.5 h-3.5 text-blue-600" />
                        เวลาเริ่มงาน (Report):
                      </span>
                      <span className="font-extrabold text-blue-700 font-mono text-sm">
                        {modalSchedule.reportTime} L
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">
                        เสร็จสิ้นงาน (Release):
                      </span>
                      <span className="font-bold text-slate-800 font-mono">
                        {activeModalFlight.releaseTime || '15:45'} L
                      </span>
                    </div>
                  </div>

                  {/* Free Time Life Planning Slot */}
                  <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                        ช่วงเวลาว่างสำหรับวางแผนชีวิต:
                      </span>
                      <span className="text-[11px] font-bold text-amber-800 font-mono">
                        {activeModalFlight.releaseTime || '15:45'} น. เป็นต้นไป
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800/80 leading-relaxed">
                      หลังเสร็จสิ้นภารกิจ มีเวลาว่างสำหรับออกกำลังกาย นัดทานข้าวกับครอบครัว หรือพักผ่อนตามอัธยาศัย
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1.5">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <Sun className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-emerald-900">วันพักผ่อนเต็มวัน (100% Free Day)</h4>
                  <p className="text-xs text-emerald-700">
                    ไม่มีภารกิจการบิน สามารถวางแผนท่องเที่ยว หรือนอนพักผ่อนได้อย่างเต็มที่ครับ! 🛌🏖️
                  </p>
                </div>
              )}

              {/* Modal Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyEventBrief}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>คัดลอกแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>คัดลอกสรุป</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => downloadIcsFile([activeModalFlight], dressUpMinutes, transitMinutes, `${activeModalFlight.pairing || 'flight'}.ics`)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>ใส่ Google Cal</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
