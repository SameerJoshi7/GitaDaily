import webpush from 'web-push';
import { User } from '../models/User.js';
import { sendDailyShlokaEmail } from '../utils/mailer.js';
import { getGeminiReflection } from './ai.service.js';
import { getDailyShloka } from './data.service.js';

const ARTWORKS = [
  'https://raw.githubusercontent.com/SameerJoshi7/GitaDaily/main/frontend/public/images/chariot.jpg',
  'https://raw.githubusercontent.com/SameerJoshi7/GitaDaily/main/frontend/public/images/discourse.jpg',
  'https://raw.githubusercontent.com/SameerJoshi7/GitaDaily/main/frontend/public/images/vishwaroopa.jpg'
];

export function getArtworkForShloka(shloka) {
  if (!shloka || typeof shloka.chapter === 'undefined' || typeof shloka.verse === 'undefined') {
    return ARTWORKS[0];
  }
  return ARTWORKS[(shloka.chapter + shloka.verse) % ARTWORKS.length];
}

// Format message helper
export function formatShlokaMessage(shloka, reflection, language = 'english') {
  const lang = (language || 'english').toLowerCase();

  // Custom headers based on language selection
  let title = '🦚 *Krishna Bodha: Daily Wisdom & AI Reflection* 🦚';
  let chLabel = 'Chapter';
  let vLabel = 'Verse';
  let sansLabel = 'Sanskrit';
  let translitLabel = 'Transliteration';
  let transLabel = 'Translation';
  let aiLabel = 'AI Reflection';
  let mindLabel = 'Mindfulness Practice';
  let artLabel = 'Sacred Art';
  let footer = 'Have a blessed and focused day! 🌸';

  if (lang === 'hindi') {
    title = '🦚 *कृष्णबोध: दैनिक ज्ञान और एआई चिंतन* 🦚';
    chLabel = 'अध्याय';
    vLabel = 'श्लोक';
    transLabel = 'अनुवाद';
    aiLabel = 'एआई चिंतन';
    mindLabel = 'आज का अभ्यास';
    footer = 'आपका दिन शुभ और मंगलमय हो! 🌸';
  } else if (lang === 'telugu') {
    title = '🦚 *కృష్ణబోధః: దినసరి జ్ఞానం మరియు ఎఐ విశ్లేషణ* 🦚';
    chLabel = 'అధ్యాయం';
    vLabel = 'శ్లోకం';
    transLabel = 'అనువాదం';
    aiLabel = 'ఎఐ విశ్లేషణ';
    mindLabel = 'నేటి సాధన';
    footer = 'ఈ రోజు మీకు ప్రశాంతంగా మరియు విజయవంతంగా సాగాలని కోరుకుంటున్నాము! 🌸';
  } else if (lang === 'kannada') {
    title = '🦚 *ಕೃಷ್ಣಬೋಧಃ: ದಿನನಿತ್ಯದ ಜ್ಞಾನ ಮತ್ತು ಎಐ ವಿಶ್ಲೇಷಣೆ* 🦚';
    chLabel = 'ಅಧ್ಯಾಯ';
    vLabel = 'ಶ್ಲೋಕ';
    transLabel = 'ಅನುವಾದ';
    aiLabel = 'ಎಐ ವಿಶ್ಲೇಷಣೆ';
    mindLabel = 'ಇಂದಿನ ಅಭ್ಯಾಸ';
    footer = 'ನಿಮ್ಮ ದಿನವು ಶುಭವಾಗಲಿ ಮತ್ತು ಯಶಸ್ವಿಯಾಗಲಿ! 🌸';
  }

  const artLink = getArtworkForShloka(shloka);

  return `${title}

*${chLabel} ${shloka.chapter}, ${vLabel} ${shloka.verse}*

_Sanskrit:_
${shloka.sanskrit}

_Transliteration:_
${reflection.translatedTransliteration || shloka.transliteration}

_${transLabel}:_
${reflection.translatedTranslation || shloka.translation}

✨ *${aiLabel}:*
${reflection.modernReflection}

🧘 *${mindLabel}:*
${reflection.mindfulnessTip}

🎨 *Sacred Art:* ${artLink}

Made with ❤️ by Krishna Bodha Team

${footer}`;
}

// Broadcast task
export async function broadcastDailyShloka() {
  const shloka = getDailyShloka();
  if (!shloka) return;

  let sentCount = 0;
  const reflectionCache = {};

  try {
    const users = await User.find({});
    
    // Pre-cache reflections for all unique languages to avoid sequential AI calls during broadcast
    const uniqueLanguages = [...new Set(users.map(u => u.lang || 'english'))];
    for (const lang of uniqueLanguages) {
      if (!reflectionCache[lang]) {
        reflectionCache[lang] = await getGeminiReflection(shloka, lang);
      }
    }

    const BATCH_SIZE = 15;
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      
      await Promise.allSettled(batch.map(async (user) => {
        if (!user.email) return;
        
        const language = user.lang || 'english';
        const reflection = reflectionCache[language];
        let sentToThisUser = false;

        // 1. Email Channel
        if (user.pref === 'email' || user.pref === 'both' || user.pref === 'all') {
          try {
            await sendDailyShlokaEmail(user.email, shloka, reflection, language);
            sentToThisUser = true;
          } catch (emailErr) {
            console.error(`[Email] Failed for ${user.email}:`, emailErr.message);
          }
        }

        // 2. Web Push Channel
        if ((user.pref === 'push' || user.pref === 'all') && user.pushSubscription) {
          try {
            const payload = JSON.stringify({
              title: `🦚 Gita Ch ${shloka.chapter}, Verse ${shloka.verse}`,
              body: reflection.translatedTranslation || shloka.translation,
              image: getArtworkForShloka(shloka),
              url: `/#/chapter/${shloka.chapter}/verse/${shloka.verse}`
            });
            await webpush.sendNotification(user.pushSubscription, payload);
            sentToThisUser = true;
          } catch (err) {
            console.error(`[WebPush] Failed for ${user.email}:`, err.message);
          }
        }

        if (sentToThisUser) {
          sentCount++;
          try {
            user.lastNotifiedAt = new Date();
            await user.save();
          } catch (e) {
            console.error(`[Cron] Failed to save lastNotifiedAt for ${user.email}:`, e);
          }
        }
      }));
    }
    
    console.log(`[Cron] Broadcast finished. Sent to ${sentCount} user(s).`);
  } catch (err) {
    console.error('[Cron] Error fetching users from MongoDB:', err);
  }
}
