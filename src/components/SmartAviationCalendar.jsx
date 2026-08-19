import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plane, 
  Moon, 
  Sun, 
  Coffee, 
  Car, 
  CheckCircle2, 
  Download, 
  Sparkles, 
  Clock, 
  Heart,
  Shield,
  ArrowRight
} from 'lucide-react';
import { calculateFlightSchedule } from '../utils/flexBuilder';
import { downloadIcsFile } from '../utils/icsGenerator';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const WEEKDAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

function parseFlightDay(dateStr) {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{1,2})/);
  return match ? parseInt(match[1], 10) : null;
}

export default function SmartAviationCalendar({ 
  flights = [], 
  dressUpMinutes = 90, 
  transitMinutes = 60,
  onSendToLine = null 
}) {
  // Current viewed month and year (Default August 2026 or current date)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(7); // 0-indexed (7 = August)
  const [selectedDay, setSelectedDay] = useState(24); // default select 24th or first flight

  // Group flights by day of month
  const flightsByDay = {};
  flights.forEach(f => {
    const day = parseFlightDay(f.date);
    if (day) {
      flightsByDay[day] = f;
    }
  });

  // Calculate days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayWeekday = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Selected Day Details
  const selectedFlight = flightsByDay[selectedDay] || null;
  const isSelectedLeave = selectedFlight && (selectedFlight.dutyType === 'leave' || selectedFlight.dutyType === 'rest');
  const isSelectedStandby = selectedFlight && selectedFlight.dutyType === 'standby';
  const isSelectedFlight = selectedFlight && selectedFlight.dutyType === 'flight';

  // Calculate schedule details if active flight or standby
  const reportTimeStr = selectedFlight?.reportTime || (isSelectedStandby ? "02:00" : "06:05");
  const scheduleDetails = selectedFlight && !isSelectedLeave 
    ? calculateFlightSchedule(reportTimeStr, dressUpMinutes, transitMinutes)
    : null;

  // Check if next day has early morning flight (<07:00 L)
  const nextDayFlight = flightsByDay[selectedDay + 1];
  const hasEarlyFlightNextDay = nextDayFlight && nextDayFlight.reportTime && parseInt(nextDayFlight.reportTime.split(':')[0], 10) < 7;

  return (
    <div className="space-y-3 font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Segoe_UI',Roboto,sans-serif]">
      
      {/* 1. Monthly Calendar Grid Card (Apple iOS White) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 space-y-3">
        
        {/* Month Navigation Header */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>{THAI_MONTHS[currentMonth]}</span>
              <span className="text-blue-600 font-semibold">{currentYear}</span>
            </h2>
            <p className="text-[11px] text-slate-500 font-normal">
              แตะวันที่เพื่อดูไทม์ไลน์พักผ่อน & วางแผนชีวิต
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200/70">
            <button
              type="button"
              onClick={prevMonth}
              className="w-7 h-7 rounded-lg hover:bg-white active:scale-90 flex items-center justify-center text-slate-600 transition-all shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="w-7 h-7 rounded-lg hover:bg-white active:scale-90 flex items-center justify-center text-slate-600 transition-all shadow-xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekday Header */}
        <div className="grid grid-cols-7 gap-1 text-center border-b border-slate-100 pb-2">
          {WEEKDAYS.map((wd, i) => (
            <div 
              key={wd} 
              className={`text-[11px] font-bold ${i === 0 ? 'text-rose-500' : i === 6 ? 'text-blue-500' : 'text-slate-400'}`}
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayWeekday }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[46px] rounded-xl opacity-20" />
          ))}

          {/* Month Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const flight = flightsByDay[dayNum];
            const isSelected = selectedDay === dayNum;

            const isFlight = flight?.dutyType === 'flight';
            const isStandby = flight?.dutyType === 'standby';
            const isLeave = flight?.dutyType === 'leave' || flight?.dutyType === 'rest';

            // Next day check for early sleep moon dot
            const nextFlight = flightsByDay[dayNum + 1];
            const isEarlySleepNight = nextFlight && nextFlight.reportTime && parseInt(nextFlight.reportTime.split(':')[0], 10) < 7;

            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => setSelectedDay(dayNum)}
                className={`min-h-[50px] p-1 rounded-xl flex flex-col items-center justify-between transition-all relative border ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                    : flight
                    ? 'bg-slate-50/80 border-slate-200/80 hover:bg-slate-100/80'
                    : 'border-transparent hover:bg-slate-50'
                }`}
              >
                {/* Day Number */}
                <div className="flex items-center justify-between w-full px-0.5">
                  <span className={`text-xs font-bold ${
                    isSelected ? 'text-blue-700' : flight ? 'text-slate-900' : 'text-slate-500'
                  }`}>
                    {dayNum}
                  </span>

                  {/* Moon icon for Early Sleep Zone */}
                  {isEarlySleepNight && (
                    <span title="คืนนี้ต้องรีบเข้านอน (มีบินเช้าพรุ่งนี้)">
                      <Moon className="w-2.5 h-2.5 text-amber-500 fill-amber-400" />
                    </span>
                  )}
                </div>

                {/* Duty Pill / Badge */}
                {flight && (
                  <div className="w-full mt-0.5">
                    {isFlight && (
                      <div className="w-full px-1 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold truncate text-center">
                        {flight.reportTime ? flight.reportTime : 'บิน'}
                      </div>
                    )}
                    {isStandby && (
                      <div className="w-full px-1 py-0.5 rounded bg-amber-500 text-white text-[9px] font-bold truncate text-center">
                        {flight.reportTime || 'SBM'}
                      </div>
                    )}
                    {isLeave && (
                      <div className="w-full px-1 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-bold truncate text-center">
                        Off
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-3 text-[10px] font-medium text-slate-500 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-blue-600" />
            <span>ไฟลท์บิน</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-500" />
            <span>Standby</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
            <span>วันพักผ่อน (Off)</span>
          </div>
          <div className="flex items-center gap-1">
            <Moon className="w-2.5 h-2.5 text-amber-500 fill-amber-400" />
            <span>คืนก่อนบินเช้า</span>
          </div>
        </div>
      </div>

      {/* 2. Selected Day Lifestyle & Agenda Timeline Sheet */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 space-y-3.5">
        
        {/* Day Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              รายละเอียดวันที่ {selectedDay} {THAI_MONTHS[currentMonth]} {currentYear}
            </span>
            <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
              {selectedFlight ? selectedFlight.pairing : 'ไม่มีหน้าที่การบินที่บันทึกไว้'}
            </h3>
          </div>

          {selectedFlight && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
              isSelectedFlight
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : isSelectedStandby
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {isSelectedFlight ? '✈️ FLIGHT' : isSelectedStandby ? '⏳ STANDBY' : '🎉 DAY OFF'}
            </span>
          )}
        </div>

        {/* Timeline breakdown */}
        {selectedFlight && !isSelectedLeave && scheduleDetails ? (
          <div className="space-y-2.5">
            
            {/* Timeline Steps */}
            <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              
              {/* 1. Bedtime Step */}
              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-indigo-50 border-2 border-indigo-500 flex items-center justify-center">
                  <Moon className="w-2.5 h-2.5 text-indigo-600" />
                </div>
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-slate-800">🌙 เวลาเข้านอน (Bedtime Zone)</span>
                    <span className="text-xs font-mono font-bold text-indigo-600">{scheduleDetails.bedTime8h} - {scheduleDetails.bedTime7h}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    แนะนำเข้านอนก่อนเวลานี้เพื่อให้ได้พักผ่อนเต็มที่ 7 - 8 ชั่วโมง
                  </p>
                </div>
              </div>

              {/* 2. Wake-up Step */}
              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-blue-50 border-2 border-blue-500 flex items-center justify-center">
                  <Sun className="w-2.5 h-2.5 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-slate-800">☀️ เวลาตื่นนอน & แต่งตัว</span>
                    <span className="text-xs font-mono font-bold text-blue-600">{scheduleDetails.wakeupTime}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    มีเวลาเตรียมตัวแต่งกายและตรวจเช็กอุปกรณ์ {dressUpMinutes} นาที
                  </p>
                </div>
              </div>

              {/* 3. Departure Step */}
              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center">
                  <Car className="w-2.5 h-2.5 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-slate-800">🚗 ออกเดินทางไปสนามบิน</span>
                    <span className="text-xs font-mono font-bold text-emerald-600">{scheduleDetails.departureTime}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    เผื่อเวลาเดินทาง {transitMinutes} นาที ถึงสนามบินตรงเวลา
                  </p>
                </div>
              </div>

              {/* 4. Duty Report Step */}
              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-rose-50 border-2 border-rose-500 flex items-center justify-center">
                  <Plane className="w-2.5 h-2.5 text-rose-600" />
                </div>
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-slate-800">✈️ รายงานตัวเริ่มงาน (Report)</span>
                    <span className="text-xs font-mono font-bold text-rose-600">{scheduleDetails.reportTime} L</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    เสร็จสิ้นภารกิจ (Release): {selectedFlight.releaseTime || '15:45'} L
                  </p>
                </div>
              </div>

              {/* 5. Free Time Window (Life Planning) */}
              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-amber-50 border-2 border-amber-500 flex items-center justify-center">
                  <Coffee className="w-2.5 h-2.5 text-amber-600" />
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/70">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                      ช่วงเวลาว่างสำหรับใช้ชีวิต (Free Time)
                    </span>
                    <span className="text-[11px] font-bold text-amber-700">
                      {selectedFlight.releaseTime || '15:45'} น. เป็นต้นไป
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800/80 mt-1">
                    {hasEarlyFlightNextDay
                      ? '⚠️ คืนนี้มีบินเช้าพรุ่งนี้ แนะนำเลี่ยงนัดดึก และเข้านอนช่วง 21:00 - 22:00 น.'
                      : '✅ ปลอดภัยสำหรับนัดเจอเพื่อน ทานข้าวกับครอบครัว หรือไปออกกำลังกายฟิตเนสได้สบายๆ ครับ'}
                  </p>
                </div>
              </div>

            </div>

          </div>
        ) : isSelectedLeave ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1.5">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Sun className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-emerald-900">วันพักผ่อนอย่างเป็นทางการ (100% Free Day)</h4>
            <p className="text-xs text-emerald-700">
              ไม่มีหน้าที่การบินตลอดทั้งวัน สามารถวางแผนท่องเที่ยว ไปต่างจังหวัด หรือพักผ่อนได้อย่างเต็มที่ครับ! 🛌🏖️
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 text-center text-xs text-slate-500">
            แตะเลือกวันที่มีไฟลท์บินในปฏิทินเพื่อดูไทม์ไลน์พักผ่อน
          </div>
        )}

        {/* 3. 1-Click Sync to Phone Calendar (.ics) Action */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => downloadIcsFile(flights, dressUpMinutes, transitMinutes)}
            className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>📅 ซิงค์เข้าปฏิทิน iPhone / Google Calendar (.ics)</span>
          </button>
        </div>

      </div>

    </div>
  );
}
