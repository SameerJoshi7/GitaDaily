import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://krishnabodha.in';
const SITEMAP_PATH = path.join(__dirname, '../frontend/public/sitemap.xml');

// Load Gita Data
const dataPath = path.join(__dirname, 'gita_data.json');
const gitaDataRaw = fs.readFileSync(dataPath, 'utf8');
const gitaData = JSON.parse(gitaDataRaw);

const today = new Date().toISOString().split('T')[0];

const staticRoutes = [
  '/',
  '/dailyinsights',
  '/browse',
  '/searchinsights',
  '/bookmarks',
  '/guidance',
  '/about'
];

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

// Add static routes
for (const route of staticRoutes) {
  xml += `  <url>
    <loc>${BASE_URL}${route}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route === '/' || route === '/dailyinsights' ? 'daily' : 'weekly'}</changefreq>
    <priority>${route === '/' || route === '/dailyinsights' ? '1.0' : '0.8'}</priority>
  </url>\n`;
}

// Add dynamic chapter and verse routes
// App.tsx uses /chapter/:chapter/verse/:verse for individual verses
// and /browse/chapter/:chapter/verse/:verse for browsing.
// In the current routing setup, it seems the standalone verse view is /chapter/:chapter/verse/:verse
// Let's add them for all chapters and verses.

for (const chapter of gitaData) {
  const chapterNum = chapter.chapter;
  
  // Chapter root page (if it exists, we route through /browse typically)
  xml += `  <url>
    <loc>${BASE_URL}/browse/chapter/${chapterNum}/verse/1</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>\n`;

  const verses = Object.keys(chapter.verses || {});
  for (const verseNum of verses) {
    // Top-level verse view route as defined in App.tsx line 227
    xml += `  <url>
    <loc>${BASE_URL}/chapter/${chapterNum}/verse/${verseNum}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
    
    // Nested browse view route (since BrowseTab also manages state, though usually same content)
    xml += `  <url>
    <loc>${BASE_URL}/browse/chapter/${chapterNum}/verse/${verseNum}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
  }
}

xml += `</urlset>`;

fs.writeFileSync(SITEMAP_PATH, xml);
console.log(`✅ Sitemap successfully generated at ${SITEMAP_PATH}`);
console.log(`Total URLs: ${staticRoutes.length + gitaData.length + gitaData.reduce((acc, ch) => acc + Object.keys(ch.verses || {}).length * 2, 0)}`);
