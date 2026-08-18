// Robust Multi-model Gemini Vision OCR Service for Airline Roster Screenshots

export async function scanRosterWithGemini(imageBuffer, mimeType = 'image/jpeg') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Missing GEMINI_API_KEY environment variable');
    return { success: false, error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Vercel' };
  }

  const base64Image = imageBuffer.toString('base64');

  const prompt = `You are a world-class aviation schedule & crew roster extraction AI.
Analyze this airline crew roster screenshot (e.g. from AIMS e-Crew, CrewPad, NetLine, FLiCA, Sabre, or airline mobile app).

The image could be:
A) "Duty Detail" screen (e.g. Duty RERRP2LD-1, On 00:00 L, Off 23:59 L, Pairing details)
B) "Duties List" screen (e.g. rows with dates like Aug 19, Aug 24, Aug 25 and pairings like 114-1: BKK-CNX, YNT, AL-1, SBM-1)
C) "Month" Calendar view with duty events
D) Flight plan / briefing sheet

INSTRUCTIONS:
Extract ALL schedule events found in the image.
For each event, extract:
1. "date": Date string formatted cleanly (e.g. "19 Aug 2026", "24 Aug (Mo)", "2026-08-19")
2. "pairing": Full duty code / flight route (e.g. "114-1: BKK-CNX-BKK-URT-BKK", "RERRP2LD-1: BKKBKK", "AL-1: BKKBKK", "SBM-1: BKKBKK", "TKIX1-1: BKK-TPE-KIX")
3. "reportTime": 24-hour report/sign-on/on-duty time (HH:MM format, e.g. "06:05", "14:40", "08:00"). If it is an off day / rest / leave (like AL, REST, RERRP with 00:00-23:59), set reportTime to null.
4. "releaseTime": 24-hour release/off-duty time (HH:MM format, e.g. "15:45", "23:59", "12:00")
5. "dutyType": Classify accurately into:
   - "flight" (active flight duty, e.g. 114-1, TKIX1-1, 106-1, MFM-1)
   - "standby" (on-call standby, e.g. SBM-1, SBD-1, SBN-1)
   - "leave" (vacation / leave, e.g. AL-1, SL-1)
   - "rest" (day off / required rest period, e.g. RERRP2LD-1, REST-1, OFF, DO)

ALWAYS respond with valid JSON matching this schema:
{
  "hasRoster": true,
  "flights": [
    {
      "date": "19 Aug 2026",
      "pairing": "RERRP2LD-1: BKKBKK",
      "reportTime": null,
      "releaseTime": "23:59",
      "dutyType": "rest"
    },
    {
      "date": "24 Aug (Mo)",
      "pairing": "114-1: BKK-CNX-BKK-URT-BKK",
      "reportTime": "06:05",
      "releaseTime": "15:45",
      "dutyType": "flight"
    }
  ]
}

If the image is completely unrelated (e.g. food, pet, landscape with no text), respond with:
{
  "hasRoster": false,
  "flights": []
}`;

  // Candidate models across v1beta and v1
  const modelCandidates = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-2.0-flash-exp',
    'gemini-1.5-pro',
    'gemini-1.5-pro-latest'
  ];

  let lastError = null;

  for (const model of modelCandidates) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    };

    try {
      console.log(`Trying Gemini model: ${model} ...`);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`Model ${model} returned ${res.status}:`, errText);
        lastError = `Model ${model} (${res.status}): ${errText}`;
        continue; // Try next model
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        lastError = `Model ${model} returned empty content`;
        continue;
      }

      const parsed = JSON.parse(rawText);
      console.log(`✅ Success with Gemini model: ${model}`, JSON.stringify(parsed));
      return { success: true, modelUsed: model, data: parsed };
    } catch (err) {
      console.warn(`Exception with model ${model}:`, err.message);
      lastError = err.message;
    }
  }

  return { success: false, error: lastError || 'All Gemini model candidates failed' };
}
