// Test scan endpoint to verify Gemini 2.5 Flash on real image
import fs from 'fs';
import path from 'path';
import { scanRosterWithGemini } from './lib/geminiVision.js';

export default async function handler(req, res) {
  try {
    const imgPath = path.join(process.cwd(), 'ตย', 'S__144809990_0.jpg');
    const buffer = fs.readFileSync(imgPath);

    const start = Date.now();
    const result = await scanRosterWithGemini(buffer, 'image/jpeg');
    const duration = (Date.now() - start) / 1000;

    return res.status(200).json({
      durationSeconds: duration,
      result: result
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
