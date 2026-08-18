import React, { useState, useEffect } from 'react';
import liff from '@line/liff';
import { 
  Clock, 
  Plane, 
  Car, 
  Sparkles, 
  CheckCircle2, 
  Plus, 
  Minus, 
  Send, 
  Calendar, 
  Coffee, 
  Sun,
  AlertCircle,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { buildRosterFlexCarousel } from '../utils/flexBuilder';
import { decompressFlights } from '../utils/flightCodec';

export default function LiffSchedulePicker() {
  const [liffInitialized, setLiffInitialized] = useState(false);
  const [liffError, setLiffError] = useState(null);
  const [isInLine, setIsInLine] = useState(false);

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
    // Parse flights data from URL param 'd'
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const dataParam = searchParams.get('d');
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

          // If no active flights found, select all
          if (initialSelected.size === 0) {
            decoded.forEach((_, idx) => initialSelected.add(idx));
          }

          setSelectedIndices(initialSelected);
        }
      }
    } catch (e) {
      console.warn('Failed to parse flight data from URL:', e);
    }

    // Initialize LINE LIFF
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

  // Helpers for Stepper & Quick chips
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

  // Send to LINE Chat via LIFF
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
        setSentSuccess(true);
        setTimeout(() => {
          liff.closeWindow();
        }, 800);
      } else {
        // Opened in external browser
        setSentSuccess(true);
      }
    } catch (err) {
      console.error('Failed to send LIFF message:', err);
      alert(`เกิดข้อผิดพลาดในการส่งข้อความ: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans pb-10">
      {/* Top App Bar */}
      <div className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Plane className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Flight Rest Planner</h1>
            <p className="text-[11px] text-slate-400">ปรับแต่งเวลาพักผ่อนก่อนส่งเข้าแชท</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
          <Sparkles className="w-3 h-3" />
          <span>AI Roster</span>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 pt-4 space-y-4 flex-1">
        {/* Total Time Summary Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/20 via-slate-800/60 to-indigo-900/30 border border-blue-500/30 p-4 shadow-lg shadow-blue-950/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider font-bold text-blue-400 flex items-center gap-1">
                <Sun className="w-3.5 h-3.5" /> รวมเวลาตื่นนอนล่วงหน้า
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-white">{totalHoursFormatted}</span>
                <span className="text-sm font-medium text-slate-300">ชั่วโมง ({totalMinutes} นาที)</span>
              </div>
            </div>
            <div className="text-right text-xs text-slate-400 space-y-0.5">
              <p>👗 แต่งตัว: <span className="font-semibold text-slate-200">{dressUpMinutes} นาที</span></p>
              <p>🚗 เดินทาง: <span className="font-semibold text-slate-200">{transitMinutes} นาที</span></p>
            </div>
          </div>
        </div>

        {/* Section 1: Dress Up Time */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/60 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Coffee className="w-4 h-4 text-amber-400" />
              เวลาเตรียมตัว / แต่งตัว
            </label>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {dressUpMinutes} นาที ({(dressUpMinutes / 60).toFixed(1)} ชม.)
            </span>
          </div>

          {/* Quick Chips */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '60 นาที (1h)', val: 60 },
              { label: '90 นาที (1.5h)', val: 90, rec: true },
              { label: '120 นาที (2h)', val: 120 },
            ].map(chip => (
              <button
                key={chip.val}
                type="button"
                onClick={() => setDressUpMinutes(chip.val)}
                className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all border ${
                  dressUpMinutes === chip.val
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30 ring-2 ring-blue-400/30'
                    : 'bg-slate-700/50 text-slate-300 border-slate-600/50 hover:bg-slate-700'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Stepper with +/- 10 min */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">ปรับละเอียดทีละ 10 นาที:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustDressUp(-10)}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 flex items-center justify-center text-slate-200 active:scale-95 transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center text-xs font-mono font-bold text-white">
                {dressUpMinutes}m
              </span>
              <button
                type="button"
                onClick={() => adjustDressUp(10)}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 flex items-center justify-center text-slate-200 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Transit Time */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/60 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-emerald-400" />
              เวลาเดินทางไปสนามบิน
            </label>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              {transitMinutes} นาที ({(transitMinutes / 60).toFixed(1)} ชม.)
            </span>
          </div>

          {/* Quick Chips */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: '30m', val: 30 },
              { label: '45m', val: 45 },
              { label: '60m (1h)', val: 60, rec: true },
              { label: '90m (1.5h)', val: 90 },
            ].map(chip => (
              <button
                key={chip.val}
                type="button"
                onClick={() => setTransitMinutes(chip.val)}
                className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all border ${
                  transitMinutes === chip.val
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30 ring-2 ring-blue-400/30'
                    : 'bg-slate-700/50 text-slate-300 border-slate-600/50 hover:bg-slate-700'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Stepper with +/- 10 min */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">ปรับละเอียดทีละ 10 นาที:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustTransit(-10)}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 flex items-center justify-center text-slate-200 active:scale-95 transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center text-xs font-mono font-bold text-white">
                {transitMinutes}m
              </span>
              <button
                type="button"
                onClick={() => adjustTransit(10)}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 flex items-center justify-center text-slate-200 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Select Flights to Dispatch */}
        {flights.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/60 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-slate-200">
                  เลือกวันที่จะส่งเข้าแชท ({selectedIndices.size}/{flights.length})
                </span>
              </div>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 active:scale-95 transition-all"
              >
                {selectedIndices.size === flights.length ? 'ล้างทั้งหมด' : 'เลือกทั้งหมด'}
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {flights.map((flight, idx) => {
                const isSelected = selectedIndices.has(idx);
                const isFlight = flight.dutyType === 'flight';
                const isStandby = flight.dutyType === 'standby';
                const isLeave = flight.dutyType === 'leave' || flight.dutyType === 'rest';

                let badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                let badgeText = '✈️ บิน';
                if (isStandby) {
                  badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                  badgeText = '⏳ Standby';
                } else if (isLeave) {
                  badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                  badgeText = '🎉 Day Off';
                }

                return (
                  <div
                    key={idx}
                    onClick={() => toggleFlightIndex(idx)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500/50 shadow-sm'
                        : 'bg-slate-800/30 border-slate-700/40 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-blue-600 border-blue-400 text-white'
                          : 'border-slate-600 bg-slate-800'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{flight.date}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${badgeColor}`}>
                            {badgeText}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
                          {flight.pairing}
                        </p>
                      </div>
                    </div>

                    <div className="text-right pl-2">
                      {flight.reportTime ? (
                        <div className="text-xs font-mono font-bold text-blue-300">
                          {flight.reportTime} L
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 font-sans">
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

        {/* Submit Action Button */}
        <div className="pt-2 sticky bottom-4 z-20">
          <button
            type="button"
            disabled={sending || selectedIndices.size === 0}
            onClick={handleSendToLine}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.98] ${
              selectedIndices.size === 0
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30'
            }`}
          >
            {sending ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                กำลังส่งเข้าแชท LINE...
              </span>
            ) : sentSuccess ? (
              <span className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="w-5 h-5" />
                ส่งเรียบร้อยแล้ว! กำลังปิดหน้าต่าง...
              </span>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>คำนวณ & ส่งเข้า LINE ({selectedIndices.size} รายการ)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
