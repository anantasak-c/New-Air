import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import UberTopBar from './components/UberTopBar';
import WeatherBadge from './components/WeatherBadge';
import FlightForm from './components/FlightForm';
import ScheduleResults from './components/ScheduleResults';
import TarotWidget from './components/TarotWidget';
import { Plane, ShieldCheck, Heart } from 'lucide-react';

function MainContent() {
  const [scheduleData, setScheduleData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);

  // Convert decimal hours (e.g., 1.30 = 90 minutes)
  const decimalHoursToMinutes = (decimalHours) => {
    const hours = Math.floor(decimalHours);
    const decimalMinutes = decimalHours - hours;
    const minutes = Math.round(decimalMinutes * 100);
    return hours * 60 + minutes;
  };

  // Format decimal hours to readable Thai string
  const formatDecimalHours = (decimalHours) => {
    const totalMinutes = decimalHoursToMinutes(decimalHours);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes} นาที`;
    if (minutes === 0) return `${hours} ชม.`;
    return `${hours} ชม. ${minutes} นาที`;
  };

  // Format Date to 12-hour AM/PM string with zero padding
  const formatTime = (date) => {
    if (!date) return '--:--';
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesFormatted = minutes < 10 ? '0' + minutes : minutes;
    const hoursFormatted = hours < 10 ? '0' + hours : hours;
    return `${hoursFormatted}:${minutesFormatted} ${ampm}`;
  };

  // Format Date to short Thai date string
  const formatDateShort = (date) => {
    if (!date) return '';
    const months = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear() + 543;
    return `${day} ${month} ${year}`;
  };

  const handleCalculate = ({ reportTime, prepTime, travelTime }) => {
    const prepMins = decimalHoursToMinutes(prepTime);
    const travelMins = decimalHoursToMinutes(travelTime);

    const reportDate = new Date(reportTime);
    const reportTimeMs = reportDate.getTime();

    const totalPrepTravelMins = prepMins + travelMins;
    const totalPrepTravelMs = totalPrepTravelMins * 60 * 1000;
    const travelMs = travelMins * 60 * 1000;

    const departureDate = new Date(reportTimeMs - travelMs);
    const wakeupDate = new Date(reportTimeMs - totalPrepTravelMs);

    const bedTime8hDate = new Date(wakeupDate.getTime() - 8 * 60 * 60 * 1000);
    const bedTime7hDate = new Date(wakeupDate.getTime() - 7 * 60 * 60 * 1000);
    const bedTime6hDate = new Date(wakeupDate.getTime() - 6 * 60 * 60 * 1000);
    const bedTime5hDate = new Date(wakeupDate.getTime() - 5 * 60 * 60 * 1000);

    setScheduleData({
      reportDate,
      wakeupDate,
      departureDate,
      bedTime8hDate,
      bedTime7hDate,
      bedTime6hDate,
      bedTime5hDate,
      prepTimeFormatted: formatDecimalHours(prepTime),
      travelTimeFormatted: formatDecimalHours(travelTime),
      formatTime,
      formatDateShort,
    });
  };

  const handleReset = () => {
    setScheduleData(null);
  };

  // Auto calculate on initial load if saved data exists
  useEffect(() => {
    const savedReport = localStorage.getItem('uber_planner_reportTime') || localStorage.getItem('rest_planner_reportTime');
    const savedPrep = localStorage.getItem('uber_planner_prepTime') || localStorage.getItem('rest_planner_prepTime') || '1.30';
    const savedTravel = localStorage.getItem('uber_planner_travelTime') || localStorage.getItem('rest_planner_travelTime') || '1.00';

    if (savedReport) {
      handleCalculate({
        reportTime: savedReport,
        prepTime: parseFloat(savedPrep),
        travelTime: parseFloat(savedTravel),
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-white selection:text-black">
      
      {/* Uber Sticky Top Bar */}
      <UberTopBar weather={weatherData} />

      {/* Main Container - Mobile First Optimized */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-5 space-y-4 pb-20">
        
        {/* Open-Meteo Bangkok Weather */}
        <WeatherBadge onWeatherLoaded={setWeatherData} />

        {/* Smart Flight Form Inputs */}
        <FlightForm 
          onCalculate={handleCalculate} 
          onReset={handleReset} 
        />

        {/* Calculation Outputs (Timeline & Wake-up Hero Card) */}
        {scheduleData && (
          <ScheduleResults 
            data={scheduleData} 
            weather={weatherData} 
          />
        )}

        {/* Daily Flight Tarot */}
        <TarotWidget />

        {/* Footer */}
        <footer className="pt-8 pb-6 text-center text-xs text-[#6b6b6b] space-y-2 border-t border-[#1f1f1f]">
          <div className="flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#a6a6a6]">
            <span>✈️ Flight Duty & Rest Planner</span>
            <span>•</span>
            <span>Uber Design Edition</span>
          </div>
          <p className="text-[11px] text-[#6b6b6b]">
            Designed for Flight Crew, Pilots & Smart Global Travelers
          </p>
        </footer>

      </main>

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainContent />
    </ThemeProvider>
  );
}
