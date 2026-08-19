import React, { useState, useEffect } from 'react';
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
  Sliders,
  Maximize2,
  Minimize2,
  Filter,
  Heart,
  Share2
} from 'lucide-react';
import { calculateFlightSchedule } from '../utils/flexBuilder';
import { downloadIcsFile } from '../utils/icsGenerator';
import { decompressFlights } from '../utils/flightCodec';

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

export default function FullScreenCalendarPage() {
  const [flights, setFlights] = useState([]);
  const [dressUpMinutes, setDressUpMinutes] = useState(90);
  const [transitMinutes, setTransitMinutes] = useState(60);

  // Current viewed month and year (Default August 2026)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(7); // 7 = August
  
  // Selected Modal
  const [activeModalFlight, setActiveModalFlight] = useState(null);
  const [selectedDay, setSelectedDay] = useState(19); // Today marker
  const [filterType, setFilterType] = useState('all'); // 'all', 'flight', 'standby', 'leave'
  const [copied, setCopied] = useState(false);

  // 1. Parse flight data from URL
  useEffect(() => {
    const getFlightDataParam = () => {
      const searchParams = new URLSearchParams(window.location.search);
      let d = searchParams.get('d');
      if (d) return d;

      const liffState = searchParams.get('liff.state');
      if (liffState) {
        try {
          const decodedState = decodeURIComponent(liffState);
          const stateQuery = decodedState.includes('?') 
            ? decodedState.split('?')[1] 
            : decodedState.startsWith('d=') ? decodedState : '';
          const nestedParams = new URLSearchParams(stateQuery);
          return nestedParams.get('d');
        } catch (err) {
          console.warn('Failed to parse liff.state:', err);
        }
      }
      return null;
    };

    const d = getFlightDataParam();
    if (d) {
      const decoded = decompressFlights(d);
      if (Array.isArray(decoded) && decoded.length > 0) {
        setFlights(decoded);
      }
    }
  }, []);

  // Group flights by day
  const flightsByDay = {};
  flights.forEach(f => {
    const day = parseFlightDay(f.date);
    if (day) {
      flightsByDay[day] = f;
    }
  });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayWeekday = new Date(currentYear, currentMonth, 1).getDay();
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
  
  for (let i = 0; i < firstDayWeekday; i++) {
    const d = prevMonthDays - firstDayWeekday + i + 1;
    currentWeek.push({ dayNum: d, isCurrentMonth: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    currentWeek.push({ dayNum: d, isCurrentMonth: true });
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    let nextD = 1;
    while (currentWeek.length < 7) {
      currentWeek.push({ dayNum: nextD++, isCurrentMonth: false });
    }
    weeks.push(currentWeek);
  }

  // Calculate multi-day spanning ranges
  const processedSpans = [];
  const handledFlightIndices = new Set();

  flights.forEach((f, idx) => {
    if (handledFlightIndices.has(idx)) return;
    const startDay = parseFlightDay(f.date);
    if (!startDay) return;

    let endDay = startDay;

    const isOvernight = (f.pairing && f.pairing.includes('- Aug')) || 
      (f.date && f.date.includes('-')) ||
      (f.reportTime && f.releaseTime && parseInt(f.releaseTime.split(':')[0], 10) < parseInt(f.reportTime.split(':')[0], 10));

    if (isOvernight) {
      endDay = startDay + 1;
    } else {
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

  const handleOpenFlightModal = (flight, dayNum) => {
    setSelectedDay(dayNum);
    setActiveModalFlight({ ...flight, dayNum });
  };

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
    <div className="min-h-screen bg-[#F8FAFD] text-[#1F1F1F] flex flex-col font-[-apple-system,BlinkMacSystemFont,'Google_Sans','SF_Pro_Display','Segoe_UI',Roboto,sans-serif]">
      
      {/* 1. Full Screen Google Calendar Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-3 shadow-xs">
        
        {/* Left: App Logo + Today + Month Navigation */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">Flight Rest Calendar</h1>
              <p className="text-[11px] text-slate-500 font-normal">ปฏิทินวางแผนชีวิต & เวลานอนลูกเรือ</p>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-slate-200 hidden sm:block" />

          {/* Today & Arrows */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToToday}
              className="px-3.5 py-1.5 rounded-full border border-slate-300 hover:bg-slate-50 active:scale-95 text-xs font-bold text-slate-700 transition shadow-2xs"
            >
              วันนี้ (Today)
            </button>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={prevMonth}
                className="w-7 h-7 rounded-lg hover:bg-white active:scale-90 flex items-center justify-center text-slate-600 transition shadow-2xs"
                title="เดือนก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="w-7 h-7 rounded-lg hover:bg-white active:scale-90 flex items-center justify-center text-slate-600 transition shadow-2xs"
                title="เดือนถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight ml-1">
              {MONTH_NAMES_TH[currentMonth]} {currentYear}
              <span className="text-xs font-normal text-slate-400 ml-1.5 hidden md:inline">({MONTH_NAMES_EN[currentMonth]})</span>
            </h2>
          </div>
        </div>

        {/* Right Actions: Filters & Sync Calendar Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 1-Click Sync to Calendar */}
          <button
            type="button"
            onClick={() => downloadIcsFile(flights, dressUpMinutes, transitMinutes)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold transition active:scale-95 shadow-md shadow-blue-600/20"
          >
            <Download className="w-4 h-4" />
            <span>ซิงค์เข้า Google / Apple Calendar (.ics)</span>
          </button>
        </div>

      </header>

      {/* 2. Full-Screen Google Calendar Main Workspace */}
      <main className="flex-1 p-2 sm:p-4 md:p-6 max-w-7xl w-full mx-auto flex flex-col">
        
        {/* Full-Width Calendar Card Container */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
          
          {/* Weekday Names Header Row */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center py-2.5">
            {WEEKDAY_NAMES.map((wd, i) => (
              <div 
                key={wd} 
                className={`text-xs font-bold tracking-wider ${
                  i === 0 ? 'text-rose-600' : i === 6 ? 'text-blue-600' : 'text-slate-600'
                }`}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Weeks Grid Matrix */}
          <div className="divide-y divide-slate-200 flex-1 flex flex-col">
            {weeks.map((week, weekIdx) => {
              const weekStartDay = week[0].isCurrentMonth ? week[0].dayNum : 1;
              const weekEndDay = week[6].isCurrentMonth ? week[6].dayNum : daysInMonth;

              const activeWeekSpans = processedSpans.filter(span => {
                return span.startDay <= weekEndDay && span.endDay >= weekStartDay;
              });

              return (
                <div key={weekIdx} className="relative min-h-[110px] sm:min-h-[135px] flex-1 flex flex-col justify-between group">
                  
                  {/* Background 7 Day Columns */}
                  <div className="absolute inset-0 grid grid-cols-7 divide-x divide-slate-200 pointer-events-none">
                    {week.map((dayObj, colIdx) => {
                      const isToday = currentMonth === 7 && currentYear === 2026 && dayObj.isCurrentMonth && dayObj.dayNum === 19;
                      return (
                        <div 
                          key={colIdx} 
                          className={`p-2 flex flex-col justify-between transition ${
                            !dayObj.isCurrentMonth ? 'bg-slate-50/50' : isToday ? 'bg-blue-50/20' : ''
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Top Layer: Day Numbers + Moon Badge */}
                  <div className="grid grid-cols-7 relative z-10 p-2 pointer-events-auto">
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
                            className={`text-xs sm:text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition ${
                              isToday
                                ? 'bg-[#1a73e8] text-white shadow-xs'
                                : selectedDay === dayObj.dayNum && dayObj.isCurrentMonth
                                ? 'bg-slate-200 text-slate-900'
                                : dayObj.isCurrentMonth
                                ? 'text-slate-800'
                                : 'text-slate-300'
                            }`}
                          >
                            {dayObj.dayNum}
                          </span>

                          {hasEarlyFlightTomorrow && (
                            <span 
                              className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200 font-bold"
                              title="คืนนี้ต้องรีบเข้านอน (มีบินเช้าพรุ่งนี้)"
                            >
                              <Moon className="w-3 h-3 fill-amber-400 text-amber-500" />
                              <span className="hidden lg:inline">นอนเร็ว</span>
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Middle Layer: Multi-Day Spanning Bars & Detailed Event Chips */}
                  <div className="relative z-10 px-1.5 pb-2 space-y-1.5">
                    {activeWeekSpans.map((span, spanIdx) => {
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

                      let barBg = 'bg-[#1a73e8] hover:bg-[#1557b0] text-white';
                      let barIcon = <Plane className="w-3 h-3 flex-shrink-0" />;
                      let barTitle = `${span.reportTime ? `${span.reportTime} L • ` : ''}${span.pairing}`;

                      if (isStandby) {
                        barBg = 'bg-[#5c6bc0] hover:bg-[#3f51b5] text-white';
                        barIcon = <Clock className="w-3 h-3 flex-shrink-0" />;
                        barTitle = `Standby ${span.reportTime ? `(${span.reportTime} L)` : ''} • ${span.pairing}`;
                      } else if (isLeave) {
                        barBg = 'bg-[#0f9d58] hover:bg-[#0b8043] text-white';
                        barIcon = <Sun className="w-3 h-3 flex-shrink-0" />;
                        barTitle = `🎉 Day Off • ${span.pairing || 'Rest'}`;
                      }

                      return (
                        <div key={spanIdx} className="grid grid-cols-7 gap-1.5">
                          <div
                            onClick={() => handleOpenFlightModal(span, span.startDay)}
                            style={{
                              gridColumn: `${startCol} / span ${colSpan}`
                            }}
                            className={`${barBg} rounded-lg px-2.5 py-1 text-xs font-semibold truncate shadow-xs flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] select-none hover:shadow-md`}
                            title={`${span.pairing} (${span.startDay}${span.isMultiDay ? ` - ${span.endDay}` : ''} ส.ค.)`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              {barIcon}
                              <span className="truncate">{barTitle}</span>
                            </div>

                            {span.isMultiDay && (
                              <span className="text-[10px] opacity-90 font-mono ml-2 flex-shrink-0 px-1.5 py-0.2 rounded bg-black/20">
                                {span.startDay} - {span.endDay} ส.ค.
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Bedtime & Wakeup Details Sub-Bar */}
                    <div className="grid grid-cols-7 gap-1.5">
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
                            className="hidden md:flex items-center justify-between text-[10px] font-medium text-indigo-800 bg-indigo-50/90 border border-indigo-200/80 rounded-md px-1.5 py-0.5 truncate cursor-pointer hover:bg-indigo-100 transition shadow-2xs"
                          >
                            <span className="flex items-center gap-1 truncate">
                              <Moon className="w-2.5 h-2.5 text-indigo-600 flex-shrink-0" />
                              <span className="truncate">นอน {sched.bedTime8h}</span>
                            </span>
                            <span className="text-slate-500 font-mono text-[9px] ml-1">
                              ตื่น {sched.wakeupTime}
                            </span>
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
      </main>

      {/* 3. Google Calendar Detail Modal */}
      {activeModalFlight && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div 
            className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            
            {/* Popover Header Banner */}
            <div className={`p-5 text-white flex items-start justify-between ${
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
                <h3 className="text-xl font-bold leading-tight">
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
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* Flight Duty Timeline */}
              {modalSchedule ? (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>ไทม์ไลน์การนอน & ปฏิบัติหน้าที่อย่างละเอียด:</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                        <Moon className="w-4 h-4 text-indigo-600" />
                        เวลานอนแนะนำ (คืนก่อนหน้า):
                      </span>
                      <span className="font-bold text-indigo-700 font-mono text-sm">
                        {modalSchedule.bedTime8h} (8h) / {modalSchedule.bedTime7h} (7h)
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                        <Sun className="w-4 h-4 text-amber-500" />
                        เวลาตื่นนอน & แต่งตัว ({dressUpMinutes} นาที):
                      </span>
                      <span className="font-bold text-slate-900 font-mono text-sm">
                        {modalSchedule.wakeupTime}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                        <Car className="w-4 h-4 text-emerald-600" />
                        ออกจากบ้าน ({transitMinutes} นาที):
                      </span>
                      <span className="font-bold text-slate-900 font-mono text-sm">
                        {modalSchedule.departureTime}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                      <span className="text-slate-900 font-bold flex items-center gap-1.5">
                        <Plane className="w-4 h-4 text-blue-600" />
                        เวลาเริ่มงาน (Report):
                      </span>
                      <span className="font-extrabold text-blue-700 font-mono text-base">
                        {modalSchedule.reportTime} L
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">
                        เสร็จสิ้นงาน (Release):
                      </span>
                      <span className="font-bold text-slate-800 font-mono text-sm">
                        {activeModalFlight.releaseTime || '15:45'} L
                      </span>
                    </div>
                  </div>

                  {/* Free Time Life Planning Slot */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-amber-600 fill-amber-500" />
                        ช่วงเวลาว่างสำหรับวางแผนชีวิต (Free Time):
                      </span>
                      <span className="text-xs font-bold text-amber-800 font-mono">
                        {activeModalFlight.releaseTime || '15:45'} น. เป็นต้นไป
                      </span>
                    </div>
                    <p className="text-xs text-amber-800/80 leading-relaxed">
                      หลังจาก Release งานแล้ว สามารถวางแผนออกกำลังกาย นัดทานข้าวกับเพื่อน หรือใช้เวลาร่วมกับครอบครัวได้อย่างสบายใจครับ
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <Sun className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-emerald-900">วันพักผ่อนเต็มวัน (100% Free Day)</h4>
                  <p className="text-xs text-emerald-700">
                    ไม่มีหน้าที่การบินตลอดทั้งวัน สามารถวางแผนท่องเที่ยว หรือนอนพักผ่อนได้อย่างเต็มที่ครับ! 🛌🏖️
                  </p>
                </div>
              )}

              {/* Modal Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyEventBrief}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95"
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
                  className="flex-1 py-3 px-4 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md"
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
