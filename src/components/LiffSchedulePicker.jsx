import React, { useState, useEffect } from 'react';
import liff from '@line/liff';
import { 
  Clock, 
  Plane, 
  Car, 
  Sparkles, 
  Check, 
  Plus, 
  Minus, 
  Send, 
  Calendar, 
  Coffee, 
  Sun,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Map
} from 'lucide-react';
import { buildRosterFlexCarousel } from '../utils/flexBuilder';
import { decompressFlights } from '../utils/flightCodec';
import SmartAviationCalendar from './SmartAviationCalendar';
import RouteStoryMap from './RouteStoryMap';

export default function LiffSchedulePicker() {
  const [liffInitialized, setLiffInitialized] = useState(false);
  const [liffError, setLiffError] = useState(null);
  const [isInLine, setIsInLine] = useState(false);

  // Active Tab: 'settings', 'calendar', or 'story'
  const [activeTab, setActiveTab] = useState('settings');

  // Scanned flights parsed from URL
  const [flights, setFlights] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState(new Set());

  // Time settings in minutes
  const [dressUpMinutes, setDressUpMinutes] = useState(90); // default 1.5h
  const [transitMinutes, setTransitMinutes] = useState(60); // default 1.0h

  // Submission state
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  // 1. Initialize LIFF and parse query params
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

    try {
      const dataParam = getFlightDataParam();
      if (dataParam) {
        const decoded = decompressFlights(dataParam);
        if (Array.isArray(decoded) && decoded.length > 0) {
          setFlights(decoded);

          // Default selection: select active flights & standby, leave rest unchecked
          const initialSelected = new Set();
          decoded.forEach((f, idx) => {
            if (f.dutyType === 'flight' || f.dutyType === 'standby' || f.reportTime) {
              initialSelected.add(idx);
            }
          });

          if (initialSelected.size === 0) {
            decoded.forEach((_, idx) => initialSelected.add(idx));
          }

          setSelectedIndices(initialSelected);
        }
      }
    } catch (e) {
      console.warn('Failed to parse flight data from URL:', e);
    }

    const liffId = import.meta.env.VITE_LIFF_ID || window.__LIFF_ID__ || '2011161687-ldzW1DVD';
    if (liffId) {
      liff
        .init({ liffId })
        .then(() => {
          setLiffInitialized(true);
          setIsInLine(liff.isInClient());
        })
        .catch(err => {
          console.warn('LIFF init warning:', err);
          setLiffInitialized(true);
          setLiffError(err.message);
        });
    } else {
      setLiffInitialized(true);
    }
  }, []);

  const adjustDressUp = (delta) => {
    setDressUpMinutes(prev => Math.max(10, Math.min(300, prev + delta)));
  };

  const adjustTransit = (delta) => {
    setTransitMinutes(prev => Math.max(10, Math.min(300, prev + delta)));
  };

  const toggleFlightIndex = (idx) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === flights.length) {
      setSelectedIndices(new Set());
    } else {
      const all = new Set(flights.map((_, i) => i));
      setSelectedIndices(all);
    }
  };

  const totalMinutes = dressUpMinutes + transitMinutes;
  const totalHoursFormatted = (totalMinutes / 60).toFixed(1);

  const handleSendToLine = async () => {
    const selectedFlights = flights.filter((_, idx) => selectedIndices.has(idx));
    if (selectedFlights.length === 0) {
      alert('กรุณาเลือกตารางบินอย่างน้อย 1 วันครับ');
      return;
    }

    setSending(true);

    try {
      const flexMessage = buildRosterFlexCarousel(selectedFlights, dressUpMinutes, transitMinutes);

      if (liff.isInClient()) {
        await liff.sendMessages([flexMessage]);
      }
      
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to send LIFF message:', err);
      alert(`เกิดข้อผิดพลาดในการส่งข้อความ: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-[#1C1C1E] flex flex-col font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Segoe_UI',Roboto,sans-serif] selection:bg-emerald-500/20">
      
      {/* Mobile-first white utility header */}
      <div className="pt-2 pb-2 px-4 sticky top-0 z-30 bg-[#F2F2F7]/95 backdrop-blur-md space-y-2">
        <div className="w-10 h-1.2 rounded-full bg-slate-300 mx-auto" />
        
        <div className="mx-auto flex max-w-md items-center gap-2">
          <div className="grid flex-1 grid-cols-2 gap-1 rounded-xl border border-slate-300/60 bg-slate-200/80 p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`py-1.5 px-1.5 text-center rounded-lg text-xs font-bold transition-all duration-150 ${
                activeTab === 'settings' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >ปรับเวลา</button>
            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`py-1.5 px-1.5 text-center rounded-lg text-xs font-bold transition-all duration-150 ${
                activeTab === 'calendar' ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >ปฏิทิน</button>
          </div>
          <button type="button" onClick={() => setActiveTab('story')} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-xs transition hover:bg-slate-50" title="เส้นทางบินและเรดาร์" aria-label="เส้นทางบินและเรดาร์">
            <Map className="h-4 w-4" />
          </button>
        </div>
      </div>

      <main className="max-w-md mx-auto w-full px-3.5 space-y-2.5 pb-24 flex-1">
        {activeTab === 'story' ? (
          <RouteStoryMap flights={flights} />
        ) : activeTab === 'calendar' ? (
          <div className="space-y-2.5">
            {/* Full Screen Link Button */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold text-slate-500">
                ต้องการดูแบบแนวนอน / ช่องกว้าง?
              </span>
              <a
                href={`/calendar${window.location.search}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 transition active:scale-95 shadow-2xs"
              >
                <span>เปิดเต็มจอ</span>
              </a>
            </div>

            <SmartAviationCalendar 
              flights={flights} 
              dressUpMinutes={dressUpMinutes} 
              transitMinutes={transitMinutes} 
              onSendToLine={handleSendToLine}
            />
          </div>
        ) : (
          <>
            {/* Apple Health-Style Clean White Hero Widget */}
            <div className="rounded-2xl bg-white border border-slate-200/80 p-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                    <Sun className="w-3.5 h-3.5" />
                    <span>เวลารวมตื่นนอนล่วงหน้า</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-3xl font-extrabold tracking-tight text-slate-900">{totalHoursFormatted}</span>
                    <span className="text-xs font-semibold text-slate-500">ชม. ({totalMinutes} นาที)</span>
                  </div>
                </div>

                {/* Twin Breakdown Badges */}
                <div className="flex flex-col gap-1 text-right">
                  <div className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/60 text-[11px]">
                    <span className="text-slate-500">👗 แต่งตัว: </span>
                    <span className="font-bold text-amber-800">{dressUpMinutes}m</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/60 text-[11px]">
                    <span className="text-slate-500">🚗 เดินทาง: </span>
                    <span className="font-bold text-emerald-800">{transitMinutes}m</span>
                  </div>
                </div>
              </div>
            </div>

        {/* Section 1: Dress Up Time */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-3 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center">
                <Coffee className="w-3 h-3" />
              </span>
              เวลาเตรียมตัว / แต่งตัว
            </label>
            <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/70">
              {dressUpMinutes} นาที ({(dressUpMinutes / 60).toFixed(1)}h)
            </span>
          </div>

          {/* Segmented Control */}
          <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200/70 grid grid-cols-3 gap-1">
            {[
              { label: '60 นาที (1h)', val: 60 },
              { label: '90 นาที (1.5h)', val: 90 },
              { label: '120 นาที (2h)', val: 120 },
            ].map(chip => {
              const isActive = dressUpMinutes === chip.val;
              return (
                <button
                  key={chip.val}
                  type="button"
                  onClick={() => setDressUpMinutes(chip.val)}
                  className={`py-1.5 px-1 text-center rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Stepper with +/- 10 min */}
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[11px] text-slate-400">ปรับละเอียด:</span>
            <div className="flex items-center gap-2 bg-slate-50 px-1.5 py-0.5 rounded-xl border border-slate-200/70">
              <button
                type="button"
                onClick={() => adjustDressUp(-10)}
                className="w-6 h-6 rounded-full bg-white hover:bg-slate-100 border border-slate-300/80 active:scale-90 flex items-center justify-center text-slate-700 transition-all shadow-xs"
                title="ลด 10 นาที"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-10 text-center text-xs font-mono font-bold text-slate-800">
                {dressUpMinutes}m
              </span>
              <button
                type="button"
                onClick={() => adjustDressUp(10)}
                className="w-6 h-6 rounded-full bg-white hover:bg-slate-100 border border-slate-300/80 active:scale-90 flex items-center justify-center text-slate-700 transition-all shadow-xs"
                title="เพิ่ม 10 นาที"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Transit Time */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-3 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Car className="w-3 h-3" />
              </span>
              เวลาเดินทางไปสนามบิน
            </label>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
              {transitMinutes} นาที ({(transitMinutes / 60).toFixed(1)}h)
            </span>
          </div>

          {/* Segmented Control */}
          <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200/70 grid grid-cols-4 gap-1">
            {[
              { label: '30m', val: 30 },
              { label: '45m', val: 45 },
              { label: '60m (1h)', val: 60 },
              { label: '90m (1.5h)', val: 90 },
            ].map(chip => {
              const isActive = transitMinutes === chip.val;
              return (
                <button
                  key={chip.val}
                  type="button"
                  onClick={() => setTransitMinutes(chip.val)}
                  className={`py-1.5 px-1 text-center rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Stepper with +/- 10 min */}
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[11px] text-slate-400">ปรับละเอียด:</span>
            <div className="flex items-center gap-2 bg-slate-50 px-1.5 py-0.5 rounded-xl border border-slate-200/70">
              <button
                type="button"
                onClick={() => adjustTransit(-10)}
                className="w-6 h-6 rounded-full bg-white hover:bg-slate-100 border border-slate-300/80 active:scale-90 flex items-center justify-center text-slate-700 transition-all shadow-xs"
                title="ลด 10 นาที"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-10 text-center text-xs font-mono font-bold text-slate-800">
                {transitMinutes}m
              </span>
              <button
                type="button"
                onClick={() => adjustTransit(10)}
                className="w-6 h-6 rounded-full bg-white hover:bg-slate-100 border border-slate-300/80 active:scale-90 flex items-center justify-center text-slate-700 transition-all shadow-xs"
                title="เพิ่ม 10 นาที"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Multi-Day Flight Checklist */}
        {flights.length > 0 && (
          <div className="rounded-2xl bg-white border border-slate-200/80 p-3 space-y-2 shadow-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Calendar className="w-3 h-3" />
                </span>
                <span className="text-xs font-bold text-slate-800">
                  เลือกวันส่งเข้าแชท ({selectedIndices.size}/{flights.length})
                </span>
              </div>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 active:scale-95 transition-all"
              >
                {selectedIndices.size === flights.length ? 'ล้างทั้งหมด' : 'เลือกทั้งหมด'}
              </button>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
              {flights.map((flight, idx) => {
                const isSelected = selectedIndices.has(idx);
                const isFlight = flight.dutyType === 'flight';
                const isStandby = flight.dutyType === 'standby';
                const isLeave = flight.dutyType === 'leave' || flight.dutyType === 'rest';

                let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                let badgeText = '✈️ บิน';
                if (isStandby) {
                  badgeColor = 'bg-orange-50 text-orange-700 border-orange-200';
                  badgeText = '⏳ Standby';
                } else if (isLeave) {
                  badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  badgeText = '🎉 Day Off';
                }

                return (
                  <div
                    key={idx}
                    onClick={() => toggleFlightIndex(idx)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50/40 border-emerald-500/50 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200/60 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Apple-style circular checkbox */}
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-[#06C755] border-[#06C755] text-white shadow-xs'
                          : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900">{flight.date}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md border ${badgeColor}`}>
                            {badgeText}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {flight.pairing}
                        </p>
                      </div>
                    </div>

                    <div className="text-right pl-2">
                      {flight.reportTime ? (
                        <div className="text-xs font-mono font-bold text-blue-700">
                          {flight.reportTime} L
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400">
                          ทั้งวัน
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
          </>
        )}

      </main>

      {/* Floating Bottom Action Button (Apple Green / LINE Emerald) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 p-3 pb-safe max-w-md mx-auto shadow-lg space-y-1.5">
        <button
          type="button"
          disabled={sending || selectedIndices.size === 0}
          onClick={handleSendToLine}
          className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all duration-150 active:scale-[0.98] ${
            selectedIndices.size === 0
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-[#06C755] hover:bg-[#05b34c] text-white shadow-emerald-500/25 border border-emerald-400/30'
          }`}
        >
          {sending ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              กำลังส่งเข้า LINE...
            </span>
          ) : sentSuccess ? (
            <span className="flex items-center gap-2 text-white font-bold">
              <CheckCircle2 className="w-4 h-4" />
              ส่งเข้าแชท LINE แล้ว! (แตะเพื่อส่งอีกครั้งได้)
            </span>
          ) : (
            <>
              <Send className="w-4 h-4 fill-current" />
              <span>คำนวณ & ส่งเข้า LINE ({selectedIndices.size} รายการ)</span>
            </>
          )}
        </button>

        {isInLine && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => liff.closeWindow()}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 active:scale-95 py-0.5"
            >
              ✕ ปิดหน้าต่างนี้
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
