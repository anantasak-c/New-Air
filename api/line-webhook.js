// LINE Messaging API Webhook Handler (Vercel Serverless Function)
import crypto from 'crypto';
import { scanRosterWithGemini } from './lib/geminiVision.js';
import { buildLiffInvitationCard } from './lib/flexMessageBuilder.js';

export const config = {
  maxDuration: 60,
};

const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LIFF_ID = process.env.LINE_LIFF_ID || process.env.VITE_LIFF_ID || '2011161687-ldzW1DVD';


function verifySignature(bodyStr, signature) {
  if (!CHANNEL_SECRET) return true;
  if (!signature) return true;
  try {
    const hash = crypto
      .createHmac('sha256', CHANNEL_SECRET)
      .update(bodyStr)
      .digest('base64');
    return hash === signature;
  } catch (e) {
    return true;
  }
}

async function replyLineMessage(replyToken, messages) {
  if (!ACCESS_TOKEN) {
    console.error('Missing LINE_CHANNEL_ACCESS_TOKEN');
    return;
  }

  const url = 'https://api.line.me/v2/bot/message/reply';
  const payload = {
    replyToken: replyToken,
    messages: Array.isArray(messages) ? messages : [messages],
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('LINE Reply API Error:', res.status, errText);
    } else {
      console.log('✅ LINE Reply API Success!');
    }
  } catch (err) {
    console.error('LINE fetch exception:', err);
  }
}

async function getLineImageBuffer(messageId) {
  if (!ACCESS_TOKEN) {
    throw new Error('Missing LINE_CHANNEL_ACCESS_TOKEN in environment');
  }

  const url = `https://api-data.line.me/v2/bot/message/${messageId}/content`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LINE Image API ${res.status}: ${err}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ok', 
      message: 'Flight Rest Planner LINE Webhook with LIFF is active ✈️',
      model: 'Gemini 2.5 Flash Lite',
      hasChannelSecret: !!CHANNEL_SECRET,
      hasAccessToken: !!ACCESS_TOKEN,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasLiffId: !!LIFF_ID
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const events = req.body?.events || [];
  console.log(`Received ${events.length} LINE webhook events`);

  for (const event of events) {
    try {
      const replyToken = event.replyToken;
      if (!replyToken) continue;

      // 1. User sends an IMAGE (Roster Screenshot)
      if (event.type === 'message' && event.message.type === 'image') {
        console.log('Processing incoming image messageId:', event.message.id);
        
        let ocrResult = null;
        try {
          const imageBuffer = await getLineImageBuffer(event.message.id);
          ocrResult = await scanRosterWithGemini(imageBuffer);
        } catch (imgErr) {
          console.error('Image fetch error:', imgErr);
          ocrResult = { success: false, error: imgErr.message };
        }

        // If technical error occurred during AI OCR
        if (!ocrResult?.success) {
          await replyLineMessage(replyToken, {
            type: 'text',
            text: `⚠️ ระบบ AI ขัดข้องชั่วคราว (${ocrResult?.error || 'ไม่สามารถติดต่อ AI ได้'})\n\nกรุณาลองส่งใหม่อีกครั้ง หรือเปิดคำนวณผ่านหน้าเว็บด้านล่างนี้ได้ครับ ✈️`,
            quickReply: {
              items: [
                {
                  type: 'action',
                  action: {
                    type: 'uri',
                    label: '📱 เปิดหน้าเว็บคำนวณ',
                    uri: 'https://new-air-phi.vercel.app',
                  },
                },
              ],
            },
          });
          continue;
        }

        // If no flights or duties found in image
        if (!ocrResult?.data?.hasRoster || !ocrResult?.data?.flights?.length) {
          await replyLineMessage(replyToken, {
            type: 'text',
            text: '⚠️ ไม่พบข้อมูลตารางบินในรูปนี้ครับ\n\nโปรดแคปหน้าจอ Roster (เช่น หน้ารายการไฟลท์ หรือหน้ารายละเอียดวัน) ให้เห็นตัวหนังสือชัดเจน แล้วส่งใหม่อีกครั้งนะครับ ✈️',
            quickReply: {
              items: [
                {
                  type: 'action',
                  action: {
                    type: 'uri',
                    label: '📱 เปิดหน้าเว็บกรอกเอง',
                    uri: 'https://new-air-phi.vercel.app',
                  },
                },
              ],
            },
          });
          continue;
        }

        const flights = ocrResult.data.flights;
        console.log(`Building LIFF invitation card for ${flights.length} flights...`);

        // Compress flights to compact tuple format: [date, pairing, reportTime, typeChar]
        const compact = flights.map(f => [
          f.date || '',
          (f.pairing || '').replace(/:\s*BKKBKK/g, ''),
          f.reportTime || '',
          f.dutyType ? f.dutyType[0] : 'f'
        ]);
        const compactJson = JSON.stringify(compact);
        const encodedData = Buffer.from(unescape(encodeURIComponent(compactJson))).toString('base64');

        // Construct LIFF URL (Drawer) and Calendar URL (Full Screen)
        const liffUrl = LIFF_ID
          ? `https://liff.line.me/${LIFF_ID}?d=${encodedData}`
          : `https://new-air-phi.vercel.app/liff?d=${encodedData}`;

        // Prefer opening the calendar inside LINE via the 100% LIFF when its
        // ID is configured; otherwise fall back to the plain web URL.
        const LIFF_ID_FULL = process.env.LINE_LIFF_ID_FULL || '';
        const calendarUrl = LIFF_ID_FULL
          ? `https://liff.line.me/${LIFF_ID_FULL}?d=${encodedData}`
          : `https://new-air-phi.vercel.app/calendar?d=${encodedData}`;

        console.log('LIFF URL Length:', liffUrl.length);
        const invitationCard = buildLiffInvitationCard(flights, liffUrl, calendarUrl);
        await replyLineMessage(replyToken, invitationCard);
        continue;
      }

      // 2. User sends TEXT message (Welcome & Guidance)
      if (event.type === 'message' && event.message.type === 'text') {
        console.log('Processing incoming text message:', event.message.text);
        await replyLineMessage(replyToken, {
          type: 'text',
          text: '✈️ ยินดีต้อนรับสู่ Flight Duty & Rest Planner!\n\n📸 เพียงแคปหน้าจอ Roster (ตารางบิน) แล้วส่งรูปเข้ามาในแชทนี้ได้เลยครับ\n\nAI จะสแกนตารางบินและเปิดหน้าต่าง LIFF ให้คุณปรับเวลาแต่งตัว/เดินทาง และเลือกวันได้ตามใจชอบครับ 🛌✨',
          quickReply: {
            items: [
              {
                type: 'action',
                action: {
                  type: 'uri',
                  label: '📱 เปิดหน้าเว็บคำนวณ',
                  uri: 'https://new-air-phi.vercel.app',
                },
              },
            ],
          },
        });
      }
    } catch (err) {
      console.error('Error handling LINE event:', err);
    }
  }

  return res.status(200).json({ status: 'success' });
}
