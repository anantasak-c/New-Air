// LINE Flex Message Builder for Flight & Rest Schedule

function formatTime(date) {
  if (!date) return '--:--';
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesFormatted = minutes < 10 ? '0' + minutes : minutes;
  const hoursFormatted = hours < 10 ? '0' + hours : hours;
  return `${hoursFormatted}:${minutesFormatted} ${ampm}`;
}

export function calculateFlightSchedule(reportTimeStr, totalPrepTravelHours = 2.5) {
  // reportTimeStr format: "HH:MM" (e.g. "06:05")
  const [h, m] = reportTimeStr.split(':').map(Number);
  
  const reportDate = new Date();
  reportDate.setHours(h, m, 0, 0);

  const totalPrepTravelMs = totalPrepTravelHours * 60 * 60 * 1000;
  const travelMs = 1.0 * 60 * 60 * 1000; // default 1 hour transit

  const wakeupDate = new Date(reportDate.getTime() - totalPrepTravelMs);
  const departureDate = new Date(reportDate.getTime() - travelMs);

  const bedTime8h = new Date(wakeupDate.getTime() - 8 * 60 * 60 * 1000);
  const bedTime7h = new Date(wakeupDate.getTime() - 7 * 60 * 60 * 1000);
  const bedTime6h = new Date(wakeupDate.getTime() - 6 * 60 * 60 * 1000);
  const bedTime5h = new Date(wakeupDate.getTime() - 5 * 60 * 60 * 1000);

  return {
    reportTime: formatTime(reportDate),
    wakeupTime: formatTime(wakeupDate),
    departureTime: formatTime(departureDate),
    bedTime8h: formatTime(bedTime8h),
    bedTime7h: formatTime(bedTime7h),
    bedTime6h: formatTime(bedTime6h),
    bedTime5h: formatTime(bedTime5h),
    totalPrepTravelHours,
  };
}

export function buildFlightFlexCard(flight, prepTravelHours = 2.5) {
  const isLeave = flight.dutyType === 'leave' || flight.dutyType === 'rest';

  if (isLeave) {
    return {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#10b981",
        paddingAll: "16px",
        contents: [
          {
            type: "text",
            text: "🎉 วันพักผ่อน (DAY OFF)",
            color: "#ffffff",
            weight: "bold",
            size: "sm"
          },
          {
            type: "text",
            text: flight.date || "พักผ่อนเต็มที่",
            color: "#d1fae5",
            size: "xs",
            margin: "xs"
          }
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: flight.pairing || "AL-1 / Rest Day",
            weight: "bold",
            size: "md",
            color: "#111827"
          },
          {
            type: "text",
            text: "ไม่มีภารกิจบินในวันนี้ พักผ่อน ชาร์จพลัง และนอนหลับให้เต็มอิ่มได้เลยครับ 🛌✨",
            wrap: true,
            size: "xs",
            color: "#4b5563"
          }
        ]
      }
    };
  }

  const sched = calculateFlightSchedule(flight.reportTime || "06:00", prepTravelHours);

  return {
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#0f172a",
      paddingAll: "16px",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: "✈️ " + (flight.pairing || "FLIGHT DUTY"),
              color: "#38bdf8",
              weight: "bold",
              size: "xs",
              flex: 1,
              wrap: true
            }
          ]
        },
        {
          type: "text",
          text: (flight.date ? flight.date + " • " : "") + "เริ่มงาน " + (flight.reportTime || "06:00") + " น.",
          color: "#94a3b8",
          size: "xxs",
          margin: "xs"
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "16px",
      spacing: "md",
      contents: [
        // Wake-up Target Hero
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#f8fafc",
          cornerRadius: "12px",
          paddingAll: "12px",
          contents: [
            {
              type: "text",
              text: "☀️ เวลาตื่นนอนที่แนะนำ",
              size: "xxs",
              color: "#64748b",
              weight: "bold"
            },
            {
              type: "text",
              text: sched.wakeupTime,
              size: "xxl",
              weight: "bold",
              color: "#0f172a",
              margin: "xs"
            },
            {
              type: "text",
              text: `เผื่อเวลาเตรียมตัว+เดินทาง ${prepTravelHours} ชม.`,
              size: "xxs",
              color: "#94a3b8"
            }
          ]
        },
        // Departure row
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: "🚗 ออกจากบ้าน:",
              size: "xs",
              color: "#64748b",
              flex: 1
            },
            {
              type: "text",
              text: sched.departureTime,
              size: "xs",
              weight: "bold",
              color: "#0f172a",
              align: "end"
            }
          ]
        },
        {
          type: "separator",
          color: "#f1f5f9"
        },
        // Bedtime Matrix
        {
          type: "box",
          layout: "vertical",
          spacing: "xs",
          contents: [
            {
              type: "text",
              text: "🌙 เวลานอนแนะนำ (คืนก่อนไฟลท์)",
              size: "xxs",
              color: "#475569",
              weight: "bold"
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "• 8 ชม. (เต็มอิ่ม):", size: "xxs", color: "#16a34a", flex: 1 },
                { type: "text", text: sched.bedTime8h, size: "xxs", weight: "bold", color: "#16a34a", align: "end" }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "• 7 ชม. (สบาย):", size: "xxs", color: "#65a30d", flex: 1 },
                { type: "text", text: sched.bedTime7h, size: "xxs", weight: "bold", color: "#65a30d", align: "end" }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "• 6 ชม. (มาตรฐาน):", size: "xxs", color: "#d97706", flex: 1 },
                { type: "text", text: sched.bedTime6h, size: "xxs", weight: "bold", color: "#d97706", align: "end" }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "• 5 ชม. (ขั้นต่ำ):", size: "xxs", color: "#e11d48", flex: 1 },
                { type: "text", text: sched.bedTime5h, size: "xxs", weight: "bold", color: "#e11d48", align: "end" }
              ]
            }
          ]
        }
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      paddingAll: "12px",
      paddingTop: "0px",
      contents: [
        {
          type: "button",
          style: "link",
          height: "sm",
          action: {
            type: "uri",
            label: "📱 เปิดดูในเว็บ / ปรับแต่ง",
            uri: "https://new-air-phi.vercel.app"
          }
        }
      ]
    }
  };
}

export function buildRosterFlexCarousel(flights, prepTravelHours = 2.5) {
  const bubbles = flights.slice(0, 10).map(f => buildFlightFlexCard(f, prepTravelHours));

  if (bubbles.length === 1) {
    return {
      type: "flex",
      altText: `✈️ สรุปตารางบิน & เวลานอน (${flights[0].pairing || "Flight Schedule"})`,
      contents: bubbles[0]
    };
  }

  return {
    type: "flex",
    altText: `✈️ สรุปตารางบิน ${flights.length} ไฟลท์ & เวลานอน`,
    contents: {
      type: "carousel",
      contents: bubbles
    }
  };
}
