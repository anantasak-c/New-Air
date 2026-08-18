// LINE Flex Message Builder for Flight & Rest Schedule
import { calculateFlightSchedule, buildFlightFlexCard, buildRosterFlexCarousel } from '../../src/utils/flexBuilder.js';

export { calculateFlightSchedule, buildFlightFlexCard, buildRosterFlexCarousel };

export function buildLiffInvitationCard(flights, liffUrl) {
  // Show up to 5 flight preview rows in body
  const previewRows = flights.slice(0, 5).map(f => {
    let badgeText = '✈️';
    let textColor = '#1e3a8a';
    if (f.dutyType === 'standby') {
      badgeText = '⏳';
      textColor = '#b45309';
    } else if (f.dutyType === 'leave' || f.dutyType === 'rest') {
      badgeText = '🛌';
      textColor = '#15803d';
    }

    const timeText = f.reportTime ? `${f.reportTime} L` : 'Day Off';

    return {
      type: "box",
      layout: "horizontal",
      margin: "sm",
      contents: [
        {
          type: "text",
          text: `${badgeText} ${f.date || ''}`,
          size: "xs",
          weight: "bold",
          color: textColor,
          flex: 4
        },
        {
          type: "text",
          text: timeText,
          size: "xs",
          align: "end",
          weight: "bold",
          color: "#475569",
          flex: 2
        }
      ]
    };
  });

  return {
    type: "flex",
    altText: `✨ สแกนพบตารางบิน ${flights.length} รายการ! กรุณาแตะเพื่อเลือกวันและคำนวณเวลานอน`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#1e3a8a",
        paddingAll: "20px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "✨ AI ROSTER SCANNER",
                weight: "bold",
                color: "#93c5fd",
                size: "xxs"
              },
              {
                type: "text",
                text: `${flights.length} รายการ`,
                color: "#ffffff",
                size: "xxs",
                align: "end",
                weight: "bold"
              }
            ]
          },
          {
            type: "text",
            text: "สแกนพบตารางบินแล้ว!",
            weight: "bold",
            color: "#ffffff",
            size: "lg",
            margin: "sm"
          },
          {
            type: "text",
            text: "แตะปุ่มด้านล่างเพื่อปรับเวลาแต่งตัว/เดินทาง และเลือกวันที่ต้องการส่งเข้าแชท",
            color: "#bfdbfe",
            size: "xs",
            margin: "xs",
            wrap: true
          }
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "18px",
        backgroundColor: "#f8fafc",
        contents: [
          {
            type: "text",
            text: "📋 รายการที่ตรวจพบในรูป:",
            size: "xs",
            weight: "bold",
            color: "#334155",
            margin: "none"
          },
          {
            type: "separator",
            margin: "sm"
          },
          ...previewRows,
          ...(flights.length > 5 ? [{
            type: "text",
            text: `...และอีก ${flights.length - 5} รายการ`,
            size: "xxs",
            color: "#94a3b8",
            align: "center",
            margin: "md"
          }] : [])
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        backgroundColor: "#ffffff",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#2563eb",
            height: "md",
            action: {
              type: "uri",
              label: "⚙️ เลือกวัน & คำนวณเวลานอน",
              uri: liffUrl
            }
          }
        ]
      }
    }
  };
}
