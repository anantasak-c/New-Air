// LINE Messaging API Webhook Handler (Vercel Serverless Function)
import crypto from 'crypto';
import { scanRosterWithGemini } from './lib/geminiVision.js';
import { buildRosterFlexCarousel } from './lib/flexMessageBuilder.js';

const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

function verifySignature(bodyStr, signature) {
  if (!CHANNEL_SECRET) return true; // allow testing if secret not set
  if (!signature) return false;
  const hash = crypto
    .createHmac('sha256', CHANNEL_SECRET)
    .update(bodyStr)
    .digest('base64');
  return hash === signature;
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
  }
}

async function getLineImageBuffer(messageId) {
  if (!ACCESS_TOKEN) {
    throw new Error('Missing LINE_CHANNEL_ACCESS_TOKEN');
  }

  const url = `https://api-data.line.me/v2/bot/message/${messageId}/content`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to download LINE image: ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', message: 'Flight Rest Planner LINE Webhook is active ✈️' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['x-line-signature'];
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

  if (CHANNEL_SECRET && !verifySignature(rawBody, signature)) {
    console.error('Invalid LINE webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const events = req.body?.events || [];

  for (const event of events) {
    try {
      const replyToken = event.replyToken;
      if (!replyToken) continue;

      // 1. User sends an IMAGE (Roster Screenshot)
      if (event.type === 'message' && event.message.type === 'image') {
        const imageBuffer = await getLineImageBuffer(event.message.id);
        const ocrResult = await scanRosterWithGemini(imageBuffer);

        if (!ocrResult.success || !ocrResult.data?.hasRoster || !ocrResult.data?.flights?.length) {
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
        const encodedData = Buffer.from(JSON.stringify(flights)).toString('base64');

        // Quick Reply for total prep + transit hours
        await replyLineMessage(replyToken, {
          type: 'text',
          text: `✨ สแกนพบตารางบิน ${flights.length} รายการ!\n\nรวมเวลาเตรียมตัว + เดินทางกี่ชั่วโมงดีครับ?`,
          quickReply: {
            items: [
              {
                type: 'action',
                action: {
                  type: 'postback',
                  label: '2.0 ชม.',
                  data: `action=calc&prep=2.0&data=${encodedData}`,
                  displayText: '2.0 ชม. (เตรียมตัว 1h + เดินทาง 1h)',
                },
              },
              {
                type: 'action',
                action: {
                  type: 'postback',
                  label: '2.5 ชม. (แนะนำ)',
                  data: `action=calc&prep=2.5&data=${encodedData}`,
                  displayText: '2.5 ชม. (เตรียมตัว 1.5h + เดินทาง 1h)',
                },
              },
              {
                type: 'action',
                action: {
                  type: 'postback',
                  label: '3.0 ชม.',
                  data: `action=calc&prep=3.0&data=${encodedData}`,
                  displayText: '3.0 ชม. (เตรียมตัว 2h + เดินทาง 1h)',
                },
              },
              {
                type: 'action',
                action: {
                  type: 'postback',
                  label: '3.5 ชม.',
                  data: `action=calc&prep=3.5&data=${encodedData}`,
                  displayText: '3.5 ชม. (เตรียมตัว 2h + เดินทาง 1.5h)',
                },
              },
            ],
          },
        });
        continue;
      }

      // 2. User taps a QUICK REPLY (Postback Action)
      if (event.type === 'postback') {
        const params = new URLSearchParams(event.postback.data);
        if (params.get('action') === 'calc') {
          const prepHours = parseFloat(params.get('prep')) || 2.5;
          const base64Data = params.get('data');
          const flightsJson = Buffer.from(base64Data, 'base64').toString('utf8');
          const flights = JSON.parse(flightsJson);

          const flexMessage = buildRosterFlexCarousel(flights, prepHours);
          await replyLineMessage(replyToken, flexMessage);
          continue;
        }
      }

      // 3. User sends TEXT message (Welcome & Guidance)
      if (event.type === 'message' && event.message.type === 'text') {
        await replyLineMessage(replyToken, {
          type: 'text',
          text: '✈️ ยินดีต้อนรับสู่ Flight Duty & Rest Planner!\n\n📸 เพียงแคปหน้าจอ Roster (ตารางบิน) แล้วส่งรูปเข้ามาในแชทนี้ได้เลยครับ\n\nAI จะสแกนเวลาเริ่มงานและสรุปเวลาตื่นนอนพร้อมตารางพักผ่อนให้ทันทีครับ 🛌✨',
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
