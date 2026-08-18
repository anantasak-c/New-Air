// Client & Server Reusable LINE Flex Message Builder

export function formatTime(date) {
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

export function calculateFlightSchedule(reportTimeStr, dressUpMinutes = 90, transitMinutes = 60) {
  const [h, m] = reportTimeStr.split(':').map(Number);
  
  const reportDate = new Date();
  reportDate.setHours(h, m, 0, 0);

  const totalPrepTravelMs = (dressUpMinutes + transitMinutes) * 60 * 1000;
  const travelMs = transitMinutes * 60 * 1000;

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
    dressUpMinutes,
    transitMinutes,
    totalHours: ((dressUpMinutes + transitMinutes) / 60).toFixed(1)
  };
}

export function buildFlightFlexCard(flight, dressUpMinutes = 90, transitMinutes = 60) {
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
            weight: "bold",
            color: "#ffffff",
            size: "md"
          },
          {
            type: "text",
            text: flight.date || "Day Off",
            color: "#d1fae5",
            size: "xs",
            margin: "xs"
          }
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        backgroundColor: "#f8fafc",
        contents: [
          {
            type: "text",
            text: flight.pairing || "REST / OFF",
            weight: "bold",
            size: "md",
            color: "#1e293b"
          },
          {
            type: "text",
            text: "ไม่มีหน้าที่การบินในวันนี้ ชาร์จพลังให้เต็มที่ นอนหลับพักผ่อนได้อย่างสบายใจครับ! 🛌✨",
            size: "sm",
            color: "#64748b",
            wrap: true,
            margin: "md"
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#ffffff",
        paddingAll: "12px",
        contents: [
          {
            type: "button",
            style: "link",
            height: "sm",
            action: {
              type: "uri",
              label: "📱 เปิดเว็บ Flight Rest",
              uri: "https://new-air-phi.vercel.app"
            }
          }
        ]
      }
    };
  }

  const isStandby = flight.dutyType === 'standby';
  const reportTimeStr = flight.reportTime || "08:00";
  const sched = calculateFlightSchedule(reportTimeStr, dressUpMinutes, transitMinutes);

  const headerBgColor = isStandby ? "#f59e0b" : "#1e40af";
  const headerBadge = isStandby ? "⏳ STANDBY DUTY" : "✈️ FLIGHT DUTY";

  return {
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: headerBgColor,
      paddingAll: "16px",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: headerBadge,
              weight: "bold",
              color: "#ffffff",
              size: "xs"
            },
            {
              type: "text",
              text: flight.date || "Date",
              color: "#93c5fd",
              size: "xs",
              align: "end"
            }
          ]
        },
        {
          type: "text",
          text: flight.pairing || "Flight Pairing",
          weight: "bold",
          color: "#ffffff",
          size: "sm",
          margin: "sm",
          wrap: true
        },
        {
          type: "text",
          text: `Report: ${flight.reportTime || '--:--'} L | Release: ${flight.releaseTime || '--:--'} L`,
          color: "#dbeafe",
          size: "xxs",
          margin: "xs"
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "16px",
      backgroundColor: "#ffffff",
      contents: [
        // Hero Wakeup Block
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#eff6ff",
          cornerRadius: "12px",
          paddingAll: "12px",
          contents: [
            {
              type: "text",
              text: "☀️ เวลาตื่นนอนเป้าหมาย (WAKE UP)",
              size: "xxs",
              color: "#3b82f6",
              weight: "bold"
            },
            {
              type: "text",
              text: sched.wakeupTime,
              size: "xl",
              weight: "bold",
              color: "#1e3a8a",
              margin: "xs"
            },
            {
              type: "text",
              text: `(แต่งตัว ${dressUpMinutes} นาที + เดินทาง ${transitMinutes} นาที)`,
              size: "xxs",
              color: "#6b7280",
              margin: "xxs"
            }
          ]
        },
        // Departure row
        {
          type: "box",
          layout: "horizontal",
          margin: "md",
          contents: [
            {
              type: "text",
              text: "🚗 ออกจากบ้าน:",
              size: "xs",
              color: "#4b5563"
            },
            {
              type: "text",
              text: sched.departureTime,
              size: "xs",
              weight: "bold",
              color: "#111827",
              align: "end"
            }
          ]
        },
        {
          type: "separator",
          margin: "md"
        },
        // Bedtime Matrix Title
        {
          type: "text",
          text: "🌙 ตารางเวลานอนที่แนะนำ (Bedtime Options)",
          size: "xxs",
          color: "#6b7280",
          weight: "bold",
          margin: "md"
        },
        // 4-box Bedtime Grid
        {
          type: "box",
          layout: "horizontal",
          margin: "sm",
          spacing: "sm",
          contents: [
            {
              type: "box",
              layout: "vertical",
              backgroundColor: "#f0fdf4",
              cornerRadius: "8px",
              paddingAll: "8px",
              flex: 1,
              contents: [
                { type: "text", text: "🟢 8 ชม.", size: "xxs", color: "#15803d", weight: "bold" },
                { type: "text", text: sched.bedTime8h, size: "xs", color: "#14532d", weight: "bold", margin: "xs" }
              ]
            },
            {
              type: "box",
              layout: "vertical",
              backgroundColor: "#eff6ff",
              cornerRadius: "8px",
              paddingAll: "8px",
              flex: 1,
              contents: [
                { type: "text", text: "🔵 7 ชม.", size: "xxs", color: "#1d4ed8", weight: "bold" },
                { type: "text", text: sched.bedTime7h, size: "xs", color: "#1e3a8a", weight: "bold", margin: "xs" }
              ]
            }
          ]
        },
        {
          type: "box",
          layout: "horizontal",
          margin: "xs",
          spacing: "sm",
          contents: [
            {
              type: "box",
              layout: "vertical",
              backgroundColor: "#fffbeb",
              cornerRadius: "8px",
              paddingAll: "8px",
              flex: 1,
              contents: [
                { type: "text", text: "🟡 6 ชม.", size: "xxs", color: "#b45309", weight: "bold" },
                { type: "text", text: sched.bedTime6h, size: "xs", color: "#78350f", weight: "bold", margin: "xs" }
              ]
            },
            {
              type: "box",
              layout: "vertical",
              backgroundColor: "#fff1f2",
              cornerRadius: "8px",
              paddingAll: "8px",
              flex: 1,
              contents: [
                { type: "text", text: "🔴 5 ชม.", size: "xxs", color: "#be123c", weight: "bold" },
                { type: "text", text: sched.bedTime5h, size: "xs", color: "#881337", weight: "bold", margin: "xs" }
              ]
            }
          ]
        }
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#f8fafc",
      paddingAll: "10px",
      contents: [
        {
          type: "button",
          style: "link",
          height: "sm",
          action: {
            type: "uri",
            label: "📱 ปรับแต่งในเว็บ Flight Rest",
            uri: "https://new-air-phi.vercel.app"
          }
        }
      ]
    }
  };
}

export function buildRosterFlexCarousel(flights, dressUpMinutes = 90, transitMinutes = 60) {
  const bubbles = flights.slice(0, 10).map(f => buildFlightFlexCard(f, dressUpMinutes, transitMinutes));

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
