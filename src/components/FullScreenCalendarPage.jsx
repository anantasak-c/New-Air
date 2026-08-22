import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plane,
  Moon,
  Sun,
  Car,
  Download,
  Clock,
  X,
  Check,
  Copy,
  Sparkles,
  ExternalLink,
  Heart,
  Radio,
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
const THAI_MONTH_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

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
  
  // View Modes: 'calendar' (mini month + daily list) or 'story' (route map)
  const [viewMode, setViewMode] = useState('calendar');
  
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

  // List rows: one row per duty span, consecutive free days collapsed into one
  const spanByDay = {};
  const isDutySpan = (sp) => sp && sp.dutyType !== 'leave' && sp.dutyType !== 'rest';
  processedSpans.forEach((sp) => {
    for (let d = sp.startDay; d <= sp.endDay; d++) spanByDay[d] = sp;
  });

  const listRows = [];
  let freeRun = null;
  const flushFree = () => {
    if (freeRun) {
      listRows.push(freeRun);
      freeRun = null;
    }
  };
  for (let d = 1; d <= daysInMonth; d++) {
    const span = spanByDay[d];
    if (isDutySpan(span)) {
      if (span.startDay === d) {
        flushFree();
        listRows.push({ type: span.dutyType, day: d, span });
      }
    } else if (!freeRun) {
      freeRun = { type: 'free', startDay: d, endDay: d, count: 1 };
    } else {
      freeRun.endDay = d;
      freeRun.count += 1;
    }
  }
  flushFree();

  // Auto-scroll the daily list to today on first load
  const todayRowRef = useRef(null);
  useEffect(() => {
    todayRowRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, []);

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
                  {viewMode === 'story' ? (
                    <button type="button" onClick={() => { setViewMode('calendar'); setIsActionsOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"><ChevronLeft className="h-4 w-4 text-slate-500" /> กลับปฏิทิน</button>
                  ) : (
                    <button type="button" onClick={() => { setViewMode('story'); setIsActionsOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"><Layers className="h-4 w-4 text-slate-500" /> เส้นทางบิน & เรดาร์</button>
                  )}
                  <div className="my-1 border-t border-slate-100" />
                  <button type="button" onClick={() => { downloadIcsFile(flights, dressUpMinutes, transitMinutes); setIsActionsOpen(false); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"><Download className="h-4 w-4 text-slate-500" /> ส่งออก Calendar (.ics)</button>
                </div>
              )}
            </div>
          </div>
        </div>

      </header>

      {/* 2. Main: mini month map + daily list (single view) */}
      <main className="flex-1 p-3 sm:p-4 md:p-6 max-w-2xl w-full mx-auto flex flex-col">

        {viewMode === 'calendar' && (
          <div className="space-y-4">

            {/* Mini month map — month at a glance in pale duty colors */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold tracking-tight text-slate-950">
                  {MONTH_NAMES_TH[currentMonth]} {currentYear}
                </h2>
                <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-300" />บิน</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-300" />STB</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-200" />ว่าง</span>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400">
                {THAI_DAY_SHORT.map((d) => <div key={d} className="py-1">{d}</div>)}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {weeks7.flat().map((dayObj, i) => {
                  const isToday = currentMonth === 7 && currentYear === 2026 && dayObj.isCurrentMonth && dayObj.dayNum === 19;
                  const flight = dayObj.isCurrentMonth ? flightsByDay[dayObj.dayNum] : null;
                  const tint = !dayObj.isCurrentMonth
                    ? 'text-slate-300'
                    : flight?.dutyType === 'flight'
                      ? 'bg-red-100/80 text-red-700'
                      : flight?.dutyType === 'standby'
                        ? 'bg-orange-100/80 text-orange-700'
                        : 'bg-emerald-50 text-emerald-600';
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={!dayObj.isCurrentMonth || !flight || flight.dutyType === 'leave' || flight.dutyType === 'rest'}
                      onClick={() => handleOpenFlightModal(flight, dayObj.dayNum)}
                      className={`aspect-square rounded-xl text-xs font-bold transition active:scale-90 ${tint} ${
                        isToday ? 'ring-2 ring-slate-900 ring-offset-1' : ''
                      }`}
                    >
                      {dayObj.dayNum}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Daily list — duty rows show wake time; free runs collapse */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
              <div className="border-b border-slate-100 px-4 py-3 text-xs text-slate-500">
                <strong className="font-semibold text-slate-800">ตารางรายวัน</strong> · แตะเพื่อดูแผนนอนและรายละเอียด (ตื่น = รายงาน ลบ แต่งตัว {dressUpMinutes}m + เดินทาง {transitMinutes}m)
              </div>
              <div className="divide-y divide-slate-100">
                {listRows.map((row, i) => {
                  if (row.type === 'free') {
                    return (
                      <div key={i} className="flex items-center gap-3 bg-emerald-50/40 px-4 py-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <Moon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-emerald-800">ว่าง {row.count} วันติด</p>
                          <p className="text-[11px] font-medium text-emerald-600/80">
                            {row.startDay === row.endDay
                              ? `${row.startDay} ${THAI_MONTH_SHORT[currentMonth]}`
                              : `${row.startDay}–${row.endDay} ${THAI_MONTH_SHORT[currentMonth]}`} · นอนเต็มอิ่ม 🛌
                          </p>
                        </div>
                      </div>
                    );
                  }

                  const span = row.span;
                  const isFlight = row.type === 'flight';
                  const isToday = currentMonth === 7 && currentYear === 2026 && row.day === 19;
                  const weekday = new Date(currentYear, currentMonth, row.day).getDay();
                  const sched = span.reportTime
                    ? calculateFlightSchedule(span.reportTime, dressUpMinutes, transitMinutes)
                    : null;
                  const accent = isFlight ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600';
                  const badge = isFlight
                    ? 'bg-red-50 text-red-700 border-red-100'
                    : 'bg-orange-50 text-orange-700 border-orange-100';

                  return (
                    <div
                      key={i}
                      ref={isToday ? todayRowRef : null}
                      onClick={() => handleOpenFlightModal(span, row.day)}
                      className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-slate-50/80 active:scale-[0.99] ${isToday ? 'bg-slate-50' : ''}`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl ${accent}`}>
                          <span className="text-sm font-extrabold leading-none">{row.day}</span>
                          <span className="mt-0.5 text-[9px] font-bold">{THAI_DAY_SHORT[weekday]}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${badge}`}>
                              {isFlight ? '✈️ บิน' : '⏳ STB'}
                            </span>
                            {span.isMultiDay && (
                              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-slate-500">
                                {span.startDay}–{span.endDay} {THAI_MONTH_SHORT[currentMonth]}
                              </span>
                            )}
                            {isToday && (
                              <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold text-white">วันนี้</span>
                            )}
                          </div>
                          <p className="mt-1 truncate text-[13px] font-bold text-slate-900">
                            {span.pairing}
                          </p>
                          <p className="text-[11px] font-medium text-slate-400">
                            {span.reportTime ? `รายงาน ${span.reportTime} L` : 'รอเรียกตัว'}
                            {span.releaseTime ? ` · ปล่อย ${span.releaseTime} L` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        {sched ? (
                          <>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">ตื่น</p>
                            <p className="font-mono text-base font-extrabold text-slate-900">{sched.wakeupTime}</p>
                          </>
                        ) : (
                          <p className="text-[10px] font-semibold text-slate-400">พร้อมเรียก</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* Route story map & Flightradar24 (via ⋯ menu) */}
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
                    ? 'bg-red-50 text-red-700'
                    : activeModalFlight.dutyType === 'standby'
                    ? 'bg-orange-50 text-orange-700'
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
