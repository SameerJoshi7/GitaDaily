import sharp from 'sharp';

async function processIcon() {
  const bg = { r: 5, g: 5, b: 8, alpha: 1 }; // #050508
  await sharp('public/flute-icon.png')
    .flatten({ background: bg })
    .toFile('public/flute-icon-maskable.png');
  console.log('Created flute-icon-maskable.png');
}

processIcon();
