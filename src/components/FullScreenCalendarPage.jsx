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
  Grid,
  List,
  Layers
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

  // Build 5-day rows matrix for Focus Mode (3 rows of 5 days starting around Today)
  // Display days from 16 to 31 in 5-day chunks
  const rows5 = [];
  const startFocusDay = 16; // Focus around the active duty period (16 - 31)
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
      
      {/* 1. Full Screen Google Calendar Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-3.5 sm:px-6 py-2.5 flex items-center justify-between flex-wrap gap-2.5 shadow-xs">
        
        {/* Left: App Logo + Today + Month Navigation */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">Flight Rest Calendar</h1>
              <p className="text-[10px] text-slate-500 font-normal hidden sm:block">ปฏิทินวางแผนชีวิต & เวลานอนลูกเรือ</p>
            </div>
          </div>

          <div className="h-5 w-[1px] bg-slate-200 hidden sm:block" />

          {/* Today & Arrows */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={goToToday}
              className="px-3 py-1 rounded-full border border-slate-300 hover:bg-slate-50 active:scale-95 text-xs font-bold text-slate-700 transition shadow-2xs"
            >
              Today
            </button>

            <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={prevMonth}
                className="w-6 h-6 rounded-lg hover:bg-white active:scale-90 flex items-center justify-center text-slate-600 transition shadow-2xs"
                title="เดือนก่อนหน้า"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="w-6 h-6 rounded-lg hover:bg-white active:scale-90 flex items-center justify-center text-slate-600 transition shadow-2xs"
                title="เดือนถัดไป"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <h2 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight ml-1">
              {MONTH_NAMES_TH[currentMonth]} {currentYear}
            </h2>
          </div>
        </div>

        {/* Right Actions: View Mode Switcher + Sync Calendar Button */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* View Mode Segmented Controls */}
          <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200 flex items-center gap-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('focus5')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'focus5'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="แสดงแบบ 5 วันต่อแถว ช่องกว้างอ่านง่ายบนมือถือ"
            >
              🎯 5 วัน (Focus)
            </button>

            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="แสดงทั้งเดือนแบบ 7 วัน"
            >
              🗓️ ทั้งเดือน
            </button>

            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'agenda'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="แสดงเป็นฟีดรายการทีละวัน"
            >
              📋 ไทม์ไลน์
            </button>

            <button
              type="button"
              onClick={() => setViewMode('story')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === 'story'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
              title="แผนที่เรดาร์มืด & สร้างภาพลง IG Story 9:16"
            >
              <span>🗺️ สตอรี่ & เรดาร์</span>
            </button>
          </div>

          {/* 1-Click Sync to Calendar */}
          <button
            type="button"
            onClick={() => downloadIcsFile(flights, dressUpMinutes, transitMinutes)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold transition active:scale-95 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sync เข้าปฏิทิน (.ics)</span>
            <span className="sm:hidden">Sync</span>
          </button>
        </div>

      </header>

      {/* 2. Main Calendar Grid Area */}
      <main className="flex-1 p-2 sm:p-4 md:p-6 max-w-7xl w-full mx-auto flex flex-col">
        
        {/* ============================================================ */}
        {/* MODE 1: 5-DAY FOCUS MODE (มินิมอล สะอาดตา อ่านง่ายใน 1 วินาที) */}
        {/* ============================================================ */}
        {viewMode === 'focus5' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
            
            {/* Minimalist Guide Banner */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-600 font-semibold">
              <span>🎯 <strong>โหมด 5 วัน (Focus)</strong> • แตะช่องวันเพื่อดูรายละเอียดเวลานอน & Free Time</span>
              <span className="text-[11px] text-blue-600 font-bold">16 - 30 ส.ค. 2026</span>
            </div>

            {/* 5-Day Grid Rows */}
            <div className="divide-y divide-slate-200 flex-1 flex flex-col">
              {rows5.map((row, rowIdx) => (
                <div key={rowIdx} className="grid grid-cols-5 divide-x divide-slate-200 min-h-[110px] sm:min-h-[125px] flex-1">
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
                        className={`p-2 flex flex-col justify-between transition-colors cursor-pointer relative group ${
                          isToday ? 'bg-blue-50/30' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Header: Date + Weekday + Moon */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span 
                              className={`text-xs font-extrabold w-5 h-5 flex items-center justify-center rounded-full transition ${
                                isToday
                                  ? 'bg-[#1a73e8] text-white shadow-xs'
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

                        {/* Duty Content: Report - Release & Short Code */}
                        <div className="my-auto py-1">
                          {flight ? (
                            <>
                              {/* 1. Active Flight Duty */}
                              {isFlight && (
                                <div className="bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl p-2 text-center shadow-xs transition space-y-0.5">
                                  <div className="text-xs font-black tracking-tight font-mono">
                                    {flight.reportTime || '--:--'} - {flight.releaseTime || '15:45'}
                                  </div>
                                  <div className="text-[10.5px] font-bold text-blue-100 truncate">
                                    ✈️ {shortCode || 'Flight'}
                                  </div>
                                </div>
                              )}

                              {/* 2. Standby Duty */}
                              {isStandby && (
                                <div className="bg-[#5c6bc0] hover:bg-[#3f51b5] text-white rounded-xl p-2 text-center shadow-xs transition space-y-0.5">
                                  <div className="text-xs font-black tracking-tight font-mono">
                                    {flight.reportTime || '02:00'} - {flight.releaseTime || '12:00'}
                                  </div>
                                  <div className="text-[10.5px] font-bold text-indigo-100 truncate">
                                    ⏳ STB ({shortCode || 'SBM'})
                                  </div>
                                </div>
                              )}

                              {/* 3. Day Off / Rest / Leave */}
                              {isLeave && (
                                <div className="bg-[#0f9d58] hover:bg-[#0b8043] text-white rounded-xl p-2 text-center shadow-xs transition">
                                  <span className="text-xs font-black tracking-wider">
                                    {flight.pairing?.includes('AL') ? '🏖️ AL' : '🎉 Off'}
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            /* 4. Empty Day */
                            <div className="text-center py-2 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-400">
                              ว่าง
                            </div>
                          )}
                        </div>

                        {/* Minimal bottom hint */}
                        <div className="text-[9.5px] text-slate-400 text-center font-medium">
                          {isFlight ? 'แตะดูเวลานอน' : isStandby ? 'สแตนด์บาย' : isLeave ? 'วันพักผ่อน' : 'พักผ่อน'}
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
