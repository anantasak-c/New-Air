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

  // Build weeks matrix
  const weeks = [];
  let currentWeek = [];
  
  // 1. Previous month days
  for (let i = 0; i < firstDayWeekday; i++) {
    const d = prevMonthDays - firstDayWeekday + i + 1;
    currentWeek.push({ dayNum: d, isCurrentMonth: false });
  }

  // 2. Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    currentWeek.push({ dayNum: d, isCurrentMonth: true });
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // 3. Next month filler days
  if (currentWeek.length > 0) {
    let nextD = 1;
    while (currentWeek.length < 7) {
      currentWeek.push({ dayNum: nextD++, isCurrentMonth: false });
    }
    weeks.push(currentWeek);
  }

  // Identify multi-day span events (overnight flights or multi-day consecutive duties)
  // e.g. YNT_ExWOIFR-1 spanning 25 -> 26, RERRP 19 -> 20, AL 21 -> 22, RERRP 27 -> 28, SBM/STB 20 -> 21
  const processedSpans = [];
  const handledFlightIndices = new Set();

  flights.forEach((f, idx) => {
    if (handledFlightIndices.has(idx)) return;
    const startDay = parseFlightDay(f.date);
    if (!startDay) return;

    let endDay = startDay;

    // Check if pairing explicitly spans overnight (e.g. "Aug 25 ... - Aug 26") or release < report
    const isOvernight = (f.pairing && f.pairing.includes('- Aug')) || 
      (f.date && f.date.includes('-')) ||
      (f.reportTime && f.releaseTime && parseInt(f.releaseTime.split(':')[0], 10) < parseInt(f.reportTime.split(':')[0], 10));

    if (isOvernight) {
      endDay = startDay + 1;
    } else {
      // Check next flight to see if it's the same continuous block (e.g. multi-day Day Off or multi-day Standby)
      let nextIdx = idx + 1;
      while (nextIdx < flights.length) {
        const nextF = flights[nextIdx];
        const nextDay = parseFlightDay(nextF.date);
        if (nextDay === endDay + 1 && nextF.pairing === f.pairing && nextF.dutyType === f.dutyType) {
          endDay = nextDay;
          handledFlightIndices.add(nextIdx);
          nextIdx++;
        } else {
          break;
        }
      }
    }

    handledFlightIndices.add(idx);
    processedSpans.push({
      ...f,
      startDay,
      endDay,
      isMultiDay: endDay > startDay
    });
  });

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
            className="px-3.5 py-1.5 rounded-full border border-slate-300 hover:bg-slate-50 active:scale-95 text-xs font-semibold text-slate-700 transition shadow-2xs"
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

        {/* Right: Sync ics button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadIcsFile(flights, dressUpMinutes, transitMinutes)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold transition active:scale-95 shadow-sm"
            title="บันทึกไฟล์ .ics เข้า Google / Apple Calendar"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sync เข้า Google/Apple Calendar</span>
            <span className="sm:hidden">Sync Cal</span>
          </button>
        </div>
      </div>

      {/* 2. Google Calendar Monthly Table Grid with Multi-Day Spanning Tracks */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[640px] sm:min-w-full">
          
          {/* Weekdays Header Row */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center py-2">
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

          {/* Weeks Rows */}
          <div className="divide-y divide-slate-200">
            {weeks.map((week, weekIdx) => {
              const weekStartDay = week[0].isCurrentMonth ? week[0].dayNum : 1;
              const weekEndDay = week[6].isCurrentMonth ? week[6].dayNum : daysInMonth;

              // Find spans active in this week
              const activeWeekSpans = processedSpans.filter(span => {
                return span.startDay <= weekEndDay && span.endDay >= weekStartDay;
              });

              return (
                <div key={weekIdx} className="relative min-h-[96px] sm:min-h-[110px] flex flex-col justify-between">
                  
                  {/* Background 7 Day Grid Cells */}
                  <div className="absolute inset-0 grid grid-cols-7 divide-x divide-slate-200 pointer-events-none">
                    {week.map((dayObj, colIdx) => {
                      const isToday = currentMonth === 7 && currentYear === 2026 && dayObj.isCurrentMonth && dayObj.dayNum === 19;
                      return (
                        <div 
                          key={colIdx} 
                          className={`p-1.5 flex flex-col justify-between ${
                            !dayObj.isCurrentMonth ? 'bg-slate-50/40' : isToday ? 'bg-blue-50/20' : ''
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Top Layer: Day Numbers */}
                  <div className="grid grid-cols-7 relative z-10 p-1.5 pointer-events-auto">
                    {week.map((dayObj, colIdx) => {
                      const isToday = currentMonth === 7 && currentYear === 2026 && dayObj.isCurrentMonth && dayObj.dayNum === 19;
                      const nextFlight = flightsByDay[dayObj.dayNum + 1];
                      const hasEarlyFlightTomorrow = dayObj.isCurrentMonth && nextFlight && nextFlight.reportTime && parseInt(nextFlight.reportTime.split(':')[0], 10) < 7;

                      return (
                        <div 
                          key={colIdx} 
                          onClick={() => dayObj.isCurrentMonth && setSelectedDay(dayObj.dayNum)}
                          className="flex items-center justify-between cursor-pointer px-1"
                        >
                          <span 
                            className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition ${
                              isToday
                                ? 'bg-[#1a73e8] text-white shadow-xs'
                                : selectedDay === dayObj.dayNum && dayObj.isCurrentMonth
                                ? 'bg-slate-200 text-slate-900'
                                : dayObj.isCurrentMonth
                                ? 'text-slate-700'
                                : 'text-slate-300'
                            }`}
                          >
                            {dayObj.dayNum}
                          </span>

                          {hasEarlyFlightTomorrow && (
                            <span title="คืนนี้ต้องรีบเข้านอน (มีบินเช้าพรุ่งนี้)">
                              <Moon className="w-3 h-3 fill-amber-400 text-amber-500" />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Middle Layer: Continuous Spanning Event Bars & Single Day Chips */}
                  <div className="relative z-10 px-1 pb-1.5 space-y-1">
                    {/* Render Spanning Bars */}
                    {activeWeekSpans.map((span, spanIdx) => {
                      // Calculate start and end column for this week (1-7)
                      let startCol = 1;
                      let endCol = 7;

                      week.forEach((d, idx) => {
                        if (d.isCurrentMonth && d.dayNum === span.startDay) {
                          startCol = idx + 1;
                        }
                        if (d.isCurrentMonth && d.dayNum === span.endDay) {
                          endCol = idx + 1;
                        }
                      });

                      const colSpan = Math.max(1, endCol - startCol + 1);
                      const isFlight = span.dutyType === 'flight';
                      const isStandby = span.dutyType === 'standby';
                      const isLeave = span.dutyType === 'leave' || span.dutyType === 'rest';

                      let barBg = 'bg-[#1a73e8] hover:bg-[#1557b0]';
                      let barText = `✈️ ${span.reportTime ? `${span.reportTime} ` : ''}${span.pairing.split(':')[0]}`;

                      if (isStandby) {
                        barBg = 'bg-[#5c6bc0] hover:bg-[#3f51b5]';
                        barText = `⏳ STB ${span.reportTime ? `${span.reportTime} ` : ''}`;
                      } else if (isLeave) {
                        barBg = 'bg-[#0f9d58] hover:bg-[#0b8043]';
                        barText = span.pairing?.includes('AL') ? '🏖️ AL' : '🎉 Off';
                      }

                      return (
                        <div key={spanIdx} className="grid grid-cols-7 gap-1">
                          <div
                            onClick={() => handleOpenFlightModal(span, span.startDay)}
                            style={{
                              gridColumn: `${startCol} / span ${colSpan}`
                            }}
                            className={`${barBg} text-white rounded-md px-2 py-0.5 text-[11px] font-semibold truncate shadow-2xs flex items-center justify-between cursor-pointer transition active:scale-[0.99] select-none`}
                            title={`${span.pairing} (วันที่ ${span.startDay}${span.isMultiDay ? ` - ${span.endDay}` : ''})`}
                          >
                            <span className="truncate">{barText}</span>
                            {span.isMultiDay && (
                              <span className="text-[9.5px] opacity-85 font-mono ml-1 flex-shrink-0">
                                {span.startDay} - {span.endDay} ส.ค.
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Single Day Sleep helper chip for active day duties */}
                    <div className="grid grid-cols-7 gap-1">
                      {week.map((dayObj, colIdx) => {
                        const flight = dayObj.isCurrentMonth ? flightsByDay[dayObj.dayNum] : null;
                        if (!flight || flight.dutyType === 'leave' || flight.dutyType === 'rest' || !flight.reportTime) {
                          return <div key={colIdx} />;
                        }
                        const sched = calculateFlightSchedule(flight.reportTime, dressUpMinutes, transitMinutes);
                        return (
                          <div 
                            key={colIdx} 
                            onClick={() => handleOpenFlightModal(flight, dayObj.dayNum)}
                            className="hidden sm:flex items-center gap-1 text-[9.5px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200/70 rounded px-1 py-0.2 truncate cursor-pointer hover:bg-indigo-100 transition"
                          >
                            <Moon className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="truncate">นอน {sched.bedTime8h}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              );
            })}
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
                  {activeModalFlight.isMultiDay && ` (ปฏิบัติงานข้ามวัน ${activeModalFlight.startDay} - ${activeModalFlight.endDay} ส.ค.)`}
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
