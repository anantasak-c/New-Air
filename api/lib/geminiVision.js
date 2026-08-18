// Gemini Flash Vision OCR Service for Airline Roster Screenshots

export async function scanRosterWithGemini(imageBuffer, mimeType = 'image/jpeg') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Missing GEMINI_API_KEY environment variable');
    return { success: false, error: 'GEMINI_API_KEY not configured' };
  }

  const base64Image = imageBuffer.toString('base64');

  const prompt = `You are an expert aviation schedule parser. Analyze this airline crew roster screenshot (e.g. from AIMS, CrewPad, NetLine, FLiCA).

Extract all duty items / flight pairings shown in the image.
For each item, identify:
1. "date": Date string (e.g. "24 Aug (Mo)" or "2026-08-24")
2. "pairing": Pairing / Flight Code (e.g. "114-1: BKK-CNX-BKK-URT-BKK", "TKIX1-1: BKK-TPE-KIX", "AL-1: BKKBKK", "SBM-1: BKKBKK")
3. "reportTime": 24-hour report/on-duty time (HH:MM, e.g. "06:05", "14:40", "00:25"). If it is an off day/leave (AL, REST), reportTime should be null.
4. "releaseTime": 24-hour release/off-duty time (HH:MM, e.g. "15:45", "23:59")
5. "dutyType": One of ["flight", "standby", "leave", "rest"] (e.g. AL is leave, REST is rest, SBM/SBD is standby, others are flight)

Respond ONLY with a valid JSON object matching this exact schema:
{
  "hasRoster": true,
  "flights": [
    {
      "date": "Aug 24 (Mo)",
      "pairing": "114-1: BKK-CNX-BKK-URT-BKK",
      "reportTime": "06:05",
      "releaseTime": "15:45",
      "dutyType": "flight"
    }
  ]
}

If the image is NOT an airline roster or contains no readable schedule duties, respond with:
{
  "hasRoster": false,
  "flights": []
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Gemini API Error:', res.status, errText);
      return { success: false, error: `Gemini API returned ${res.status}` };
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return { success: false, error: 'Empty response from Gemini' };
    }

    const parsed = JSON.parse(rawText);
    return { success: true, data: parsed };
  } catch (err) {
    console.error('Gemini Vision OCR Exception:', err);
    return { success: false, error: err.message };
  }
}
