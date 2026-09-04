const fs = require('fs');
const path = require('path');

const pdfPath = 'C:/Users/Gamehard/.gemini/antigravity/brain/f5acc8a3-9cf3-4903-9051-a8efd8059e3c/.user_uploaded/media_1788490478398.pdf';
const outDir = 'C:/Users/Gamehard/Desktop/Prueba de web/negocio/pasteleria/assets/slides';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const data = fs.readFileSync(pdfPath);
console.log('PDF size:', data.length);

// Extract JPEG streams: /DCTDecode
let count = 0;
let pos = 0;

while (pos < data.length) {
  // Look for JPEG SOI marker (0xFF, 0xD8, 0xFF)
  const soi = data.indexOf(Buffer.from([0xFF, 0xD8, 0xFF]), pos);
  if (soi === -1) break;

  // Look for EOI marker (0xFF, 0xD9)
  const eoi = data.indexOf(Buffer.from([0xFF, 0xD9]), soi + 2);
  if (eoi === -1) break;

  const jpegData = data.subarray(soi, eoi + 2);
  count++;
  const filename = `slide_${count.toString().padStart(2, '0')}.jpg`;
  fs.writeFileSync(path.join(outDir, filename), jpegData);
  console.log(`Saved ${filename}, size: ${jpegData.length} bytes`);

  pos = eoi + 2;
}

console.log(`Extracted ${count} images total.`);
