import React, { useState, useEffect } from 'react';
import { Clock, Sparkles, AlertCircle, ArrowRight, RotateCcw, Plus, Minus, Calendar } from 'lucide-react';

export default function FlightForm({ onCalculate, onReset }) {
  const getPresetDateTime = (targetHour = 6, isToday = false) => {
    const d = new Date();
    if (!isToday) {
      d.setDate(d.getDate() + 1);
    }
    d.setHours(targetHour, 0, 0, 0);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [reportTime, setReportTime] = useState(() => {
    return localStorage.getItem('uber_planner_reportTime') || getPresetDateTime(6, false);
  });
  const [prepTime, setPrepTime] = useState(() => {
    return localStorage.getItem('uber_planner_prepTime') || '1.30';
  });
  const [travelTime, setTravelTime] = useState(() => {
    return localStorage.getItem('uber_planner_travelTime') || '1.00';
  });
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem('uber_planner_reportTime', reportTime);
    localStorage.setItem('uber_planner_prepTime', prepTime);
    localStorage.setItem('uber_planner_travelTime', travelTime);
  }, [reportTime, prepTime, travelTime]);

  const adjustTimeByMinutes = (currentVal, deltaMinutes) => {
    const val = parseFloat(currentVal) || 0;
    const hours = Math.floor(val);
    const decimalMins = Math.round((val - hours) * 100);
    let totalMinutes = hours * 60 + decimalMins + deltaMinutes;

    if (totalMinutes < 0) totalMinutes = 0;
    if (totalMinutes > 600) totalMinutes = 600;

    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return (newHours + newMins / 100).toFixed(2);
  };

  const handleStepPrep = (delta) => {
    setPrepTime(adjustTimeByMinutes(prepTime, delta));
  };

  const handleStepTravel = (delta) => {
    setTravelTime(adjustTimeByMinutes(travelTime, delta));
  };

  const handleCalculate = (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!reportTime) {
      setError('กรุณาระบุเวลาเริ่มปฏิบัติหน้าที่');
      return;
    }

    const prep = parseFloat(prepTime);
    const travel = parseFloat(travelTime);

    if (isNaN(prep) || prep < 0 || prep > 10) {
      setError('เวลาแต่งตัวต้องอยู่ระหว่าง 0 - 10 ชั่วโมง');
      return;
    }

    if (isNaN(travel) || travel < 0 || travel > 10) {
      setError('เวลาเดินทางต้องอยู่ระหว่าง 0 - 10 ชั่วโมง');
      return;
    }

    onCalculate({
      reportTime,
      prepTime: prep,
      travelTime: travel,
    });
  };

  const handleReset = () => {
    const defaultTime = getPresetDateTime(6, false);
    setReportTime(defaultTime);
    setPrepTime('1.30');
    setTravelTime('1.00');
    setError('');
    onReset();
  };

  const formatDecimalPreview = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '';
    const hours = Math.floor(num);
    const minutes = Math.round((num - hours) * 100);
    if (hours === 0) return `${minutes} นาที`;
    if (minutes === 0) return `${hours} ชม.`;
    return `${hours} ชม. ${minutes} นาที`;
  };

  return (
    <div className="w-full rounded-2xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#222222] p-4 sm:p-5 shadow-sm transition-colors">
      
      {/* Compact Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1f1f1f] pb-2.5 mb-3.5">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            กำหนดเวลาปฏิบัติหน้าที่
          </h2>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#1c1c1c] transition flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>รีเซ็ต</span>
        </button>
      </div>

      {error && (
        <div className="mb-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleCalculate} className="space-y-3.5">
        
        {/* 1. Report Duty Time */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label 
              htmlFor="reportTime" 
              className="text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              เวลาเริ่มปฏิบัติหน้าที่ (Report Duty Time)
            </label>
          </div>

          <input
            id="reportTime"
            type="datetime-local"
            value={reportTime}
            onChange={(e) => setReportTime(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#181818] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#2a2a2a] text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 transition tabular-nums"
            required
          />

          {/* Quick Date Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            {[
              { label: 'พรุ่งนี้ 06:00', getter: () => getPresetDateTime(6, false) },
              { label: 'พรุ่งนี้ 13:00', getter: () => getPresetDateTime(13, false) },
              { label: 'คืนนี้ 22:00', getter: () => getPresetDateTime(22, true) },
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setReportTime(preset.getter())}
                className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#1c1c1c] hover:bg-slate-200 dark:hover:bg-[#262626] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#2a2a2a] transition active:scale-95"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Prep and Travel Row (Side-by-side or stacked cleanly) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Prep Time */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                เวลาแต่งตัว / เตรียมตัว
              </span>
              <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                {formatDecimalPreview(prepTime)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleStepPrep(-15)}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#1c1c1c] hover:bg-slate-200 dark:hover:bg-[#262626] border border-slate-200 dark:border-[#2a2a2a] flex items-center justify-center text-slate-700 dark:text-slate-300 active:scale-90 transition font-bold"
                title="ลด 15 นาที"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <input
                id="prepTime"
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#181818] px-2 py-1.5 rounded-xl border border-slate-200 dark:border-[#2a2a2a] text-center text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 tabular-nums"
                required
              />

              <button
                type="button"
                onClick={() => handleStepPrep(15)}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#1c1c1c] hover:bg-slate-200 dark:hover:bg-[#262626] border border-slate-200 dark:border-[#2a2a2a] flex items-center justify-center text-slate-700 dark:text-slate-300 active:scale-90 transition font-bold"
                title="เพิ่ม 15 นาที"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Chips */}
            <div className="flex gap-1 flex-wrap">
              {[
                { label: '45m', val: '0.45' },
                { label: '1 ชม.', val: '1.00' },
                { label: '1.5 ชม.', val: '1.30' },
                { label: '2 ชม.', val: '2.00' },
              ].map((chip) => (
                <button
                  key={chip.val}
                  type="button"
                  onClick={() => setPrepTime(chip.val)}
                  className={`text-[10px] px-2 py-0.5 rounded-md transition font-medium ${
                    prepTime === chip.val
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-black font-bold'
                      : 'bg-slate-100 dark:bg-[#1c1c1c] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#2a2a2a]'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Travel Time */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                เวลาเดินทาง
              </span>
              <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                {formatDecimalPreview(travelTime)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleStepTravel(-15)}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#1c1c1c] hover:bg-slate-200 dark:hover:bg-[#262626] border border-slate-200 dark:border-[#2a2a2a] flex items-center justify-center text-slate-700 dark:text-slate-300 active:scale-90 transition font-bold"
                title="ลด 15 นาที"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <input
                id="travelTime"
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={travelTime}
                onChange={(e) => setTravelTime(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#181818] px-2 py-1.5 rounded-xl border border-slate-200 dark:border-[#2a2a2a] text-center text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 tabular-nums"
                required
              />

              <button
                type="button"
                onClick={() => handleStepTravel(15)}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#1c1c1c] hover:bg-slate-200 dark:hover:bg-[#262626] border border-slate-200 dark:border-[#2a2a2a] flex items-center justify-center text-slate-700 dark:text-slate-300 active:scale-90 transition font-bold"
                title="เพิ่ม 15 นาที"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Chips */}
            <div className="flex gap-1 flex-wrap">
              {[
                { label: '30m', val: '0.30' },
                { label: '45m', val: '0.45' },
                { label: '1 ชม.', val: '1.00' },
                { label: '1.25 ชม.', val: '1.15' },
                { label: '1.5 ชม.', val: '1.30' },
              ].map((chip) => (
                <button
                  key={chip.val}
                  type="button"
                  onClick={() => setTravelTime(chip.val)}
                  className={`text-[10px] px-2 py-0.5 rounded-md transition font-medium ${
                    travelTime === chip.val
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-black font-bold'
                      : 'bg-slate-100 dark:bg-[#1c1c1c] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#2a2a2a]'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Calculate Action Button */}
        <button
          type="submit"
          className="w-full py-3 px-4 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-sm rounded-xl transition active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-1"
        >
          <Sparkles className="w-4 h-4 text-amber-400 dark:text-amber-500" />
          <span>คำนวณตารางเวลาพักผ่อน</span>
          <ArrowRight className="w-4 h-4 opacity-70" />
        </button>
      </form>
    </div>
  );
}
