// RFC 5545 Compliant iCalendar (.ics) Generator for Flight Crew Schedules

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

function formatDateToIcs(date) {
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

function parseFlightDateAndReport(dateStr, timeStr) {
  const currentYear = new Date().getFullYear();
  let day = 1;
  let month = new Date().getMonth(); // 0-indexed
  let year = currentYear;

  // Try extracting day and month from strings like "24 Aug (Mo)" or "2026-08-24" or "19 Aug"
  const monthMap = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };

  if (dateStr) {
    const isoMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      year = parseInt(isoMatch[1], 10);
      month = parseInt(isoMatch[2], 10) - 1;
      day = parseInt(isoMatch[3], 10);
    } else {
      const textMatch = dateStr.match(/(\d{1,2})\s+([a-zA-Z]{3})/i);
      if (textMatch) {
        day = parseInt(textMatch[1], 10);
        const mStr = textMatch[2].toLowerCase();
        if (monthMap[mStr] !== undefined) {
          month = monthMap[mStr];
        }
      }
    }
  }

  let hours = 8;
  let minutes = 0;
  if (timeStr && timeStr.includes(':')) {
    const [h, m] = timeStr.split(':').map(Number);
    hours = h;
    minutes = m;
  }

  return new Date(year, month, day, hours, minutes, 0);
}

export function generateIcsCalendar(flights, dressUpMinutes = 90, transitMinutes = 60) {
  const events = [];
  const now = new Date();
  const dtstamp = formatDateToIcs(now);

  flights.forEach((flight, idx) => {
    const isLeave = flight.dutyType === 'leave' || flight.dutyType === 'rest';

    if (isLeave) {
      const startDate = parseFlightDateAndReport(flight.date, "00:00");
      const endDate = parseFlightDateAndReport(flight.date, "23:59");

      events.push(`BEGIN:VEVENT
UID:rest-${idx}-${startDate.getTime()}@flightrest.app
DTSTAMP:${dtstamp}
DTSTART:${formatDateToIcs(startDate)}
DTEND:${formatDateToIcs(endDate)}
SUMMARY:🎉 วันพักผ่อน (DAY OFF) - ${flight.pairing || 'Rest'}
DESCRIPTION:วันพักผ่อนอย่างเป็นทางการ ไม่มีหน้าที่การบิน ชาร์จพลังให้เต็มที่! 🛌✨
STATUS:CONFIRMED
END:VEVENT`);
      return;
    }

    const isStandby = flight.dutyType === 'standby';
    const reportDate = parseFlightDateAndReport(flight.date, flight.reportTime || "08:00");
    
    // Calculate release date (default 9 hours if releaseTime not specified)
    let releaseDate = new Date(reportDate.getTime() + 9 * 60 * 60 * 1000);
    if (flight.releaseTime && flight.releaseTime.includes(':')) {
      const [rh, rm] = flight.releaseTime.split(':').map(Number);
      releaseDate = new Date(reportDate);
      releaseDate.setHours(rh, rm, 0);
      if (releaseDate < reportDate) {
        // Next day arrival
        releaseDate.setDate(releaseDate.getDate() + 1);
      }
    }

    const totalPrepTravelMs = (dressUpMinutes + transitMinutes) * 60 * 1000;
    const wakeupDate = new Date(reportDate.getTime() - totalPrepTravelMs);
    const bedtimeDate = new Date(wakeupDate.getTime() - 8 * 60 * 60 * 1000);

    const dutyPrefix = isStandby ? '⏳ STANDBY' : '✈️ FLIGHT';

    // 1. Flight Duty Event
    events.push(`BEGIN:VEVENT
UID:duty-${idx}-${reportDate.getTime()}@flightrest.app
DTSTAMP:${dtstamp}
DTSTART:${formatDateToIcs(reportDate)}
DTEND:${formatDateToIcs(releaseDate)}
SUMMARY:${dutyPrefix}: ${flight.pairing || 'Duty'}
DESCRIPTION:หน้าที่การบิน: ${flight.pairing}\\nReport: ${flight.reportTime || '--:--'} L\\nRelease: ${flight.releaseTime || '--:--'} L\\nตื่นนอน: ${wakeupDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT60M
ACTION:DISPLAY
DESCRIPTION:เตือนก่อนเริ่มงาน 1 ชั่วโมง
END:VALARM
END:VEVENT`);

    // 2. Wake-up Alarm Event
    const wakeupEnd = new Date(wakeupDate.getTime() + 15 * 60 * 1000);
    events.push(`BEGIN:VEVENT
UID:wake-${idx}-${wakeupDate.getTime()}@flightrest.app
DTSTAMP:${dtstamp}
DTSTART:${formatDateToIcs(wakeupDate)}
DTEND:${formatDateToIcs(wakeupEnd)}
SUMMARY:☀️ ตื่นนอน & แต่งตัว (${flight.pairing})
DESCRIPTION:ตื่นนอนเตรียมบิน!\\nแต่งตัว ${dressUpMinutes} นาที + เดินทาง ${transitMinutes} นาที\\nReport Time: ${flight.reportTime || '--:--'} L
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:PT0M
ACTION:DISPLAY
DESCRIPTION:ได้เวลาตื่นนอนเตรียมบินแล้วครับ! ✈️
END:VALARM
END:VEVENT`);

    // 3. Bedtime Reminder Event
    const bedtimeEnd = new Date(bedtimeDate.getTime() + 30 * 60 * 1000);
    events.push(`BEGIN:VEVENT
UID:bed-${idx}-${bedtimeDate.getTime()}@flightrest.app
DTSTAMP:${dtstamp}
DTSTART:${formatDateToIcs(bedtimeDate)}
DTEND:${formatDateToIcs(bedtimeEnd)}
SUMMARY:🌙 เวลาเข้านอน (พักผ่อน 8 ชม.) สำหรับไฟลท์พรุ่งนี้
DESCRIPTION:ได้เวลาเข้านอนเพื่อพักผ่อนให้เต็มที่ 8 ชั่วโมงสำหรับไฟลท์ ${flight.pairing}\\nตื่นนอนพรุ่งนี้: ${wakeupDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:เตือนเข้านอนในอีก 15 นาที
END:VALARM
END:VEVENT`);
  });

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Flight Rest Planner//Smart Aviation Calendar//TH
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:ตารางบิน & เวลานอน (Flight Rest)
X-WR-TIMEZONE:Asia/Bangkok
${events.join('\n')}
END:VCALENDAR`;
}

export function downloadIcsFile(flights, dressUpMinutes = 90, transitMinutes = 60, fileName = 'flight_rest_schedule.ics') {
  const icsContent = generateIcsCalendar(flights, dressUpMinutes, transitMinutes);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
