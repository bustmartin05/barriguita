const fs = require('fs');
const path = require('path');

function extractJpegs(pdfPath, outDir) {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const data = fs.readFileSync(pdfPath);
  console.log(`Extracting from ${path.basename(pdfPath)} (size: ${data.length}) to ${outDir}`);

  let count = 0;
  let pos = 0;

  while (pos < data.length) {
    const soi = data.indexOf(Buffer.from([0xFF, 0xD8, 0xFF]), pos);
    if (soi === -1) break;

    const eoi = data.indexOf(Buffer.from([0xFF, 0xD9]), soi + 2);
    if (eoi === -1) break;

    const jpegData = data.subarray(soi, eoi + 2);
    count++;
    const filename = `bg_${count.toString().padStart(2, '0')}.jpg`;
    fs.writeFileSync(path.join(outDir, filename), jpegData);
    console.log(`  Saved ${filename}, size: ${jpegData.length}`);

    pos = eoi + 2;
  }
  console.log(`Extracted ${count} images total.`);
}

const uploadsDir = 'C:/Users/Gamehard/.gemini/antigravity/brain/f5acc8a3-9cf3-4903-9051-a8efd8059e3c/.user_uploaded';
const pdf1 = path.join(uploadsDir, 'media_1788529978236.pdf');
const pdf2 = path.join(uploadsDir, 'media_1788529978895.pdf');

extractJpegs(pdf1, 'C:/Users/Gamehard/Desktop/Prueba de web/negocio/pasteleria/assets/backgrounds/set1');
extractJpegs(pdf2, 'C:/Users/Gamehard/Desktop/Prueba de web/negocio/pasteleria/assets/backgrounds/set2');
