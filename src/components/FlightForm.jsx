import React, { useState, useEffect } from 'react';
import { Clock, Sparkles, AlertCircle, ArrowRight, RotateCcw, ChevronRight, X, Plus, Minus, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function FlightForm({ onCalculate, onReset }) {
  const { labels, activeTheme } = useTheme();

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

  // Modal Sheet State for Time Picker
  const [activePickerModal, setActivePickerModal] = useState(null); // 'prep' | 'travel' | null
  const [tempHours, setTempHours] = useState(1);
  const [tempMinutes, setTempMinutes] = useState(30);

  useEffect(() => {
    localStorage.setItem('uber_planner_reportTime', reportTime);
    localStorage.setItem('uber_planner_prepTime', prepTime);
    localStorage.setItem('uber_planner_travelTime', travelTime);
  }, [reportTime, prepTime, travelTime]);

  const decimalToHoursMins = (valStr) => {
    const num = parseFloat(valStr) || 0;
    const hours = Math.floor(num);
    const mins = Math.round((num - hours) * 100);
    return { hours, mins };
  };

  const hoursMinsToDecimal = (hours, mins) => {
    const safeH = Math.max(0, parseInt(hours) || 0);
    const safeM = Math.max(0, Math.min(59, parseInt(mins) || 0));
    return (safeH + safeM / 100).toFixed(2);
  };

  const formatDisplayTime = (valStr) => {
    const { hours, mins } = decimalToHoursMins(valStr);
    if (hours === 0) return `${mins} นาที`;
    if (mins === 0) return `${hours} ชม.`;
    return `${hours} ชม. ${mins} นาที`;
  };

  const openPicker = (type) => {
    const currentVal = type === 'prep' ? prepTime : travelTime;
    const { hours, mins } = decimalToHoursMins(currentVal);
    setTempHours(hours);
    setTempMinutes(mins);
    setActivePickerModal(type);
  };

  const savePicker = () => {
    const decimalVal = hoursMinsToDecimal(tempHours, tempMinutes);
    if (activePickerModal === 'prep') {
      setPrepTime(decimalVal);
    } else if (activePickerModal === 'travel') {
      setTravelTime(decimalVal);
    }
    setActivePickerModal(null);
  };

  const setPresetInModal = (hours, mins) => {
    setTempHours(hours);
    setTempMinutes(mins);
  };

  const adjustTempMinutes = (delta) => {
    let totalMins = tempHours * 60 + tempMinutes + delta;
    if (totalMins < 0) totalMins = 0;
    if (totalMins > 600) totalMins = 600; // max 10h

    setTempHours(Math.floor(totalMins / 60));
    setTempMinutes(totalMins % 60);
  };

  const handleCalculate = (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!reportTime) {
      setError('กรุณาระบุเวลาเริ่มงาน');
      return;
    }

    const prep = parseFloat(prepTime);
    const travel = parseFloat(travelTime);

    if (isNaN(prep) || prep < 0) {
      setError('เวลาแต่งตัวไม่ถูกต้อง');
      return;
    }

    if (isNaN(travel) || travel < 0) {
      setError('เวลาเดินทางไม่ถูกต้อง');
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

  return (
    <>
      <div className={`w-full rounded-2xl ${activeTheme.cardClass} p-4 sm:p-5 transition-colors shadow-sm`}>
        
        {/* Minimal Header */}
        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-[#222222] pb-2.5 mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
            <Clock className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <span>{labels?.dutyHeader || 'กำหนดเวลาปฏิบัติหน้าที่'}</span>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white px-2 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-[#1c1c1c] transition flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{labels?.resetBtn || 'รีเซ็ต'}</span>
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCalculate} className="space-y-3">
          
          {/* 1. Report Duty Time - Clean Flight Boarding Input */}
          <div className="space-y-1.5">
            <label 
              htmlFor="reportTime" 
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between"
            >
              <span>{labels?.reportDutyLabel || 'เวลาเริ่มงาน (Report Duty Time)'}</span>
            </label>

            <input
              id="reportTime"
              type="datetime-local"
              value={reportTime}
              onChange={(e) => setReportTime(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#181818] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#2a2a2a] text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 transition tabular-nums cursor-pointer"
              required
            />

            {/* Clean Quick Chips */}
            <div className="flex items-center gap-1.5 pt-0.5">
              {[
                { label: 'พรุ่งนี้ 06:00', getter: () => getPresetDateTime(6, false) },
                { label: '13:00', getter: () => getPresetDateTime(13, false) },
                { label: 'คืนนี้ 22:00', getter: () => getPresetDateTime(22, true) },
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReportTime(preset.getter())}
                  className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#1c1c1c] hover:bg-slate-200 dark:hover:bg-[#262626] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#2a2a2a] transition active:scale-95 cursor-pointer font-medium"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Twin iOS-Style Time Sheets (Side-by-Side in 1 Row) */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            
            {/* Prep Time Tap Button */}
            <button
              type="button"
              onClick={() => openPicker('prep')}
              className="p-3 rounded-xl bg-slate-50 dark:bg-[#181818] hover:bg-slate-100 dark:hover:bg-[#202020] border border-slate-200 dark:border-[#2a2a2a] text-left transition active:scale-98 cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full text-slate-500 dark:text-slate-400 text-[11px] font-semibold mb-1">
                <span>{labels?.prepTimeLabel?.split('(')[0] || 'เวลาแต่งตัว'}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </div>
              <div className="text-base font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                {formatDisplayTime(prepTime)}
              </div>
            </button>

            {/* Travel Time Tap Button */}
            <button
              type="button"
              onClick={() => openPicker('travel')}
              className="p-3 rounded-xl bg-slate-50 dark:bg-[#181818] hover:bg-slate-100 dark:hover:bg-[#202020] border border-slate-200 dark:border-[#2a2a2a] text-left transition active:scale-98 cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full text-slate-500 dark:text-slate-400 text-[11px] font-semibold mb-1">
                <span>{labels?.travelTimeLabel?.split('(')[0] || 'เวลาเดินทาง'}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </div>
              <div className="text-base font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                {formatDisplayTime(travelTime)}
              </div>
            </button>

          </div>

          {/* Calculate Action Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-sm rounded-xl transition active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            <Sparkles className="w-4 h-4 text-amber-400 dark:text-amber-500" />
            <span>{labels?.calculateBtn || 'คำนวณตารางเวลาพักผ่อน'}</span>
            <ArrowRight className="w-4 h-4 opacity-70" />
          </button>
        </form>
      </div>

      {/* iOS-Style Time Picker Modal / Bottom Sheet */}
      {activePickerModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
          <div 
            className="fixed inset-0" 
            onClick={() => setActivePickerModal(null)}
          ></div>

          <div className="relative w-full max-w-sm rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#161616] border border-slate-200 dark:border-[#292929] p-5 shadow-2xl z-10 space-y-4 animate-slide-up">
            
            {/* Sheet Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222222] pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {activePickerModal === 'prep' ? 'ปรับเวลาแต่งตัว / เตรียมตัว' : 'ปรับเวลาเดินทาง'}
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  กำหนดเวลาได้อย่างอิสระตามต้องการ
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActivePickerModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Big Interactive Stepper Display */}
            <div className="flex items-center justify-center gap-4 py-2">
              <button
                type="button"
                onClick={() => adjustTempMinutes(-15)}
                className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-[#222222] hover:bg-slate-200 dark:hover:bg-[#2a2a2a] flex items-center justify-center text-slate-800 dark:text-white font-bold transition active:scale-90 cursor-pointer shadow-xs"
                title="ลด 15 นาที"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="text-center min-w-[130px]">
                <div className="text-3xl font-black text-slate-950 dark:text-white tabular-nums tracking-tight">
                  {tempHours > 0 ? `${tempHours} ชม. ` : ''}{tempMinutes} นาที
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  ({(tempHours + tempMinutes / 100).toFixed(2)} hrs)
                </span>
              </div>

              <button
                type="button"
                onClick={() => adjustTempMinutes(15)}
                className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-[#222222] hover:bg-slate-200 dark:hover:bg-[#2a2a2a] flex items-center justify-center text-slate-800 dark:text-white font-bold transition active:scale-90 cursor-pointer shadow-xs"
                title="เพิ่ม 15 นาที"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Custom Input Fields (Hours & Mins for 100% Freedom) */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200/80 dark:border-[#262626]">
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  จำนวนชั่วโมง:
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={tempHours}
                  onChange={(e) => setTempHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-white dark:bg-[#121212] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#333333] text-center text-sm font-bold text-slate-900 dark:text-white tabular-nums"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  จำนวนนาที (0-59):
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={tempMinutes}
                  onChange={(e) => setTempMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="w-full bg-white dark:bg-[#121212] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#333333] text-center text-sm font-bold text-slate-900 dark:text-white tabular-nums"
                />
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                ช้อยส์ที่ใช้บ่อย:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: '30 นาที', h: 0, m: 30 },
                  { label: '45 นาที', h: 0, m: 45 },
                  { label: '1 ชม.', h: 1, m: 0 },
                  { label: '1.25 ชม.', h: 1, m: 15 },
                  { label: '1.5 ชม.', h: 1, m: 30 },
                  { label: '1.75 ชม.', h: 1, m: 45 },
                  { label: '2 ชม.', h: 2, m: 0 },
                  { label: '2.5 ชม.', h: 2, m: 30 },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPresetInModal(item.h, item.m)}
                    className={`py-1.5 px-1 rounded-lg text-[11px] font-semibold transition cursor-pointer text-center ${
                      tempHours === item.h && tempMinutes === item.m
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-black font-bold'
                        : 'bg-slate-100 dark:bg-[#202020] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#282828] border border-slate-200 dark:border-[#2a2a2a]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button
              type="button"
              onClick={savePicker}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>บันทึกเวลานี้</span>
            </button>

          </div>
        </div>
      )}
    </>
  );
}
