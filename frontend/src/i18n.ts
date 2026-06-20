/**
 * GitaDaily – Internationalization (i18n) Dictionary
 * Supported languages: English, Hindi, Telugu, Kannada
 *
 * Usage:
 *   import { t } from '../i18n';
 *   const T = t(lang);
 *   <h2>{T.nav.dailyInsight}</h2>
 */

export interface Translations {
  // ── Navigation ─────────────────────────────────────────────────────────────
  nav: {
    dailyInsight: string;
    browseChapters: string;
    searchTopics: string;
    myBookmarks: string;
    seekGuidance: string;
    aboutKrishnaBodha: string;
    newBadge: string;
  };

  // ── Auth / Landing ──────────────────────────────────────────────────────────
  auth: {
    heroSubtitle: string;
    heroDescription: string;
    signIn: string;
    signUp: string;
    emailLabel: string;
    signInEmailLabel: string;
    sendOtp: string;
    otpSentTo: string;
    enterOtp: string;
    verifyOtp: string;
    back: string;
    completeProfile: string;
    identityVerified: string;
    emailAddress: string;
    preferredLanguage: string;
    notificationPref: string;
    beginJourney: string;
    emailOnly: string;
    telegramOnly: string;
    webPushOnly: string;
    bothEmailTelegram: string;
    allChannels: string;
    telegramWarning: string;
    pushNote: string;
    madeWith: string;
    otpPlaceholder: string;
    emailPlaceholder: string;
  };

  // ── Daily Tab ───────────────────────────────────────────────────────────────
  daily: {
    pageTitle: string;
    pageSubtitle: string;
    challengeBannerTitle: string;
    challengeBannerDesc: string;
    seekSolutions: string;
    loadingReflection: string;
    noShloka: string;
  };

  // ── Shloka Card ─────────────────────────────────────────────────────────────
  card: {
    chapterVerse: (ch: number, v: number) => string;
    translationLabel: string;
    aiDeepUnderstanding: string;
    modernRelevance: string;
    emotionalWellbeing: string;
    careerFocus: string;
    mindfulPractice: string;
    removeBookmark: string;
    addBookmark: string;
  };

  // ── Browse Tab ──────────────────────────────────────────────────────────────
  browse: {
    pageTitle: string;
    pageSubtitle: string;
    chapter: string;
    verse: string;
  };

  // ── Search Tab ──────────────────────────────────────────────────────────────
  search: {
    pageTitle: string;
    pageSubtitle: string;
    searchPlaceholder: string;
    noResults: string;
    chapterVerse: (ch: number, v: number) => string;
  };

  // ── Bookmarks Tab ───────────────────────────────────────────────────────────
  bookmarks: {
    pageTitle: string;
    pageSubtitle: string;
    emptyState: string;
    removeBookmark: string;
    chapterVerse: (ch: number, v: number) => string;
  };

  // ── Guidance Tab ────────────────────────────────────────────────────────────
  guidance: {
    pageTitle: string;
    pageSubtitle: string;
    queryLabel: string;
    queryPlaceholder: string;
    seekButton: string;
    consultingGita: string;
    solutionFound: string;
    verseSelectedFor: string;
    aiCounselTitle: string;
    personalizedCounsel: string;
    mentalPeace: string;
    actionableStep: string;
  };

  // ── Sidebar Profile Widget ──────────────────────────────────────────────────
  sidebar: {
    subscribedAs: string;
    languagePrefs: string;
    editPreferences: string;
    language: string;
    notifications: string;
    save: string;
    cancel: string;
    connectTelegram: string;
    telegramUnavailable: (botUsername: string) => string;
    browserPushEnabled: string;
    enableBrowserPush: string;
    testSendInsight: string;
    signOut: string;
    developerDetails: string;
    developer: string;
    stack: string;
    links: string;
    madeWith: string;
    emailOnly: string;
    telegramOnly: string;
    webPushOnly: string;
    bothEmailTelegram: string;
    allChannels: string;
    prefsUpdated: string;
    guestSubscribeTitle: string;
    guestSubscribeDesc: string;
    subscribeButton: string;
    appLanguageLabel: string;
    guestWelcome: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ENGLISH
// ─────────────────────────────────────────────────────────────────────────────
const en: Translations = {
  nav: {
    dailyInsight: 'Daily Insight',
    browseChapters: 'Browse Chapters',
    searchTopics: 'Search Topics',
    myBookmarks: 'My Bookmarks',
    seekGuidance: 'Seek Guidance',
    aboutKrishnaBodha: 'About Krishna Bodha',
    newBadge: 'New',
  },
  auth: {
    heroSubtitle: 'Sacred Wisdom & AI Reflections',
    heroDescription:
      'Start your morning with ancient wisdom, or seek direct counsel for any life problem. Describe your challenge, and get instant, personalized AI reflections rooted in the eternal truths of the Bhagavad Gita.',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    emailLabel: 'Your Email Address',
    signInEmailLabel: 'Sign in with your Email',
    sendOtp: 'Send OTP',
    otpSentTo: 'OTP sent to',
    enterOtp: 'Enter 6-digit OTP',
    verifyOtp: 'Verify OTP',
    back: '← Back',
    completeProfile: 'Complete Your Profile',
    identityVerified: 'Identity verified! Set up your preferences.',
    emailAddress: 'Email Address',
    preferredLanguage: 'Preferred Language',
    notificationPref: 'Notification Preference',
    beginJourney: 'Begin Spiritual Journey',
    emailOnly: 'Email Only',
    telegramOnly: 'Telegram Only',
    webPushOnly: 'Web Push Only',
    bothEmailTelegram: 'Both Email & Telegram',
    allChannels: 'All Channels (Email, Telegram & Push)',
    telegramWarning:
      '⚠️ Note: Telegram Bot connection is temporarily unavailable due to service restrictions in India. Please use Email or Web Push instead.',
    pushNote:
      '🔔 Note: To receive push notifications, click "Enable Browser Notifications" on the settings sidebar once logged in.',
    madeWith: 'Made with ❤️ by',
    otpPlaceholder: '_ _ _ _ _ _',
    emailPlaceholder: 'email@example.com',
  },
  daily: {
    pageTitle: "Today's Wisdom",
    pageSubtitle: 'A daily dose of wisdom to ground your mind and actions.',
    challengeBannerTitle: 'Facing a specific challenge today?',
    challengeBannerDesc:
      'Type your problem or mood and let the Gita guide you with customized solutions.',
    seekSolutions: 'Seek Solutions',
    loadingReflection: 'Seeking AI Reflection...',
    noShloka: 'No Shloka active. Click Daily Insight above to fetch.',
  },
  card: {
    chapterVerse: (ch, v) => `Chapter ${ch}, Verse ${v}`,
    translationLabel: 'Translation',
    aiDeepUnderstanding: 'AI Deep Understanding',
    modernRelevance: 'Modern Relevance',
    emotionalWellbeing: 'Emotional Well-being',
    careerFocus: 'Career & Focus',
    mindfulPractice: 'Mindful Practice for Today',
    removeBookmark: 'Remove Bookmark',
    addBookmark: 'Bookmark Shloka',
  },
  browse: {
    pageTitle: 'Browse Gita Chapters',
    pageSubtitle: 'Explore the wisdom of the Bhagavad Gita by chapter and verse.',
    chapter: 'Chapter',
    verse: 'Verse',
  },
  search: {
    pageTitle: 'Search & Explore',
    pageSubtitle: 'Search by keyword or select a topic below to discover relevant guidance.',
    searchPlaceholder: 'Search keywords, chapter theme, translation content...',
    noResults: 'No verses match your query. Try searching for "duty", "focus", "mind", or chapter names.',
    chapterVerse: (ch, v) => `Chapter ${ch}, Verse ${v}`,
  },
  bookmarks: {
    pageTitle: 'My Bookmarks',
    pageSubtitle: 'Your saved verses for quick reflection and meditation.',
    emptyState: 'No bookmarked verses yet. Go to Daily Insight or Browse to bookmark verses that speak to you.',
    removeBookmark: 'Remove bookmark',
    chapterVerse: (ch, v) => `Chapter ${ch}, Verse ${v}`,
  },
  guidance: {
    pageTitle: 'Seek Divine Guidance',
    pageSubtitle:
      'Describe your challenge, mood, or question, and receive counsel inspired by the Bhagavad Gita.',
    queryLabel: 'What challenge, doubt, or emotion are you facing today?',
    queryPlaceholder:
      'E.g., I am feeling anxious about my career path, or I am struggling to control my anger...',
    seekButton: 'Seek Guidance',
    consultingGita: 'Consulting the Gita...',
    solutionFound: "Gita's Solution Found",
    verseSelectedFor: 'Verse selected for your guidance:',
    aiCounselTitle: 'Divine AI Counsel for your query',
    personalizedCounsel: '🎯 Personalized Counsel',
    mentalPeace: '🧘 Mental Peace & Emotional Well-being',
    actionableStep: '⚡ Your Actionable Step Today',
  },
  sidebar: {
    subscribedAs: 'Subscribed as:',
    languagePrefs: 'Language & Preferences:',
    editPreferences: 'Edit Preferences',
    language: 'Language',
    notifications: 'Notifications',
    save: 'Save',
    cancel: 'Cancel',
    connectTelegram: 'Connect Telegram Bot',
    telegramUnavailable: (bot) =>
      `⚠️ Telegram Bot (@${bot}) connection is temporarily unavailable as Telegram services and bot creation are currently restricted/banned in India.`,
    browserPushEnabled: '🔔 Browser Push Enabled',
    enableBrowserPush: 'Enable Browser Push',
    testSendInsight: 'Test Send Insight',
    signOut: 'Sign Out',
    developerDetails: 'Developer Details',
    developer: 'Developer',
    stack: 'Stack',
    links: 'Links',
    madeWith: 'Made with ❤️ by',
    emailOnly: 'Email Only',
    telegramOnly: 'Telegram Only',
    webPushOnly: 'Web Push',
    bothEmailTelegram: 'Email & Telegram',
    allChannels: 'All Channels',
    prefsUpdated: '✅ Preferences saved! App is now in your language.',
    guestSubscribeTitle: 'Subscribe to Daily Wisdom',
    guestSubscribeDesc: 'Receive daily morning shlokas via Email or Telegram.',
    subscribeButton: 'Subscribe',
    appLanguageLabel: 'App Language',
    guestWelcome: 'Welcome, Seeker',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HINDI (हिन्दी)
// ─────────────────────────────────────────────────────────────────────────────
const hi: Translations = {
  nav: {
    dailyInsight: 'दैनिक ज्ञान',
    browseChapters: 'अध्याय देखें',
    searchTopics: 'विषय खोजें',
    myBookmarks: 'मेरे बुकमार्क',
    seekGuidance: 'मार्गदर्शन लें',
    aboutKrishnaBodha: 'कृष्ण बोध के बारे में',
    newBadge: 'नया',
  },
  auth: {
    heroSubtitle: 'पवित्र ज्ञान और AI चिंतन',
    heroDescription:
      'अपनी सुबह की शुरुआत प्राचीन ज्ञान से करें, या किसी भी जीवन समस्या के लिए सीधा मार्गदर्शन लें। अपनी चुनौती बताएं और भगवद गीता के शाश्वत सत्य पर आधारित तत्काल, व्यक्तिगत AI चिंतन प्राप्त करें।',
    signIn: 'साइन इन करें',
    signUp: 'साइन अप करें',
    emailLabel: 'आपका ईमेल पता',
    signInEmailLabel: 'ईमेल से साइन इन करें',
    sendOtp: 'OTP भेजें',
    otpSentTo: 'OTP भेजा गया',
    enterOtp: '6 अंकों का OTP दर्ज करें',
    verifyOtp: 'OTP सत्यापित करें',
    back: '← वापस',
    completeProfile: 'अपनी प्रोफ़ाइल पूरी करें',
    identityVerified: 'पहचान सत्यापित! अपनी प्राथमिकताएं सेट करें।',
    emailAddress: 'ईमेल पता',
    preferredLanguage: 'पसंदीदा भाषा',
    notificationPref: 'सूचना प्राथमिकता',
    beginJourney: 'आध्यात्मिक यात्रा शुरू करें',
    emailOnly: 'केवल ईमेल',
    telegramOnly: 'केवल टेलीग्राम',
    webPushOnly: 'केवल वेब पुश',
    bothEmailTelegram: 'ईमेल और टेलीग्राम दोनों',
    allChannels: 'सभी चैनल (ईमेल, टेलीग्राम और पुश)',
    telegramWarning:
      '⚠️ नोट: भारत में सेवा प्रतिबंधों के कारण टेलीग्राम बॉट कनेक्शन अस्थायी रूप से अनुपलब्ध है। कृपया ईमेल या वेब पुश का उपयोग करें।',
    pushNote:
      '🔔 नोट: पुश सूचनाएं प्राप्त करने के लिए, लॉगिन के बाद सेटिंग्स में "ब्राउज़र सूचना सक्षम करें" पर क्लिक करें।',
    madeWith: '❤️ के साथ बनाया गया',
    otpPlaceholder: '_ _ _ _ _ _',
    emailPlaceholder: 'ईमेल@example.com',
  },
  daily: {
    pageTitle: 'आज का ज्ञान',
    pageSubtitle: 'आपके मन और कर्म को स्थिर करने के लिए प्रतिदिन का ज्ञान।',
    challengeBannerTitle: 'आज किसी विशेष चुनौती का सामना कर रहे हैं?',
    challengeBannerDesc: 'अपनी समस्या या भाव लिखें और गीता को अनुकूलित समाधान के साथ आपका मार्गदर्शन करने दें।',
    seekSolutions: 'समाधान खोजें',
    loadingReflection: 'AI चिंतन खोज रहे हैं...',
    noShloka: 'कोई श्लोक सक्रिय नहीं। लाने के लिए ऊपर दैनिक ज्ञान पर क्लिक करें।',
  },
  card: {
    chapterVerse: (ch, v) => `अध्याय ${ch}, श्लोक ${v}`,
    translationLabel: 'अनुवाद',
    aiDeepUnderstanding: 'AI गहरी समझ',
    modernRelevance: 'आधुनिक प्रासंगिकता',
    emotionalWellbeing: 'भावनात्मक कल्याण',
    careerFocus: 'करियर और ध्यान',
    mindfulPractice: 'आज के लिए सचेत अभ्यास',
    removeBookmark: 'बुकमार्क हटाएं',
    addBookmark: 'श्लोक बुकमार्क करें',
  },
  browse: {
    pageTitle: 'गीता के अध्याय देखें',
    pageSubtitle: 'भगवद गीता के ज्ञान को अध्याय और श्लोक के अनुसार जानें।',
    chapter: 'अध्याय',
    verse: 'श्लोक',
  },
  search: {
    pageTitle: 'खोजें और जानें',
    pageSubtitle: 'कीवर्ड से खोजें या प्रासंगिक मार्गदर्शन के लिए नीचे कोई विषय चुनें।',
    searchPlaceholder: 'कीवर्ड, अध्याय विषय, अनुवाद खोजें...',
    noResults: 'आपकी खोज से कोई श्लोक नहीं मिला। "कर्म", "ध्यान", "मन" या अध्याय नाम खोजें।',
    chapterVerse: (ch, v) => `अध्याय ${ch}, श्लोक ${v}`,
  },
  bookmarks: {
    pageTitle: 'मेरे बुकमार्क',
    pageSubtitle: 'त्वरित चिंतन और ध्यान के लिए आपके सहेजे गए श्लोक।',
    emptyState: 'अभी तक कोई बुकमार्क नहीं। आपको प्रेरित करने वाले श्लोक बुकमार्क करने के लिए दैनिक ज्ञान या अध्याय देखें पर जाएं।',
    removeBookmark: 'बुकमार्क हटाएं',
    chapterVerse: (ch, v) => `अध्याय ${ch}, श्लोक ${v}`,
  },
  guidance: {
    pageTitle: 'दिव्य मार्गदर्शन लें',
    pageSubtitle: 'अपनी चुनौती, संदेह या प्रश्न बताएं और भगवद गीता से प्रेरित सलाह प्राप्त करें।',
    queryLabel: 'आज आप किस चुनौती, संदेह या भावना का सामना कर रहे हैं?',
    queryPlaceholder: 'उदाहरण: मुझे अपने करियर के बारे में चिंता है, या मैं अपने क्रोध पर काबू पाने में संघर्ष कर रहा हूँ...',
    seekButton: 'मार्गदर्शन लें',
    consultingGita: 'गीता से परामर्श ले रहे हैं...',
    solutionFound: 'गीता का समाधान मिला',
    verseSelectedFor: 'आपके मार्गदर्शन के लिए चयनित श्लोक:',
    aiCounselTitle: 'आपके प्रश्न के लिए दिव्य AI परामर्श',
    personalizedCounsel: '🎯 व्यक्तिगत परामर्श',
    mentalPeace: '🧘 मानसिक शांति और भावनात्मक कल्याण',
    actionableStep: '⚡ आज के लिए आपका कार्य कदम',
  },
  sidebar: {
    subscribedAs: 'सदस्यता:',
    languagePrefs: 'भाषा और प्राथमिकताएं:',
    editPreferences: 'प्राथमिकताएं संपादित करें',
    language: 'भाषा',
    notifications: 'सूचनाएं',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    connectTelegram: 'टेलीग्राम बॉट कनेक्ट करें',
    telegramUnavailable: (bot) =>
      `⚠️ टेलीग्राम बॉट (@${bot}) कनेक्शन अस्थायी रूप से अनुपलब्ध है क्योंकि भारत में टेलीग्राम सेवाएं और बॉट निर्माण प्रतिबंधित हैं।`,
    browserPushEnabled: '🔔 ब्राउज़र पुश सक्षम',
    enableBrowserPush: 'ब्राउज़र पुश सक्षम करें',
    testSendInsight: 'ज्ञान परीक्षण भेजें',
    signOut: 'साइन आउट करें',
    developerDetails: 'डेवलपर विवरण',
    developer: 'डेवलपर',
    stack: 'स्टैक',
    links: 'लिंक',
    madeWith: '❤️ के साथ बनाया गया',
    emailOnly: 'केवल ईमेल',
    telegramOnly: 'केवल टेलीग्राम',
    webPushOnly: 'वेब पुश',
    bothEmailTelegram: 'ईमेल और टेलीग्राम',
    allChannels: 'सभी चैनल',
    prefsUpdated: '✅ प्राथमिकताएं सहेजी गईं! ऐप अब आपकी भाषा में है।',
    guestSubscribeTitle: 'दैनिक ज्ञान की सदस्यता लें',
    guestSubscribeDesc: 'ईमेल या टेलीग्राम के माध्यम से दैनिक सुबह के श्लोक प्राप्त करें।',
    subscribeButton: 'सदस्यता लें',
    appLanguageLabel: 'ऐप की भाषा',
    guestWelcome: 'आपका स्वागत है, साधक',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TELUGU (తెలుగు)
// ─────────────────────────────────────────────────────────────────────────────
const te: Translations = {
  nav: {
    dailyInsight: 'దైనిక జ్ఞానం',
    browseChapters: 'అధ్యాయాలు చూడండి',
    searchTopics: 'విషయాలు వెతకండి',
    myBookmarks: 'నా బుక్‌మార్క్‌లు',
    seekGuidance: 'మార్గదర్శనం కోరండి',
    aboutKrishnaBodha: 'కృష్ణ బోధ గురించి',
    newBadge: 'కొత్తది',
  },
  auth: {
    heroSubtitle: 'పవిత్ర జ్ఞానం మరియు AI ప్రతిబింబాలు',
    heroDescription:
      'ప్రాచీన జ్ఞానంతో మీ ఉదయాన్ని ప్రారంభించండి, లేదా ఏదైనా జీవిత సమస్యకు నేరుగా సలహా పొందండి. మీ సవాలును వివరించండి మరియు భగవద్గీత యొక్క శాశ్వత సత్యాలలో వేళ్ళూనిన తక్షణ, వ్యక్తిగతీకరించిన AI ప్రతిబింబాలు పొందండి.',
    signIn: 'సైన్ ఇన్',
    signUp: 'సైన్ అప్',
    emailLabel: 'మీ ఇమెయిల్ చిరునామా',
    signInEmailLabel: 'మీ ఇమెయిల్‌తో సైన్ ఇన్ చేయండి',
    sendOtp: 'OTP పంపండి',
    otpSentTo: 'OTP పంపబడింది',
    enterOtp: '6-అంకెల OTP నమోదు చేయండి',
    verifyOtp: 'OTP ధృవీకరించండి',
    back: '← వెనక్కి',
    completeProfile: 'మీ ప్రొఫైల్ పూర్తి చేయండి',
    identityVerified: 'గుర్తింపు ధృవీకరించబడింది! మీ ప్రాధాన్యతలను సెట్ చేయండి.',
    emailAddress: 'ఇమెయిల్ చిరునామా',
    preferredLanguage: 'ఇష్టమైన భాష',
    notificationPref: 'నోటిఫికేషన్ ప్రాధాన్యత',
    beginJourney: 'ఆధ్యాత్మిక యాత్ర ప్రారంభించండి',
    emailOnly: 'కేవలం ఇమెయిల్',
    telegramOnly: 'కేవలం టెలిగ్రామ్',
    webPushOnly: 'కేవలం వెబ్ పుష్',
    bothEmailTelegram: 'ఇమెయిల్ మరియు టెలిగ్రామ్ రెండూ',
    allChannels: 'అన్ని ఛానెల్‌లు (ఇమెయిల్, టెలిగ్రామ్ మరియు పుష్)',
    telegramWarning:
      '⚠️ గమనిక: భారతదేశంలో సేవా పరిమితుల కారణంగా టెలిగ్రామ్ బాట్ కనెక్షన్ తాత్కాలికంగా అందుబాటులో లేదు. దయచేసి ఇమెయిల్ లేదా వెబ్ పుష్ ఉపయోగించండి.',
    pushNote:
      '🔔 గమనిక: పుష్ నోటిఫికేషన్‌లు అందుకోవడానికి, లాగిన్ తర్వాత సెట్టింగ్స్‌లో "బ్రౌజర్ నోటిఫికేషన్‌లు ఎనేబుల్ చేయండి" క్లిక్ చేయండి.',
    madeWith: '❤️తో తయారు చేయబడింది',
    otpPlaceholder: '_ _ _ _ _ _',
    emailPlaceholder: 'ఇమెయిల్@example.com',
  },
  daily: {
    pageTitle: 'నేటి జ్ఞానం',
    pageSubtitle: 'మీ మనసు మరియు కార్యాలను స్థిరపరచడానికి రోజువారీ జ్ఞానం.',
    challengeBannerTitle: 'నేడు ఒక నిర్దిష్ట సవాలును ఎదుర్కొంటున్నారా?',
    challengeBannerDesc: 'మీ సమస్య లేదా మనోభావాన్ని టైప్ చేయండి మరియు గీత అనుకూలీకరించిన పరిష్కారాలతో మీకు మార్గనిర్దేశం చేయనివ్వండి.',
    seekSolutions: 'పరిష్కారాలు కోరండి',
    loadingReflection: 'AI ప్రతిబింబం కోసం వెతుకుతున్నారు...',
    noShloka: 'ఏ శ్లోకం యాక్టివ్‌గా లేదు. పైన దైనిక జ్ఞానం క్లిక్ చేయండి.',
  },
  card: {
    chapterVerse: (ch, v) => `అధ్యాయం ${ch}, శ్లోకం ${v}`,
    translationLabel: 'అనువాదం',
    aiDeepUnderstanding: 'AI లోతైన అవగాహన',
    modernRelevance: 'ఆధునిక ప్రాసంగికత',
    emotionalWellbeing: 'భావోద్వేగ శ్రేయస్సు',
    careerFocus: 'కెరీర్ మరియు దృష్టి',
    mindfulPractice: 'నేటికి సచేతన అభ్యాసం',
    removeBookmark: 'బుక్‌మార్క్ తీసివేయండి',
    addBookmark: 'శ్లోకం బుక్‌మార్క్ చేయండి',
  },
  browse: {
    pageTitle: 'గీత అధ్యాయాలు చూడండి',
    pageSubtitle: 'అధ్యాయం మరియు శ్లోకం ద్వారా భగవద్గీత జ్ఞానాన్ని అన్వేషించండి.',
    chapter: 'అధ్యాయం',
    verse: 'శ్లోకం',
  },
  search: {
    pageTitle: 'వెతకండి మరియు అన్వేషించండి',
    pageSubtitle: 'కీవర్డ్ ద్వారా వెతకండి లేదా సంబంధిత మార్గదర్శనాన్ని కనుగొనడానికి క్రింద ఒక విషయం ఎంచుకోండి.',
    searchPlaceholder: 'కీవర్డ్‌లు, అధ్యాయ థీమ్, అనువాద కంటెంట్ వెతకండి...',
    noResults: 'మీ ప్రశ్నకు సరిపోయే శ్లోకాలు లేవు. "ధర్మం", "కర్మ", "మనసు" లేదా అధ్యాయ పేర్లు వెతకండి.',
    chapterVerse: (ch, v) => `అధ్యాయం ${ch}, శ్లోకం ${v}`,
  },
  bookmarks: {
    pageTitle: 'నా బుక్‌మార్క్‌లు',
    pageSubtitle: 'త్వరిత ప్రతిబింబం మరియు ధ్యానం కోసం మీరు సేవ్ చేసిన శ్లోకాలు.',
    emptyState: 'ఇంకా బుక్‌మార్క్ చేసిన శ్లోకాలు లేవు. మీకు నచ్చిన శ్లోకాలు బుక్‌మార్క్ చేయడానికి దైనిక జ్ఞానం లేదా అధ్యాయాలు చూడండికి వెళ్ళండి.',
    removeBookmark: 'బుక్‌మార్క్ తీసివేయండి',
    chapterVerse: (ch, v) => `అధ్యాయం ${ch}, శ్లోకం ${v}`,
  },
  guidance: {
    pageTitle: 'దివ్య మార్గదర్శనం కోరండి',
    pageSubtitle: 'మీ సవాలు, సందేహం లేదా ప్రశ్నను వివరించండి మరియు భగవద్గీత నుండి ప్రేరణ పొందిన సలహా అందుకోండి.',
    queryLabel: 'నేడు మీరు ఏ సవాలు, సందేహం లేదా భావోద్వేగాన్ని ఎదుర్కొంటున్నారు?',
    queryPlaceholder: 'ఉదా: నా కెరీర్ పాత్ గురించి ఆందోళనగా ఉన్నాను, లేదా నా కోపాన్ని నియంత్రించడంలో ఇబ్బంది పడుతున్నాను...',
    seekButton: 'మార్గదర్శనం కోరండి',
    consultingGita: 'గీతను సంప్రదిస్తున్నారు...',
    solutionFound: 'గీత పరిష్కారం దొరికింది',
    verseSelectedFor: 'మీ మార్గదర్శనం కోసం ఎంచుకున్న శ్లోకం:',
    aiCounselTitle: 'మీ ప్రశ్నకు దివ్య AI సలహా',
    personalizedCounsel: '🎯 వ్యక్తిగతీకరించిన సలహా',
    mentalPeace: '🧘 మానసిక శాంతి మరియు భావోద్వేగ శ్రేయస్సు',
    actionableStep: '⚡ నేడు మీ కార్యాచరణ దశ',
  },
  sidebar: {
    subscribedAs: 'సభ్యత్వం:',
    languagePrefs: 'భాష మరియు ప్రాధాన్యతలు:',
    editPreferences: 'ప్రాధాన్యతలు సవరించండి',
    language: 'భాష',
    notifications: 'నోటిఫికేషన్‌లు',
    save: 'సేవ్ చేయండి',
    cancel: 'రద్దు చేయండి',
    connectTelegram: 'టెలిగ్రామ్ బాట్ కనెక్ట్ చేయండి',
    telegramUnavailable: (bot) =>
      `⚠️ టెలిగ్రామ్ బాట్ (@${bot}) కనెక్షన్ తాత్కాలికంగా అందుబాటులో లేదు ఎందుకంటే భారతదేశంలో టెలిగ్రామ్ సేవలు మరియు బాట్ సృష్టి నిషేధించబడ్డాయి.`,
    browserPushEnabled: '🔔 బ్రౌజర్ పుష్ ఎనేబుల్ చేయబడింది',
    enableBrowserPush: 'బ్రౌజర్ పుష్ ఎనేబుల్ చేయండి',
    testSendInsight: 'పరీక్ష జ్ఞానం పంపండి',
    signOut: 'సైన్ అవుట్',
    developerDetails: 'డెవలపర్ వివరాలు',
    developer: 'డెవలపర్',
    stack: 'స్టాక్',
    links: 'లింక్‌లు',
    madeWith: '❤️తో తయారు చేయబడింది',
    emailOnly: 'కేవలం ఇమెయిల్',
    telegramOnly: 'కేవలం టెలిగ్రామ్',
    webPushOnly: 'వెబ్ పుష్',
    bothEmailTelegram: 'ఇమెయిల్ మరియు టెలిగ్రామ్',
    allChannels: 'అన్ని ఛానెల్‌లు',
    prefsUpdated: '✅ ప్రాధాన్యతలు సేవ్ చేయబడ్డాయి! యాప్ ఇప్పుడు మీ భాషలో ఉంది.',
    guestSubscribeTitle: 'దినసరి జ్ఞానానికి చందా పొందండి',
    guestSubscribeDesc: 'ఇమెయిల్ లేదా టెలిగ్రామ్ ద్వారా ప్రతిరోజూ ఉదయం శ్లోకాలను పొందండి.',
    subscribeButton: 'చందా పొందండి',
    appLanguageLabel: 'యాప్ భాష',
    guestWelcome: 'స్వాగతం, సాధకుడు',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// KANNADA (ಕನ್ನಡ)
// ─────────────────────────────────────────────────────────────────────────────
const kn: Translations = {
  nav: {
    dailyInsight: 'ದೈನಂದಿನ ಜ್ಞಾನ',
    browseChapters: 'ಅಧ್ಯಾಯಗಳನ್ನು ನೋಡಿ',
    searchTopics: 'ವಿಷಯಗಳನ್ನು ಹುಡುಕಿ',
    myBookmarks: 'ನನ್ನ ಬುಕ್‌ಮಾರ್ಕ್‌ಗಳು',
    seekGuidance: 'ಮಾರ್ಗದರ್ಶನ ಪಡೆಯಿರಿ',
    aboutKrishnaBodha: 'ಕೃಷ್ಣ ಬೋಧ ಬಗ್ಗೆ',
    newBadge: 'ಹೊಸದು',
  },
  auth: {
    heroSubtitle: 'ಪವಿತ್ರ ಜ್ಞಾನ ಮತ್ತು AI ಚಿಂತನೆಗಳು',
    heroDescription:
      'ಪ್ರಾಚೀನ ಜ್ಞಾನದಿಂದ ನಿಮ್ಮ ಬೆಳಿಗ್ಗೆ ಪ್ರಾರಂಭಿಸಿ, ಅಥವಾ ಯಾವುದೇ ಜೀವನ ಸಮಸ್ಯೆಗೆ ನೇರ ಸಲಹೆ ಪಡೆಯಿರಿ. ನಿಮ್ಮ ಸವಾಲನ್ನು ವಿವರಿಸಿ ಮತ್ತು ಭಗವದ್ಗೀತೆಯ ಶಾಶ್ವತ ಸತ್ಯಗಳಲ್ಲಿ ಬೇರೂರಿದ ತಕ್ಷಣ, ವೈಯಕ್ತಿಕ AI ಚಿಂತನೆಗಳನ್ನು ಪಡೆಯಿರಿ.',
    signIn: 'ಸೈನ್ ಇನ್',
    signUp: 'ಸೈನ್ ಅಪ್',
    emailLabel: 'ನಿಮ್ಮ ಇಮೇಲ್ ವಿಳಾಸ',
    signInEmailLabel: 'ನಿಮ್ಮ ಇಮೇಲ್‌ನೊಂದಿಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ',
    sendOtp: 'OTP ಕಳುಹಿಸಿ',
    otpSentTo: 'OTP ಕಳುಹಿಸಲಾಗಿದೆ',
    enterOtp: '6-ಅಂಕಿ OTP ನಮೂದಿಸಿ',
    verifyOtp: 'OTP ಪರಿಶೀಲಿಸಿ',
    back: '← ಹಿಂದೆ',
    completeProfile: 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸಿ',
    identityVerified: 'ಗುರುತು ಪರಿಶೀಲಿಸಲಾಗಿದೆ! ನಿಮ್ಮ ಆದ್ಯತೆಗಳನ್ನು ಹೊಂದಿಸಿ.',
    emailAddress: 'ಇಮೇಲ್ ವಿಳಾಸ',
    preferredLanguage: 'ಆದ್ಯತೆಯ ಭಾಷೆ',
    notificationPref: 'ಅಧಿಸೂಚನೆ ಆದ್ಯತೆ',
    beginJourney: 'ಆಧ್ಯಾತ್ಮಿಕ ಪ್ರಯಾಣ ಪ್ರಾರಂಭಿಸಿ',
    emailOnly: 'ಇಮೇಲ್ ಮಾತ್ರ',
    telegramOnly: 'ಟೆಲಿಗ್ರಾಮ್ ಮಾತ್ರ',
    webPushOnly: 'ವೆಬ್ ಪುಶ್ ಮಾತ್ರ',
    bothEmailTelegram: 'ಇಮೇಲ್ ಮತ್ತು ಟೆಲಿಗ್ರಾಮ್ ಎರಡೂ',
    allChannels: 'ಎಲ್ಲಾ ಚಾನೆಲ್‌ಗಳು (ಇಮೇಲ್, ಟೆಲಿಗ್ರಾಮ್ ಮತ್ತು ಪುಶ್)',
    telegramWarning:
      '⚠️ ಗಮನಿಸಿ: ಭಾರತದಲ್ಲಿ ಸೇವಾ ನಿರ್ಬಂಧಗಳಿಂದಾಗಿ ಟೆಲಿಗ್ರಾಮ್ ಬಾಟ್ ಸಂಪರ್ಕ ತಾತ್ಕಾಲಿಕವಾಗಿ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಇಮೇಲ್ ಅಥವಾ ವೆಬ್ ಪುಶ್ ಬಳಸಿ.',
    pushNote:
      '🔔 ಗಮನಿಸಿ: ಪುಶ್ ಅಧಿಸೂಚನೆಗಳನ್ನು ಸ್ವೀಕರಿಸಲು, ಲಾಗಿನ್ ಆದ ನಂತರ ಸೆಟ್ಟಿಂಗ್‌ಗಳಲ್ಲಿ "ಬ್ರೌಸರ್ ಅಧಿಸೂಚನೆ ಸಕ್ರಿಯಗೊಳಿಸಿ" ಕ್ಲಿಕ್ ಮಾಡಿ.',
    madeWith: '❤️ ನಿಂದ ತಯಾರಿಸಲಾಗಿದೆ',
    otpPlaceholder: '_ _ _ _ _ _',
    emailPlaceholder: 'ಇಮೇಲ್@example.com',
  },
  daily: {
    pageTitle: 'ಇಂದಿನ ಜ್ಞಾನ',
    pageSubtitle: 'ನಿಮ್ಮ ಮನಸ್ಸು ಮತ್ತು ಕಾರ್ಯಗಳನ್ನು ಸ್ಥಿರಗೊಳಿಸಲು ದೈನಂದಿನ ಜ್ಞಾನ.',
    challengeBannerTitle: 'ಇಂದು ನಿರ್ದಿಷ್ಟ ಸವಾಲನ್ನು ಎದುರಿಸುತ್ತಿದ್ದೀರಾ?',
    challengeBannerDesc: 'ನಿಮ್ಮ ಸಮಸ್ಯೆ ಅಥವಾ ಮನಸ್ಥಿತಿಯನ್ನು ಟೈಪ್ ಮಾಡಿ ಮತ್ತು ಗೀತೆ ಅನುಕೂಲಿಸಿದ ಪರಿಹಾರಗಳೊಂದಿಗೆ ನಿಮ್ಮನ್ನು ಮಾರ್ಗದರ್ಶಿಸಲು ಅವಕಾಶ ಮಾಡಿ.',
    seekSolutions: 'ಪರಿಹಾರಗಳನ್ನು ಕೋರಿ',
    loadingReflection: 'AI ಚಿಂತನೆ ಹುಡುಕುತ್ತಿದ್ದಾರೆ...',
    noShloka: 'ಯಾವ ಶ್ಲೋಕವೂ ಸಕ್ರಿಯವಾಗಿಲ್ಲ. ತರಲು ಮೇಲೆ ದೈನಂದಿನ ಜ್ಞಾನ ಕ್ಲಿಕ್ ಮಾಡಿ.',
  },
  card: {
    chapterVerse: (ch, v) => `ಅಧ್ಯಾಯ ${ch}, ಶ್ಲೋಕ ${v}`,
    translationLabel: 'ಅನುವಾದ',
    aiDeepUnderstanding: 'AI ಆಳವಾದ ತಿಳುವಳಿಕೆ',
    modernRelevance: 'ಆಧುನಿಕ ಪ್ರಸ್ತುತತೆ',
    emotionalWellbeing: 'ಭಾವನಾತ್ಮಕ ಕ್ಷೇಮ',
    careerFocus: 'ವೃತ್ತಿ ಮತ್ತು ಗಮನ',
    mindfulPractice: 'ಇಂದಿನ ಸಾವಧಾನ ಅಭ್ಯಾಸ',
    removeBookmark: 'ಬುಕ್‌ಮಾರ್ಕ್ ತೆಗೆದುಹಾಕಿ',
    addBookmark: 'ಶ್ಲೋಕ ಬುಕ್‌ಮಾರ್ಕ್ ಮಾಡಿ',
  },
  browse: {
    pageTitle: 'ಗೀತಾ ಅಧ್ಯಾಯಗಳನ್ನು ನೋಡಿ',
    pageSubtitle: 'ಅಧ್ಯಾಯ ಮತ್ತು ಶ್ಲೋಕದ ಮೂಲಕ ಭಗವದ್ಗೀತೆಯ ಜ್ಞಾನವನ್ನು ಅನ್ವೇಷಿಸಿ.',
    chapter: 'ಅಧ್ಯಾಯ',
    verse: 'ಶ್ಲೋಕ',
  },
  search: {
    pageTitle: 'ಹುಡುಕಿ ಮತ್ತು ಅನ್ವೇಷಿಸಿ',
    pageSubtitle: 'ಕೀವರ್ಡ್ ಮೂಲಕ ಹುಡುಕಿ ಅಥವಾ ಸಂಬಂಧಿತ ಮಾರ್ಗದರ್ಶನವನ್ನು ಕಂಡುಹಿಡಿಯಲು ಕೆಳಗೆ ಒಂದು ವಿಷಯ ಆರಿಸಿ.',
    searchPlaceholder: 'ಕೀವರ್ಡ್‌ಗಳು, ಅಧ್ಯಾಯ ವಿಷಯ, ಅನುವಾದ ವಿಷಯ ಹುಡುಕಿ...',
    noResults: 'ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಹೊಂದಾಣಿಕೆಯಾಗುವ ಶ್ಲೋಕಗಳಿಲ್ಲ. "ಧರ್ಮ", "ಕರ್ಮ", "ಮನಸ್ಸು" ಅಥವಾ ಅಧ್ಯಾಯ ಹೆಸರುಗಳನ್ನು ಹುಡುಕಿ.',
    chapterVerse: (ch, v) => `ಅಧ್ಯಾಯ ${ch}, ಶ್ಲೋಕ ${v}`,
  },
  bookmarks: {
    pageTitle: 'ನನ್ನ ಬುಕ್‌ಮಾರ್ಕ್‌ಗಳು',
    pageSubtitle: 'ತ್ವರಿತ ಚಿಂತನೆ ಮತ್ತು ಧ್ಯಾನಕ್ಕಾಗಿ ನೀವು ಉಳಿಸಿದ ಶ್ಲೋಕಗಳು.',
    emptyState: 'ಇನ್ನೂ ಬುಕ್‌ಮಾರ್ಕ್ ಮಾಡಿದ ಶ್ಲೋಕಗಳಿಲ್ಲ. ನಿಮಗೆ ಇಷ್ಟವಾದ ಶ್ಲೋಕಗಳನ್ನು ಬುಕ್‌ಮಾರ್ಕ್ ಮಾಡಲು ದೈನಂದಿನ ಜ್ಞಾನ ಅಥವಾ ಅಧ್ಯಾಯಗಳಿಗೆ ಹೋಗಿ.',
    removeBookmark: 'ಬುಕ್‌ಮಾರ್ಕ್ ತೆಗೆದುಹಾಕಿ',
    chapterVerse: (ch, v) => `ಅಧ್ಯಾಯ ${ch}, ಶ್ಲೋಕ ${v}`,
  },
  guidance: {
    pageTitle: 'ದಿವ್ಯ ಮಾರ್ಗದರ್ಶನ ಕೋರಿ',
    pageSubtitle: 'ನಿಮ್ಮ ಸವಾಲು, ಅನುಮಾನ ಅಥವಾ ಪ್ರಶ್ನೆಯನ್ನು ವಿವರಿಸಿ ಮತ್ತು ಭಗವದ್ಗೀತೆಯಿಂದ ಸ್ಫೂರ್ತಿ ಪಡೆದ ಸಲಹೆ ಪಡೆಯಿರಿ.',
    queryLabel: 'ಇಂದು ನೀವು ಯಾವ ಸವಾಲು, ಅನುಮಾನ ಅಥವಾ ಭಾವನೆಯನ್ನು ಎದುರಿಸುತ್ತಿದ್ದೀರಿ?',
    queryPlaceholder: 'ಉದಾ: ನನ್ನ ವೃತ್ತಿ ಮಾರ್ಗದ ಬಗ್ಗೆ ಆತಂಕವಿದೆ, ಅಥವಾ ನನ್ನ ಕೋಪವನ್ನು ನಿಯಂತ್ರಿಸಲು ಹೆಣಗಾಡುತ್ತಿದ್ದೇನೆ...',
    seekButton: 'ಮಾರ್ಗದರ್ಶನ ಕೋರಿ',
    consultingGita: 'ಗೀತೆಯನ್ನು ಸಂಪರ್ಕಿಸುತ್ತಿದ್ದಾರೆ...',
    solutionFound: 'ಗೀತೆಯ ಪರಿಹಾರ ದೊರಕಿದೆ',
    verseSelectedFor: 'ನಿಮ್ಮ ಮಾರ್ಗದರ್ಶನಕ್ಕಾಗಿ ಆಯ್ಕೆ ಮಾಡಿದ ಶ್ಲೋಕ:',
    aiCounselTitle: 'ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ದಿವ್ಯ AI ಸಲಹೆ',
    personalizedCounsel: '🎯 ವೈಯಕ್ತಿಕ ಸಲಹೆ',
    mentalPeace: '🧘 ಮಾನಸಿಕ ಶಾಂತಿ ಮತ್ತು ಭಾವನಾತ್ಮಕ ಕ್ಷೇಮ',
    actionableStep: '⚡ ಇಂದಿನ ನಿಮ್ಮ ಕ್ರಿಯಾ ಹೆಜ್ಜೆ',
  },
  sidebar: {
    subscribedAs: 'ಚಂದಾದಾರಿಕೆ:',
    languagePrefs: 'ಭಾಷೆ ಮತ್ತು ಆದ್ಯತೆಗಳು:',
    editPreferences: 'ಆದ್ಯತೆಗಳನ್ನು ಸಂಪಾದಿಸಿ',
    language: 'ಭಾಷೆ',
    notifications: 'ಅಧಿಸೂಚನೆಗಳು',
    save: 'ಉಳಿಸಿ',
    cancel: 'ರದ್ದು ಮಾಡಿ',
    connectTelegram: 'ಟೆಲಿಗ್ರಾಮ್ ಬಾಟ್ ಸಂಪರ್ಕಿಸಿ',
    telegramUnavailable: (bot) =>
      `⚠️ ಟೆಲಿಗ್ರಾಮ್ ಬಾಟ್ (@${bot}) ಸಂಪರ್ಕ ತಾತ್ಕಾಲಿಕವಾಗಿ ಲಭ್ಯವಿಲ್ಲ ಏಕೆಂದರೆ ಭಾರತದಲ್ಲಿ ಟೆಲಿಗ್ರಾಮ್ ಸೇವೆಗಳು ಮತ್ತು ಬಾಟ್ ರಚನೆ ನಿಷೇಧಿಸಲಾಗಿದೆ.`,
    browserPushEnabled: '🔔 ಬ್ರೌಸರ್ ಪುಶ್ ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ',
    enableBrowserPush: 'ಬ್ರೌಸರ್ ಪುಶ್ ಸಕ್ರಿಯಗೊಳಿಸಿ',
    testSendInsight: 'ಪರೀಕ್ಷಾ ಜ್ಞಾನ ಕಳುಹಿಸಿ',
    signOut: 'ಸೈನ್ ಔಟ್',
    developerDetails: 'ಡೆವಲಪರ್ ವಿವರಗಳು',
    developer: 'ಡೆವಲಪರ್',
    stack: 'ಸ್ಟಾಕ್',
    links: 'ಲಿಂಕ್‌ಗಳು',
    madeWith: '❤️ ನಿಂದ ತಯಾರಿಸಲಾಗಿದೆ',
    emailOnly: 'ಇಮೇಲ್ ಮಾತ್ರ',
    telegramOnly: 'ಟೆಲಿಗ್ರಾಮ್ ಮಾತ್ರ',
    webPushOnly: 'ವೆಬ್ ಪುಶ್',
    bothEmailTelegram: 'ಇಮೇಲ್ ಮತ್ತು ಟೆಲಿಗ್ರಾಮ್',
    allChannels: 'ಎಲ್ಲಾ ಚಾನೆಲ್‌ಗಳು',
    prefsUpdated: '✅ ಆದ್ಯತೆಗಳನ್ನು ಉಳಿಸಲಾಗಿದೆ! ಅಪ್ಲಿಕೇಶನ್ ಈಗ ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿದೆ.',
    guestSubscribeTitle: 'ದೈನಂದಿನ ಜ್ಞಾನಕ್ಕೆ ಚಂದಾದಾರರಾಗಿ',
    guestSubscribeDesc: 'ಇಮೇಲ್ ಅಥವಾ ಟೆಲಿಗ್ರಾಮ್ ಮೂಲಕ ಪ್ರತಿದಿನ ಬೆಳಿಗ್ಗೆ ಶ್ಲೋಕಗಳನ್ನು ಪಡೆಯಿರಿ.',
    subscribeButton: 'ಚಂದಾದಾರರಾಗಿ',
    appLanguageLabel: 'ಅಪ್ಲಿಕೇಶನ್ ಭಾಷೆ',
    guestWelcome: 'ಸ್ವಾಗತ, ಸಾಧಕ',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Language Map + Accessor
// ─────────────────────────────────────────────────────────────────────────────
const translations: Record<string, Translations> = {
  english: en,
  hindi: hi,
  telugu: te,
  kannada: kn,
};

/**
 * Returns the full translation object for the given language key.
 * Falls back to English for any unsupported language.
 */
export function t(lang: string): Translations {
  return translations[lang?.toLowerCase()] ?? en;
}
