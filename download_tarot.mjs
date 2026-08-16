import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.join(__dirname, 'public', 'assets', 'tarot');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const cards = {
  'ar00.jpg': 'https://upload.wikimedia.org/wikipedia/commons/9/90/RWS_Tarot_00_Fool.jpg',
  'ar01.jpg': 'https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg',
  'ar02.jpg': 'https://upload.wikimedia.org/wikipedia/commons/8/88/RWS_Tarot_02_High_Priestess.jpg',
  'ar03.jpg': 'https://upload.wikimedia.org/wikipedia/commons/d/d2/RWS_Tarot_03_Empress.jpg',
  'ar04.jpg': 'https://upload.wikimedia.org/wikipedia/commons/c/c3/RWS_Tarot_04_Emperor.jpg',
  'ar06.jpg': 'https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_06_Lovers.jpg',
  'ar07.jpg': 'https://upload.wikimedia.org/wikipedia/commons/9/9b/RWS_Tarot_07_Chariot.jpg',
  'ar08.jpg': 'https://upload.wikimedia.org/wikipedia/commons/f/f5/RWS_Tarot_08_Strength.jpg',
  'ar10.jpg': 'https://upload.wikimedia.org/wikipedia/commons/3/3c/RWS_Tarot_10_Wheel_of_Fortune.jpg',
  'ar17.jpg': 'https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_17_Star.jpg',
  'ar19.jpg': 'https://upload.wikimedia.org/wikipedia/commons/1/17/RWS_Tarot_19_Sun.jpg',
  'ar21.jpg': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/RWS_Tarot_21_World.jpg',
};

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function download(name, url) {
  const dest = path.join(targetDir, name);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    console.log(`- ${name} (already exists)`);
    return;
  }

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    const options = {
      headers: {
        'User-Agent': 'FlightRestApp/1.0 (https://new-air-phi.vercel.app; anantasak.dev@gmail.com)'
      }
    };

    https.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, options, (res2) => {
          res2.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        }).on('error', reject);
      } else if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      } else {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        reject(new Error(`Status ${res.statusCode} for ${url}`));
      }
    }).on('error', reject);
  });
}

async function run() {
  console.log('Downloading Tarot cards with custom User-Agent and delay ...');
  for (const [name, url] of Object.entries(cards)) {
    let retries = 3;
    while (retries > 0) {
      try {
        await download(name, url);
        console.log(`✓ ${name}`);
        await sleep(1500); // 1.5s delay between requests
        break;
      } catch (e) {
        console.error(`Attempt failed ${name} (${e.message}), retrying...`);
        retries--;
        await sleep(3000);
      }
    }
  }
  console.log('All downloads completed!');
}

run();
