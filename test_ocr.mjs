import fs from 'fs';
import path from 'path';

// Let's test with the images in 'ตย/'
const imagePath = path.join(process.cwd(), 'ตย', 'S__144809990_0.jpg');
const buffer = fs.readFileSync(imagePath);

console.log('Testing image size:', buffer.length, 'bytes');

// Let's test Gemini 2.0 Flash vs 1.5 Flash
console.log('Image exists and is ready for test.');
