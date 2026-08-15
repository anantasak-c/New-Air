import React, { useState, useEffect } from 'react';
import { Clock, Sparkles, AlertCircle, ArrowRight, RotateCcw, Plus, Minus, Calendar } from 'lucide-react';

export default function FlightForm({ onCalculate, onReset }) {
  // Helper to get formatted tomorrow date at given hour
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

  // Persist values to localStorage
  useEffect(() => {
    localStorage.setItem('uber_planner_reportTime', reportTime);
    localStorage.setItem('uber_planner_prepTime', prepTime);
    localStorage.setItem('uber_planner_travelTime', travelTime);
  }, [reportTime, prepTime, travelTime]);

  // Stepper logic (add/subtract 15 minutes = 0.15 in decimal representation or real minutes)
  const adjustTimeByMinutes = (currentVal, deltaMinutes) => {
    const val = parseFloat(currentVal) || 0;
    const hours = Math.floor(val);
    const decimalMins = Math.round((val - hours) * 100);
    let totalMinutes = hours * 60 + decimalMins + deltaMinutes;

    if (totalMinutes < 0) totalMinutes = 0;
    if (totalMinutes > 600) totalMinutes = 600; // max 10 hours

    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    const result = (newHours + newMins / 100).toFixed(2);
    return result;
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
      setError('กรุณาระบุเวลาเริ่มปฏิบัติหน้าที่ (Report Duty Time)');
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

  // Helper preview text
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
    <div className="w-full rounded-2xl bg-[#141414] dark:bg-[#141414] border border-[#292929] p-4 sm:p-6 shadow-uber-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#222222] pb-3 mb-5">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <span>⏱️ กำหนดเวลาปฏิบัติหน้าที่</span>
          </h2>
          <p className="text-xs text-[#a6a6a6]">
            ระบุเวลาเริ่มงานและระยะเวลาที่ต้องใช้
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-[#a6a6a6] hover:text-white px-2.5 py-1.5 rounded-lg bg-[#1f1f1f] hover:bg-[#262626] border border-[#333333] transition flex items-center gap-1.5 active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>รีเซ็ต</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleCalculate} className="space-y-5">
        {/* 1. Report Time & Quick Presets */}
        <div className="space-y-2.5 bg-[#1a1a1a] p-4 rounded-xl border border-[#292929]">
          <div className="flex items-center justify-between">
            <label 
              htmlFor="reportTime" 
              className="text-xs font-bold uppercase tracking-wider text-[#a6a6a6] flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-uber-blue" />
              เวลาเริ่มปฏิบัติหน้าที่ (Report Duty Time)
            </label>
          </div>

          <input
            id="reportTime"
            type="datetime-local"
            value={reportTime}
            onChange={(e) => setReportTime(e.target.value)}
            className="w-full bg-[#141414] px-4 py-3 rounded-xl border border-[#333333] text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-uber-blue transition"
            required
          />

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 pt-1 flex-wrap">
            <span className="text-[11px] text-[#6b6b6b] mr-1">ปุ่มลัด:</span>
            {[
              { label: '🌅 พรุ่งนี้เช้า 06:00', getter: () => getPresetDateTime(6, false) },
              { label: '☀️ พรุ่งนี้บ่าย 13:00', getter: () => getPresetDateTime(13, false) },
              { label: '🌙 คืนนี้ 22:00', getter: () => getPresetDateTime(22, true) },
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setReportTime(preset.getter())}
                className="text-[11px] px-2.5 py-1 rounded-full bg-[#262626] hover:bg-[#333333] text-[#a6a6a6] hover:text-white border border-[#383838] transition active:scale-95"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Prep & Travel Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Prep Time Card */}
          <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#292929] space-y-3">
            <div className="flex items-center justify-between">
              <label 
                htmlFor="prepTime" 
                className="text-xs font-bold uppercase tracking-wider text-[#a6a6a6]"
              >
                💄 เวลาแต่งตัว / เตรียมตัว
              </label>
              <span className="text-xs font-bold text-uber-blue bg-uber-blue/10 px-2 py-0.5 rounded-full border border-uber-blue/20">
                {formatDecimalPreview(prepTime)}
              </span>
            </div>

            {/* Stepper + Input */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStepPrep(-15)}
                className="w-11 h-11 rounded-xl bg-[#262626] hover:bg-[#333333] border border-[#383838] flex items-center justify-center text-white active:scale-90 transition font-bold"
                title="ลด 15 นาที"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="relative flex-1">
                <input
                  id="prepTime"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  className="w-full bg-[#141414] px-3.5 py-2.5 rounded-xl border border-[#333333] text-center text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-uber-blue"
                  required
                />
              </div>

              <button
                type="button"
                onClick={() => handleStepPrep(15)}
                className="w-11 h-11 rounded-xl bg-[#262626] hover:bg-[#333333] border border-[#383838] flex items-center justify-center text-white active:scale-90 transition font-bold"
                title="เพิ่ม 15 นาที"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Chips */}
            <div className="flex gap-1.5 flex-wrap">
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
                  className={`text-xs px-2.5 py-1 rounded-lg transition font-medium ${
                    prepTime === chip.val
                      ? 'bg-white text-black font-bold'
                      : 'bg-[#262626] hover:bg-[#333333] text-[#a6a6a6] border border-[#383838]'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Travel Time Card */}
          <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#292929] space-y-3">
            <div className="flex items-center justify-between">
              <label 
                htmlFor="travelTime" 
                className="text-xs font-bold uppercase tracking-wider text-[#a6a6a6]"
              >
                🚗 เวลาเดินทางไปสถานที่นัดหมาย
              </label>
              <span className="text-xs font-bold text-uber-blue bg-uber-blue/10 px-2 py-0.5 rounded-full border border-uber-blue/20">
                {formatDecimalPreview(travelTime)}
              </span>
            </div>

            {/* Stepper + Input */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStepTravel(-15)}
                className="w-11 h-11 rounded-xl bg-[#262626] hover:bg-[#333333] border border-[#383838] flex items-center justify-center text-white active:scale-90 transition font-bold"
                title="ลด 15 นาที"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="relative flex-1">
                <input
                  id="travelTime"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={travelTime}
                  onChange={(e) => setTravelTime(e.target.value)}
                  className="w-full bg-[#141414] px-3.5 py-2.5 rounded-xl border border-[#333333] text-center text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-uber-blue"
                  required
                />
              </div>

              <button
                type="button"
                onClick={() => handleStepTravel(15)}
                className="w-11 h-11 rounded-xl bg-[#262626] hover:bg-[#333333] border border-[#383838] flex items-center justify-center text-white active:scale-90 transition font-bold"
                title="เพิ่ม 15 นาที"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Chips */}
            <div className="flex gap-1.5 flex-wrap">
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
                  className={`text-xs px-2.5 py-1 rounded-lg transition font-medium ${
                    travelTime === chip.val
                      ? 'bg-white text-black font-bold'
                      : 'bg-[#262626] hover:bg-[#333333] text-[#a6a6a6] border border-[#383838]'
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
          className="w-full py-4 px-6 bg-white text-black font-black text-base rounded-xl hover:bg-slate-200 transition active:scale-[0.98] shadow-uber-sm flex items-center justify-center gap-2 group cursor-pointer"
        >
          <Sparkles className="w-5 h-5 text-uber-blue group-hover:rotate-12 transition-transform" />
          <span>คำนวณตารางเวลาและแผนพักผ่อน</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </form>
    </div>
  );
}
