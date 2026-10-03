import puppeteer from 'puppeteer';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const generateHTML = (shloka, translation, language, backgroundImage, reflectionText, tipText) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Mukta:wght@400;700&display=swap');
    body {
      margin: 0;
      padding: 0;
      width: 1080px;
      height: 1080px;
      font-family: 'Mukta', sans-serif;
      background-image: url('${backgroundImage}');
      background-size: cover;
      background-position: center;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }
    .overlay {
      background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%);
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
    }
    .content {
      z-index: 2;
      padding: 60px;
      color: white;
    }
    .chapter {
      font-size: 32px;
      color: #FCD34D;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .sanskrit {
      font-size: 48px;
      font-weight: bold;
      margin-bottom: 30px;
      line-height: 1.4;
    }
    .translation {
      font-size: 36px;
      line-height: 1.5;
      opacity: 0.9;
      margin-bottom: 30px;
    }
    .reflection {
      font-size: 28px;
      line-height: 1.5;
      color: #E2E8F0;
      margin-bottom: 20px;
      border-left: 4px solid #FCD34D;
      padding-left: 20px;
    }
    .tip {
      font-size: 24px;
      line-height: 1.5;
      color: #FCD34D;
      font-style: italic;
    }
    .watermark {
      position: absolute;
      top: 40px;
      right: 40px;
      font-size: 24px;
      font-weight: bold;
      color: rgba(255,255,255,0.7);
      z-index: 2;
    }
  </style>
</head>
<body>
  <div class="overlay"></div>
  <div class="watermark">Krishna Bodha Daily</div>
  <div class="content">
    <div class="chapter">Chapter ${shloka.chapter}, Verse ${shloka.verse} (${language.toUpperCase()})</div>
    <div class="sanskrit">${shloka.sanskrit.replace(/\n/g, '<br/>')}</div>
    <div class="translation">${translation.replace(/\n/g, '<br/>')}</div>
    ${reflectionText ? `<div class="reflection"><strong>Insight:</strong> ${reflectionText}</div>` : ''}
    ${tipText ? `<div class="tip">💡 ${tipText}</div>` : ''}
  </div>
</body>
</html>
`;

export async function generateAndUploadImages(shloka, reflectionCache, bgImage) {
  const instagramLangs = ['english', 'hindi', 'kannada', 'telugu'];
  const uploadedUrls = {};

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn('[Image Service] Cloudinary credentials not set. Skipping image generation.');
    return uploadedUrls;
  }

  const browser = await puppeteer.launch({ 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  try {
    for (const lang of instagramLangs) {
      const translation = reflectionCache[lang]?.translatedTranslation || shloka.translation;
      const reflection = reflectionCache[lang]?.modernReflection || '';
      const tip = reflectionCache[lang]?.mindfulnessTip || '';
      
      const html = generateHTML(shloka, translation, lang, bgImage, reflection, tip);
      
      const page = await browser.newPage();
      await page.setViewport({ width: 1080, height: 1080 });
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 90 });
      await page.close();

      // Upload to Cloudinary
      const uploadPromise = new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'krishnabodha_daily' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        stream.end(screenshotBuffer);
      });

      const url = await uploadPromise;
      uploadedUrls[lang] = url;
      console.log(`[Image Service] Uploaded image for ${lang}: ${url}`);
    }
  } catch (err) {
    console.error('[Image Service] Error generating/uploading images:', err);
  } finally {
    await browser.close();
  }

  return uploadedUrls;
}
