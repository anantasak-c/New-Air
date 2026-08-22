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
  Share2,
  Radio,
  Grid,
  List,
  Layers,
  MoreHorizontal
} from 'lucide-react';
import { calculateFlightSchedule } from '../utils/flexBuilder';
import { downloadIcsFile } from '../utils/icsGenerator';
import { decompressFlights } from '../utils/flightCodec';
import RouteStoryMap from './RouteStoryMap';
import { generateFlightradarUrl } from '../utils/airportEngine';

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NAMES_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const WEEKDAY_NAMES_7 = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const THAI_DAY_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

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
  
  // View Modes: 'focus5' (Default on mobile), 'week', 'month', 'agenda'
  const [viewMode, setViewMode] = useState('focus5');
  
  // Selected Modal
  const [activeModalFlight, setActiveModalFlight] = useState(null);
  const [selectedDay, setSelectedDay] = useState(19); // Today marker
  const [copied, setCopied] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);

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

  // Build 7-day weeks matrix
  const weeks7 = [];
  let currentWeek7 = [];
  
  for (let i = 0; i < firstDayWeekday; i++) {
    const d = prevMonthDays - firstDayWeekday + i + 1;
    currentWeek7.push({ dayNum: d, isCurrentMonth: false, weekday: i });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const weekday = new Date(currentYear, currentMonth, d).getDay();
    currentWeek7.push({ dayNum: d, isCurrentMonth: true, weekday });
    if (currentWeek7.length === 7) {
      weeks7.push(currentWeek7);
      currentWeek7 = [];
    }
  }

  if (currentWeek7.length > 0) {
    let nextD = 1;
    let w = (firstDayWeekday + daysInMonth) % 7;
    while (currentWeek7.length < 7) {
      currentWeek7.push({ dayNum: nextD++, isCurrentMonth: false, weekday: w++ % 7 });
    }
    weeks7.push(currentWeek7);
  }

  // Build 5-day rows matrix for Focus Mode around the selected day.
  const rows5 = [];
  const startFocusDay = Math.max(1, Math.min(daysInMonth - 14, selectedDay - 3));
  const totalFocusDays = 15; // 3 rows of 5 days
  let currentChunk5 = [];

  for (let i = 0; i < totalFocusDays; i++) {
    const d = startFocusDay + i;
    if (d <= daysInMonth) {
      const weekday = new Date(currentYear, currentMonth, d).getDay();
      currentChunk5.push({ dayNum: d, isCurrentMonth: true, weekday });
    } else {
      const nextD = d - daysInMonth;
      const weekday = new Date(currentYear, currentMonth + 1, nextD).getDay();
      currentChunk5.push({ dayNum: nextD, isCurrentMonth: false, weekday });
    }

    if (currentChunk5.length === 5) {
      rows5.push(currentChunk5);
      currentChunk5 = [];
    }
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
      
      {/* Compact white utility header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight text-slate-950">ตารางชีวิตลูกเรือ</p>
              <p className="hidden text-[11px] font-medium text-slate-500 sm:block">Duty, rest และเวลานอนที่ต้องรู้</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button type="button" onClick={prevMonth} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 active:scale-95" title="เดือนก่อนหน้า"><ChevronLeft className="h-4 w-4" /></button>
            <button type="button" onClick={goToToday} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800 transition hover:bg-slate-50 active:scale-95">วันนี้</button>
            <button type="button" onClick={nextMonth} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 active:scale-95" title="เดือนถัดไป"><ChevronRight className="h-4 w-4" /></button>
            <div className="relative ml-0.5">
              <button type="button" onClick={() => setIsActionsOpen(open => !open)} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 active:scale-95" aria-label="ตัวเลือกเพิ่มเติม" aria-expanded={isActionsOpen}><MoreHorizontal className="h-5 w-5" /></button>
              {isActionsOpen && (
                <div className="absolute right-0 top-11 z-50 w-52 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  <button type="button" onClick={() => { setViewMode('agenda'); setIsActionsOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"><List className="h-4 w-4 text-slate-500" /> ไทม์ไลน์</button>
                  <button type="button" onClick={() => { setViewMode('story'); setIsActionsOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"><Layers className="h-4 w-4 text-slate-500" /> สตอรี่ & เรดาร์</button>
                  <div className="my-1 border-t border-slate-100" />
                  <button type="button" onClick={() => { downloadIcsFile(flights, dressUpMinutes, transitMinutes); setIsActionsOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"><Download className="h-4 w-4 text-slate-500" /> ส่งออก Calendar (.ics)</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-3 flex max-w-7xl items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-tight text-slate-950">{MONTH_NAMES_TH[currentMonth]} {currentYear}</h2>
          <div className="flex rounded-xl bg-slate-100 p-1" aria-label="เลือกรูปแบบปฏิทิน">
            <button type="button" onClick={() => setViewMode('focus5')} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${viewMode === 'focus5' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>5 วัน</button>
            <button type="button" onClick={() => setViewMode('month')} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${viewMode === 'month' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>เดือน</button>
          </div>
        </div>
      </header>

      {/* 2. Main Calendar Grid Area */}
      <main className="flex-1 p-2 sm:p-4 md:p-6 max-w-7xl w-full mx-auto flex flex-col">
        
        {/* ============================================================ */}
        {/* MODE 1: 5-DAY FOCUS MODE (มินิมอล สะอาดตา อ่านง่ายใน 1 วินาที) */}
        {/* ============================================================ */}
        {viewMode === 'focus5' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
            
            <div className="border-b border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex sm:items-center sm:justify-between">
              <span><strong className="font-semibold text-slate-800">ภาพรวม 5 วัน</strong> · แตะ duty เพื่อดูเวลารายงานและเวลาพัก</span>
              <span className="mt-1 block font-medium text-slate-400 sm:mt-0">{startFocusDay}–{Math.min(startFocusDay + 14, daysInMonth)} {MONTH_NAMES_TH[currentMonth]}</span>
            </div>

            {/* 5-Day Grid Rows */}
            <div className="divide-y divide-slate-200 flex-1 flex flex-col">
              {rows5.map((row, rowIdx) => (
                <div key={rowIdx} className="grid grid-cols-5 divide-x divide-slate-100 min-h-[116px] sm:min-h-[130px] flex-1">
                  {row.map((dayObj, colIdx) => {
                    const isToday = currentMonth === 7 && currentYear === 2026 && dayObj.isCurrentMonth && dayObj.dayNum === 19;
                    const flight = dayObj.isCurrentMonth ? flightsByDay[dayObj.dayNum] : null;
                    const isFlight = flight?.dutyType === 'flight';
                    const isStandby = flight?.dutyType === 'standby';
                    const isLeave = flight?.dutyType === 'leave' || flight?.dutyType === 'rest';

                    const nextFlight = flightsByDay[dayObj.dayNum + 1];
                    const hasEarlyFlightTomorrow = dayObj.isCurrentMonth && nextFlight && nextFlight.reportTime && parseInt(nextFlight.reportTime.split(':')[0], 10) < 7;

                    // Clean Duty Code (Shortened)
                    let shortCode = '';
                    if (flight?.pairing) {
                      shortCode = flight.pairing.split(':')[0].trim();
                    }

                    return (
                      <div
                        key={colIdx}
                        onClick={() => flight ? handleOpenFlightModal(flight, dayObj.dayNum) : setSelectedDay(dayObj.dayNum)}
                        className={`p-2.5 flex flex-col justify-between transition-colors cursor-pointer relative group ${
                          isToday ? 'bg-slate-50' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Header: Date + Weekday + Moon */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span 
                              className={`text-xs font-extrabold w-5 h-5 flex items-center justify-center rounded-full transition ${
                                isToday
                                  ? 'bg-slate-900 text-white shadow-sm'
                                  : selectedDay === dayObj.dayNum && dayObj.isCurrentMonth
                                  ? 'bg-slate-200 text-slate-900'
                                  : 'text-slate-800'
                              }`}
                            >
                              {dayObj.dayNum}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400">
                              {THAI_DAY_SHORT[dayObj.weekday]}
                            </span>
                          </div>

                          {hasEarlyFlightTomorrow && (
                            <span title="คืนนี้ต้องรีบเข้านอน (มีบินเช้าพรุ่งนี้)">
                              <Moon className="w-3 h-3 fill-amber-400 text-amber-500" />
                            </span>
                          )}
                        </div>

                        {/* Duty content keeps the surface white and reserves color for status. */}
                        <div className="my-auto py-2">
                          {flight ? (
                            <>
                              {isFlight && (
                                <div className="rounded-xl border border-slate-200 border-l-[3px] border-l-sky-500 bg-white p-2 text-left shadow-sm transition group-hover:border-slate-300">
                                  <div className="text-xs font-bold tracking-tight font-mono text-slate-900">
                                    {flight.reportTime || '--:--'} - {flight.releaseTime || '15:45'}
                                  </div>
                                  <div className="mt-1 truncate text-[10px] font-bold tracking-wide text-sky-700">
                                    FLIGHT · {shortCode || 'Flight'}
                                  </div>
                                </div>
                              )}

                              {isStandby && (
                                <div className="rounded-xl border border-slate-200 border-l-[3px] border-l-violet-500 bg-white p-2 text-left shadow-sm transition group-hover:border-slate-300">
                                  <div className="text-xs font-bold tracking-tight font-mono text-slate-900">
                                    {flight.reportTime || '02:00'} - {flight.releaseTime || '12:00'}
                                  </div>
                                  <div className="mt-1 truncate text-[10px] font-bold tracking-wide text-violet-700">
                                    STANDBY · {shortCode || 'SBM'}
                                  </div>
                                </div>
                              )}

                              {isLeave && (
                                <div className="rounded-xl border border-slate-200 border-l-[3px] border-l-emerald-500 bg-white p-2 text-left shadow-sm transition group-hover:border-slate-300">
                                  <span className="text-xs font-bold tracking-wide text-emerald-700">
                                    {flight.pairing?.includes('AL') ? 'ANNUAL LEAVE' : 'DAY OFF'}
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="py-2 text-center text-xs font-medium text-slate-400">
                              ว่าง
                            </div>
                          )}
                        </div>

                        <div className="text-[9.5px] text-slate-400 text-center font-medium">
                          {isFlight ? 'แตะดูรายละเอียด' : isStandby ? 'พร้อมเรียกตัว' : isLeave ? 'พักผ่อนเต็มวัน' : 'ไม่มี duty'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* MODE 2: FULL MONTH 7-DAY GOOGLE CALENDAR GRID */}
        {/* ============================================================ */}
        {viewMode === 'month' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
            
            {/* Weekdays Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center py-2.5">
              {WEEKDAY_NAMES_7.map((wd, i) => (
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

            {/* Weeks 7-Column Matrix */}
            <div className="divide-y divide-slate-200 flex-1 flex flex-col">
              {weeks7.map((week, weekIdx) => {
                const weekStartDay = week[0].isCurrentMonth ? week[0].dayNum : 1;
                const weekEndDay = week[6].isCurrentMonth ? week[6].dayNum : daysInMonth;

                const activeWeekSpans = processedSpans.filter(span => {
                  return span.startDay <= weekEndDay && span.endDay >= weekStartDay;
                });

                return (
                  <div key={weekIdx} className="relative min-h-[110px] sm:min-h-[135px] flex-1 flex flex-col justify-between">
                    
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

                    {/* Top Layer: Day Numbers */}
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
                              className={`text-xs sm:text-sm font-bold w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full transition ${
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
                              <span title="คืนนี้ต้องรีบเข้านอน (มีบินเช้าพรุ่งนี้)">
                                <Moon className="w-3 h-3 fill-amber-400 text-amber-500" />
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Middle Layer: Spanning Bars */}
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

                        let barBg = 'border border-slate-200 border-l-[3px] border-l-sky-500 bg-white text-slate-800 hover:border-slate-300';
                        let barIcon = <Plane className="w-3 h-3 flex-shrink-0 text-sky-600" />;
                        let barTitle = `${span.reportTime ? `${span.reportTime} L • ` : ''}${span.pairing}`;

                        if (isStandby) {
                          barBg = 'border border-slate-200 border-l-[3px] border-l-violet-500 bg-white text-slate-800 hover:border-slate-300';
                          barIcon = <Clock className="w-3 h-3 flex-shrink-0 text-violet-600" />;
                          barTitle = `Standby ${span.reportTime ? `(${span.reportTime} L)` : ''} • ${span.pairing}`;
                        } else if (isLeave) {
                          barBg = 'border border-slate-200 border-l-[3px] border-l-emerald-500 bg-white text-slate-800 hover:border-slate-300';
                          barIcon = <Sun className="w-3 h-3 flex-shrink-0 text-emerald-600" />;
                          barTitle = `DAY OFF • ${span.pairing || 'Rest'}`;
                        }

                        return (
                          <div key={spanIdx} className="grid grid-cols-7 gap-1.5">
                            <div
                              onClick={() => handleOpenFlightModal(span, span.startDay)}
                              style={{
                                gridColumn: `${startCol} / span ${colSpan}`
                              }}
                              className={`${barBg} rounded-lg px-2.5 py-1.5 text-xs font-semibold truncate shadow-sm flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] select-none hover:shadow-md`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                {barIcon}
                                <span className="truncate">{barTitle}</span>
                              </div>

                              {span.isMultiDay && (
                                <span className="text-[10px] text-slate-500 font-mono ml-2 flex-shrink-0 px-1.5 py-0.5 rounded bg-slate-100">
                                  {span.startDay} - {span.endDay} ส.ค.
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ============================================================ */}
        {/* MODE 3: VERTICAL AGENDA FEED (ฟีดรายการทีละวัน) */}
        {/* ============================================================ */}
        {viewMode === 'agenda' && (
          <div className="space-y-3 max-w-2xl mx-auto w-full">
            {flights.map((flight, idx) => {
              const dayNum = parseFlightDay(flight.date);
              const isFlight = flight.dutyType === 'flight';
              const isStandby = flight.dutyType === 'standby';
              const isLeave = flight.dutyType === 'leave' || flight.dutyType === 'rest';
              const sched = flight.reportTime ? calculateFlightSchedule(flight.reportTime, dressUpMinutes, transitMinutes) : null;

              return (
                <div 
                  key={idx}
                  onClick={() => handleOpenFlightModal(flight, dayNum || 19)}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-slate-900">{flight.date}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        isFlight ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        isStandby ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {isFlight ? '✈️ FLIGHT' : isStandby ? '⏳ STANDBY' : '🎉 DAY OFF'}
                      </span>
                    </div>

                    <span className="text-xs font-mono font-bold text-slate-600">
                      {flight.reportTime ? `Report: ${flight.reportTime} L` : 'ทั้งวัน'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{flight.pairing}</h3>
                    {sched && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 pt-2 border-t border-slate-100 text-xs">
                        <div className="bg-indigo-50 p-2 rounded-xl">
                          <span className="text-slate-500 text-[11px] block">🌙 เข้านอน (8h)</span>
                          <span className="font-bold text-indigo-700 font-mono text-sm">{sched.bedTime8h}</span>
                        </div>
                        <div className="bg-blue-50 p-2 rounded-xl">
                          <span className="text-slate-500 text-[11px] block">☀️ ตื่นนอน</span>
                          <span className="font-bold text-blue-700 font-mono text-sm">{sched.wakeupTime}</span>
                        </div>
                        <div className="bg-emerald-50 p-2 rounded-xl">
                          <span className="text-slate-500 text-[11px] block">🚗 ออกจากบ้าน</span>
                          <span className="font-bold text-emerald-700 font-mono text-sm">{sched.departureTime}</span>
                        </div>
                        <div className="bg-amber-50 p-2 rounded-xl">
                          <span className="text-slate-500 text-[11px] block">☕ ว่าง (Free)</span>
                          <span className="font-bold text-amber-800 font-mono text-sm">{flight.releaseTime || '15:45'} น.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================================ */}
        {/* MODE 4: CREW ROUTE STORY MAP & FLIGHTRADAR24 */}
        {/* ============================================================ */}
        {viewMode === 'story' && (
          <RouteStoryMap flights={flights} />
        )}

      </main>

      {/* 3. Detail Popover Modal */}
      {activeModalFlight && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/35 p-0 backdrop-blur-sm sm:items-center sm:p-4 animate-fade-in">
          <div 
            className="max-h-[92vh] w-full max-w-lg overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:max-h-[85vh] sm:rounded-3xl animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            
            <div className="px-5 pt-3">
              <div className="mx-auto h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" />
            </div>

            {/* Bottom-sheet header */}
            <div className="flex items-start justify-between px-5 pb-4 pt-3">
              <div className="space-y-1">
                <div className={`flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider ${
                  activeModalFlight.dutyType === 'flight'
                    ? 'bg-sky-50 text-sky-700'
                    : activeModalFlight.dutyType === 'standby'
                    ? 'bg-violet-50 text-violet-700'
                    : 'bg-emerald-50 text-emerald-700'
                }`}>
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
                <h3 className="text-xl font-bold leading-tight text-slate-950">
                  {activeModalFlight.pairing}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {activeModalFlight.date} • สิงหาคม 2026
                  {activeModalFlight.isMultiDay && ` (ปฏิบัติงานข้ามวัน ${activeModalFlight.startDay} - ${activeModalFlight.endDay} ส.ค.)`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalFlight(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Popover Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* Flight Duty Timeline */}
              {modalSchedule ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Report</span>
                      <span className="mt-1 block font-mono text-lg font-bold text-slate-950">{modalSchedule.reportTime} <small className="text-xs text-slate-400">L</small></span>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Release</span>
                      <span className="mt-1 block font-mono text-lg font-bold text-slate-950">{activeModalFlight.releaseTime || '15:45'} <small className="text-xs text-slate-400">L</small></span>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>การเตรียมตัวก่อนเริ่ม duty</span>
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

              {/* Modal Action Buttons: Copy Brief + Google Cal + Flightradar24 */}
              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyEventBrief}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-2xs"
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
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>ใส่ Calendar</span>
                  </button>
                </div>

                {activeModalFlight.dutyType === 'flight' && (
                  <a
                    href={generateFlightradarUrl(activeModalFlight.pairing)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md"
                  >
                    <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>📡 ติดตามเครื่องบินสดบน Flightradar24</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </a>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
