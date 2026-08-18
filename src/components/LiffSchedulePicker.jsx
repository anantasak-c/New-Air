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
  ChevronRight
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
    // Helper to get 'd' param from standard query or liff.state
    const getFlightDataParam = () => {
      const searchParams = new URLSearchParams(window.location.search);
      let d = searchParams.get('d');
      if (d) return d;

      // Check inside liff.state if present
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
    <div className="min-h-screen bg-[#000000] text-[#f5f5f7] flex flex-col font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Segoe_UI',Roboto,sans-serif] selection:bg-emerald-500/30 selection:text-white pb-12">
      
      {/* iOS Sheet Top Grabber Handle */}
      <div className="pt-2.5 pb-1 flex justify-center sticky top-0 z-40 bg-[#000000]/80 backdrop-blur-xl">
        <div className="w-9 h-1 rounded-full bg-white/20" />
      </div>

      {/* Apple Header */}
      <header className="px-5 pt-1 pb-3 flex items-center justify-between sticky top-6 z-30 bg-[#000000]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
            <Plane className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white">Flight Rest Planner</h1>
            <p className="text-[11px] text-neutral-400 font-normal">กำหนดเวลาพักผ่อนก่อนส่งเข้า LINE</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/[0.08] text-neutral-300 text-xs font-medium backdrop-blur-md">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>AI Scan</span>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="max-w-md mx-auto w-full px-4 pt-4 space-y-3.5 flex-1">
        
        {/* Apple Health-Style Hero Summary Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#1c1c1e] to-[#121214] border border-white/[0.08] p-4.5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-blue-400">
                <Sun className="w-3.5 h-3.5" />
                <span>เวลารวมตื่นนอนล่วงหน้า</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold tracking-tight text-white">{totalHoursFormatted}</span>
                <span className="text-sm font-medium text-neutral-400">ชั่วโมง ({totalMinutes} นาที)</span>
              </div>
            </div>

            {/* Split Breakdown Badges */}
            <div className="flex flex-col gap-1.5 text-right">
              <div className="px-2.5 py-1 rounded-xl bg-white/[0.05] border border-white/[0.06] text-xs">
                <span className="text-neutral-400 text-[11px]">👗 แต่งตัว: </span>
                <span className="font-semibold text-white">{dressUpMinutes}m</span>
              </div>
              <div className="px-2.5 py-1 rounded-xl bg-white/[0.05] border border-white/[0.06] text-xs">
                <span className="text-neutral-400 text-[11px]">🚗 เดินทาง: </span>
                <span className="font-semibold text-white">{transitMinutes}m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Dress Up Time (Apple Segmented Picker) */}
        <div className="rounded-3xl bg-[#1c1c1e] border border-white/[0.08] p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-neutral-200 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <Coffee className="w-3.5 h-3.5" />
              </span>
              เวลาเตรียมตัว / แต่งตัว
            </label>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
              {dressUpMinutes} นาที
            </span>
          </div>

          {/* iOS Segmented Control */}
          <div className="bg-[#000000]/60 p-1 rounded-2xl border border-white/[0.06] grid grid-cols-3 gap-1">
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
                  className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#2c2c2e] text-white shadow-sm border border-white/10 scale-[1.02]'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Apple Stepper (- / + 10 min) */}
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[11px] text-neutral-400 font-normal">ปรับละเอียด:</span>
            <div className="flex items-center gap-2 bg-[#000000]/40 px-2 py-1 rounded-2xl border border-white/[0.06]">
              <button
                type="button"
                onClick={() => adjustDressUp(-10)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white transition-all"
                title="ลด 10 นาที"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-12 text-center text-xs font-mono font-bold text-white">
                {dressUpMinutes}m
              </span>
              <button
                type="button"
                onClick={() => adjustDressUp(10)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white transition-all"
                title="เพิ่ม 10 นาที"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Transit Time (Apple Segmented Picker) */}
        <div className="rounded-3xl bg-[#1c1c1e] border border-white/[0.08] p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-neutral-200 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Car className="w-3.5 h-3.5" />
              </span>
              เวลาเดินทางไปสนามบิน
            </label>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-lg border border-emerald-400/20">
              {transitMinutes} นาที
            </span>
          </div>

          {/* iOS Segmented Control */}
          <div className="bg-[#000000]/60 p-1 rounded-2xl border border-white/[0.06] grid grid-cols-4 gap-1">
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
                  className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#2c2c2e] text-white shadow-sm border border-white/10 scale-[1.02]'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Apple Stepper (- / + 10 min) */}
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[11px] text-neutral-400 font-normal">ปรับละเอียด:</span>
            <div className="flex items-center gap-2 bg-[#000000]/40 px-2 py-1 rounded-2xl border border-white/[0.06]">
              <button
                type="button"
                onClick={() => adjustTransit(-10)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white transition-all"
                title="ลด 10 นาที"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-12 text-center text-xs font-mono font-bold text-white">
                {transitMinutes}m
              </span>
              <button
                type="button"
                onClick={() => adjustTransit(10)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white transition-all"
                title="เพิ่ม 10 นาที"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Multi-Day Flight Checklist (iOS Calendar/Reminders Style) */}
        {flights.length > 0 && (
          <div className="rounded-3xl bg-[#1c1c1e] border border-white/[0.08] p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-semibold text-neutral-200">
                  เลือกวันที่จะส่งเข้าแชท ({selectedIndices.size}/{flights.length})
                </span>
              </div>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs font-medium text-blue-400 hover:text-blue-300 active:scale-95 transition-all"
              >
                {selectedIndices.size === flights.length ? 'ล้างทั้งหมด' : 'เลือกทั้งหมด'}
              </button>
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {flights.map((flight, idx) => {
                const isSelected = selectedIndices.has(idx);
                const isFlight = flight.dutyType === 'flight';
                const isStandby = flight.dutyType === 'standby';
                const isLeave = flight.dutyType === 'leave' || flight.dutyType === 'rest';

                let badgeColor = 'bg-blue-500/15 text-blue-400 border-blue-500/25';
                let badgeText = '✈️ บิน';
                if (isStandby) {
                  badgeColor = 'bg-orange-500/15 text-orange-400 border-orange-500/25';
                  badgeText = '⏳ Standby';
                } else if (isLeave) {
                  badgeColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
                  badgeText = '🎉 Day Off';
                }

                return (
                  <div
                    key={idx}
                    onClick={() => toggleFlightIndex(idx)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#2c2c2e]/90 border-blue-500/50 shadow-sm'
                        : 'bg-[#141416] border-white/[0.04] opacity-50 hover:opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Apple-style circular checkbox */}
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-[#06C755] border-[#06C755] text-white shadow-sm'
                          : 'border-neutral-500 bg-transparent'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{flight.date}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                            {badgeText}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5 font-normal">
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
                        <div className="text-[11px] text-neutral-500">
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

        {/* Action Button (Vibrant Apple Green / LINE Emerald) */}
        <div className="pt-2 sticky bottom-4 z-20">
          <button
            type="button"
            disabled={sending || selectedIndices.size === 0}
            onClick={handleSendToLine}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-2xl transition-all duration-200 active:scale-[0.98] ${
              selectedIndices.size === 0
                ? 'bg-neutral-800 text-neutral-500 border border-neutral-700/50 cursor-not-allowed'
                : 'bg-[#06C755] hover:bg-[#05b34c] text-white shadow-emerald-500/25 border border-emerald-400/30 ring-4 ring-emerald-500/10'
            }`}
          >
            {sending ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                กำลังส่งเข้า LINE...
              </span>
            ) : sentSuccess ? (
              <span className="flex items-center gap-2 text-white font-bold">
                <CheckCircle2 className="w-5 h-5" />
                ส่งเรียบร้อยแล้ว! กำลังปิดหน้าต่าง...
              </span>
            ) : (
              <>
                <Send className="w-4 h-4 fill-current" />
                <span>คำนวณ & ส่งเข้า LINE ({selectedIndices.size} รายการ)</span>
              </>
            )}
          </button>
        </div>

      </main>
    </div>
  );
}
