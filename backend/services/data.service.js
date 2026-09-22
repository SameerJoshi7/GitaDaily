import fs from 'fs';
import { GITA_DATA_PATH } from '../utils/file.js';

let gitaData = [];
try {
  gitaData = JSON.parse(fs.readFileSync(GITA_DATA_PATH, 'utf-8'));
} catch (e) {
  console.error('[System] Error loading Gita Data:', e.message);
  console.log('[System] Failed to load local gita_data.json. API requests for specific shlokas will be dynamically fetched.');
}

export const getGitaData = () => gitaData;

export const getDailyShloka = () => {
  if (gitaData.length === 0) return null;
  const startOfYear = new Date(new Date().getFullYear(), 0, 0);
  const diff = new Date() - startOfYear;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const index = dayOfYear % gitaData.length;
  return gitaData[index];
};

export const getShlokaByVerse = (chapter, verse) => {
  return gitaData.find(s => s.chapter === chapter && s.verse === verse);
};

export const getChapters = () => {
  return [
    { chapterNumber: 1, versesCount: 47, theme: "Arjuna's Dilemma (Arjuna Vishada Yoga)", localThemes: { hindi: "अर्जुनविषादयोग (अर्जुन की दुविधा)", telugu: "అర్జునవిషాద యోగం (అర్జునుని దుఃఖము)", kannada: "ಅರ್ಜುನವಿಷಾದ ಯೋಗ (ಅರ್ಜುನನ ದುಃಖ)" } },
    { chapterNumber: 2, versesCount: 72, theme: "Transcendental Knowledge (Sankhya Yoga)", localThemes: { hindi: "सांख्ययोग (ज्ञान का मार्ग)", telugu: "సాంఖ్య యోగం (జ్ఞాన మార్గము)", kannada: "ಸಾಂಖ್ಯ ಯೋಗ (ಜ್ಞಾನ ಮಾರ್ಗ)" } },
    { chapterNumber: 3, versesCount: 43, theme: "Path of Action (Karma Yoga)", localThemes: { hindi: "कर्मयोग (कर्म का मार्ग)", telugu: "కర్మ యోగం (కర్మ మార్గము)", kannada: "ಕರ್ಮ ಯೋಗ (ಕರ್ಮ ಮಾರ್ಗ)" } },
    { chapterNumber: 4, versesCount: 42, theme: "Path of Knowledge & Action (Jnana Karma Sanyasa Yoga)", localThemes: { hindi: "ज्ञानकर्मसंन्यासयोग (ज्ञान और कर्म)", telugu: "జ్ఞానకర్మసన్యాస యోగం (జ్ఞానము మరియు కర్మ)", kannada: "ಜ್ಞಾನಕರ್ಮಸನ್ಯಾಸ ಯೋಗ (ಜ್ಞಾನ ಮತ್ತು ಕರ್ಮ)" } },
    { chapterNumber: 5, versesCount: 29, theme: "Path of Renunciation (Karma Sanyasa Yoga)", localThemes: { hindi: "कर्मसंन्यासयोग (कर्मों का संन्यास)", telugu: "కర్మసన్యాస యోగం (కర్మ సన్యాసము)", kannada: "ಕರ್ಮಸನ್ಯಾಸ ಯೋಗ (ಕರ್ಮ ಸನ್ಯಾಸ)" } },
    { chapterNumber: 6, versesCount: 47, theme: "Path of Meditation (Dhyana Yoga)", localThemes: { hindi: "आत्मसंयमयोग (ध्यान और संयम)", telugu: "ఆత్మసంయమ యోగం (ధ్యాన యోగము)", kannada: "ಆತ್ಮಸಂಯಮ ಯೋಗ (ಧ್ಯಾನ ಯೋಗ)" } },
    { chapterNumber: 7, versesCount: 30, theme: "Knowledge of the Ultimate (Jnana Vijnana Yoga)", localThemes: { hindi: "ज्ञानविज्ञानयोग (परम सत्य का ज्ञान)", telugu: "జ్ఞానవిజ్ఞాన యోగం (పరమాత్మ జ్ఞానము)", kannada: "ಜ್ಞಾನವಿಜ್ಞಾನ ಯೋಗ (ಪರಮಾತ್ಮ ಜ್ಞಾನ)" } },
    { chapterNumber: 8, versesCount: 28, theme: "Path of the Eternal (Akshara Brahma Yoga)", localThemes: { hindi: "अक्षरब्रह्मयोग (अविनाशी ब्रह्म)", telugu: "అక్షరబ్రహ్మ యోగం (అక్షర పరబ్రహ్మ యోగము)", kannada: "ಅಕ್ಷರಬ್ರಹ್ಮ ಯೋಗ (ಅಕ್ಷರ ಪರಬ್ರಹ್ಮ ಯೋಗ)" } },
    { chapterNumber: 9, versesCount: 34, theme: "The King of Secrets (Raja Vidya Raja Guhya Yoga)", localThemes: { hindi: "राजविद्याराजगुह्ययोग (परम गुह्य ज्ञान)", telugu: "రాజవిద్యారాజగుహ్య యోగం (రాజవిద్య యోగము)", kannada: "ರಾಜವಿದ್ಯಾರಾಜಗುಹ್ಯ ಯೋಗ (ರಾಜವಿದ್ಯ ಯೋಗ)" } },
    { chapterNumber: 10, versesCount: 42, theme: "Infinite Splendors (Vibhuti Yoga)", localThemes: { hindi: "विभूतियोग (दिव्य विभूतियाँ)", telugu: "విభూతి యోగం (దివ్య విభూతులు)", kannada: "ವಿಭೂತಿ ಯೋಗ (ವಿವಿದ್ ವಿಭೂತಿಗಳು)" } },
    { chapterNumber: 11, versesCount: 55, theme: "The Vision of the Cosmic Form (Viswarupa Darshana Yoga)", localThemes: { hindi: "विश्वरूपदर्शनयोग (विश्वरूप दर्शन)", telugu: "విశ్వరూపదర్శన యోగం (విశ్వరూప దర్శనము)", kannada: "ವಿಶ್ವರೂಪದರ್ಶನ ಯೋಗ (ವಿಶ್ವರೂಪ ದರ್ಶನ)" } },
    { chapterNumber: 12, versesCount: 20, theme: "Path of Devotion (Bhakti Yoga)", localThemes: { hindi: "भक्तियोग (भक्ति मार्ग)", telugu: "భక్తి యోగం (భక్తి మార్గము)", kannada: "ಭಕ್ತಿ ಯೋಗ (ಭಕ್ತಿ ಮಾರ್ಗ)" } },
    { chapterNumber: 13, versesCount: 35, theme: "The Field & Knower of the Field (Kshetra Kshetrajna Vibhaga Yoga)", localThemes: { hindi: "क्षेत्रक्षेत्रज्ञविभागयोग (क्षेत्र और क्षेत्रज्ञ)", telugu: "క్షేత్రక్షేత్రజ్ఞవిభాగ యోగం (క్షేత్ర క్షేత్రజ్ఞ విభాగము)", kannada: "ಕ್ಷೇತ್ರಕ್ಷೇತ್ರಜ್ಞವಿಭಾಗ ಯೋಗ (ಕ್ಷೇತ್ರ ಕ್ಷೇತ್ರಜ್ಞ ವಿಭಾಗ)" } },
    { chapterNumber: 14, versesCount: 27, theme: "The Three Modes of Nature (Gunatraya Vibhaga Yoga)", localThemes: { hindi: "गुणत्रयविभागयोग (प्रकृति के तीन गुण)", telugu: "గుణత్రయవిభాగ యోగం (త్రిగుణ విభాగము)", kannada: "ಗುಣತ್ರಯವಿಭಾಗ ಯೋಗ (ತ್ರಿಗುಣ ವಿಭಾಗ)" } },
    { chapterNumber: 15, versesCount: 20, theme: "The Supreme Person (Purushottama Yoga)", localThemes: { hindi: "पुरुषोत्तमयोग (परम पुरुष)", telugu: "పురుషోత్తమ యోగం (పురుషోత్తమ ప్రాప్తి)", kannada: "ಪುರುಷೋತ್ತಮ ಯೋಗ (ಪುರುಷೋತ್ತಮ ಪ್ರಾಪ್ತಿ)" } },
    { chapterNumber: 16, versesCount: 24, theme: "Divine & Demoniac Natures (Daivasura Sampad Vibhaga Yoga)", localThemes: { hindi: "दैवासुरसम्पद्विभागयोग (दैवी और आसुरी स्वभाव)", telugu: "దైవాసురసంపద్విభాగ యోగం (దైవాసుర సంపద్విभागము)", kannada: "ದೈವಾಸುರಸಂಪದ್ವಿಭಾಗ ಯೋಗ (ದೈವಾಸುರ ಸಂಪದ್ವಿಭಾಗ)" } },
    { chapterNumber: 17, versesCount: 28, theme: "The Divisions of Faith (Shraddhatraya Vibhaga Yoga)", localThemes: { hindi: "श्रद्धात्रयविभागयोग (श्रद्धा के तीन प्रकार)", telugu: "శ్రద్ధాత్రయవిభాగ యోగం (శ్రద్ధాత్రయ విభాగము)", kannada: "ಶ್ರದ್ಧಾತ್ರಯವಿಭಾಗ ಯೋಗ (ಶ್ರದ್ಧಾತ್ರಯ ವಿಭಾಗ)" } },
    { chapterNumber: 18, versesCount: 78, theme: "Final Liberation & Renunciation (Moksha Sanyasa Yoga)", localThemes: { hindi: "मोक्षसंन्यासयोग (परम मोक्ष)", telugu: "మోక్షసన్యాస యోగం (మోక్ష సన్యాసము)", kannada: "ಮೋಕ್ಷಸನ್ಯಾಸ ಯೋಗ (ಮೋಕ್ಷ ಸನ್ಯಾಸ)" } }
  ];
};
