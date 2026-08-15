import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import UberTopBar from './components/UberTopBar';
import FlightForm from './components/FlightForm';
import ScheduleResults from './components/ScheduleResults';
import TarotWidget from './components/TarotWidget';
import { fetchBangkokTomorrowWeather } from './services/weatherService';

function MainContent() {
  const [scheduleData, setScheduleData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);

  useEffect(() => {
    fetchBangkokTomorrowWeather().then((data) => {
      setWeatherData(data);
    });
  }, []);

  const decimalHoursToMinutes = (decimalHours) => {
    const hours = Math.floor(decimalHours);
    const decimalMinutes = decimalHours - hours;
    const minutes = Math.round(decimalMinutes * 100);
    return hours * 60 + minutes;
  };

  const formatDecimalHours = (decimalHours) => {
    const totalMinutes = decimalHoursToMinutes(decimalHours);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes} นาที`;
    if (minutes === 0) return `${hours} ชม.`;
    return `${hours} ชม. ${minutes} นาที`;
  };

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
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-black text-slate-900 dark:text-white flex flex-col selection:bg-slate-900 selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors">
      
      {/* Sleek Top Bar with Weather Pill & Theme Toggle */}
      <UberTopBar weather={weatherData} />

      {/* Main Container - Compact 1-Screen Glanceable Layout */}
      <main className="flex-1 max-w-xl w-full mx-auto px-3.5 py-4 space-y-3.5 pb-12">
        
        {/* Form Inputs */}
        <FlightForm 
          onCalculate={handleCalculate} 
          onReset={handleReset} 
        />

        {/* Final Result Display (1-Screen Glanceability) */}
        {scheduleData && (
          <ScheduleResults 
            data={scheduleData} 
            weather={weatherData} 
          />
        )}

        {/* Daily Tarot Card Button (Hidden by default, opens in Modal) */}
        <TarotWidget />

        {/* Minimal Footer */}
        <footer className="pt-6 pb-4 text-center text-[11px] text-slate-400 dark:text-slate-600 space-y-1">
          <p className="font-mono uppercase tracking-wider">
            Flight Duty & Rest Planner • Minimal Edition
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
