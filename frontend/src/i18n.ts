/**
 * GitaDaily – Internationalization (i18n) Dictionary
 *
 * Translation scope:
 *   ✅ Sidebar  → nav + sidebar keys (translated for all languages)
 *   ✅ Main content → daily + card + guidance keys (translated for all languages)
 *   ❌ Everything else (auth, browse, search, bookmarks) → English only
 */

export interface Translations {
  nav: {
    dailyInsight: string;
    browseChapters: string;
    searchTopics: string;
    myBookmarks: string;
    seekGuidance: string;
    aboutKrishnaBodha: string;
    newBadge: string;
  };
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
    webPushOnly: string;
    allChannels: string;
    pushNote: string;
    madeWith: string;
    otpPlaceholder: string;
    emailPlaceholder: string;
  };
  daily: {
    pageTitle: string;
    pageSubtitle: string;
    challengeBannerTitle: string;
    challengeBannerDesc: string;
    seekSolutions: string;
    loadingReflection: string;
    noShloka: string;
  };
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
  browse: {
    pageTitle: string;
    pageSubtitle: string;
    chapter: string;
    verse: string;
  };
  search: {
    pageTitle: string;
    pageSubtitle: string;
    searchPlaceholder: string;
    noResults: string;
    chapterVerse: (ch: number, v: number) => string;
  };
  bookmarks: {
    pageTitle: string;
    pageSubtitle: string;
    emptyState: string;
    removeBookmark: string;
    chapterVerse: (ch: number, v: number) => string;
  };
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
  sidebar: {
    subscribedAs: string;
    languagePrefs: string;
    editPreferences: string;
    language: string;
    notifications: string;
    save: string;
    cancel: string;
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
    webPushOnly: string;
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
// ENGLISH (default / fallback)
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
    webPushOnly: 'Web Push Only',
    allChannels: 'All Channels (Email & Push)',
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
    noResults:
      'No verses match your query. Try searching for "duty", "focus", "mind", or chapter names.',
    chapterVerse: (ch, v) => `Chapter ${ch}, Verse ${v}`,
  },
  bookmarks: {
    pageTitle: 'My Bookmarks',
    pageSubtitle: 'Your saved verses for quick reflection and meditation.',
    emptyState:
      'No bookmarked verses yet. Go to Daily Insight or Browse to bookmark verses that speak to you.',
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
    webPushOnly: 'Web Push',
    allChannels: 'All Channels',
    prefsUpdated: '✅ Preferences saved! App is now in your language.',
    guestSubscribeTitle: 'Subscribe to Daily Wisdom',
    guestSubscribeDesc: 'Receive daily morning shlokas via Email or Web Push.',
    subscribeButton: 'Subscribe',
    appLanguageLabel: 'App Language',
    guestWelcome: 'Welcome, Seeker',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HINDI (हिन्दी)
// Translated: nav, sidebar, daily, card, guidance
// English:    auth, browse, search, bookmarks
// ─────────────────────────────────────────────────────────────────────────────
const hi: Translations = {
  ...en,
  nav: {
    dailyInsight: 'दैनिक ज्ञान',
    browseChapters: 'अध्याय देखें',
    searchTopics: 'विषय खोजें',
    myBookmarks: 'मेरे बुकमार्क',
    seekGuidance: 'मार्गदर्शन लें',
    aboutKrishnaBodha: 'कृष्ण बोध के बारे में',
    newBadge: 'नया',
  },
  daily: {
    pageTitle: 'आज का ज्ञान',
    pageSubtitle: 'आपके मन और कर्म को स्थिर करने के लिए प्रतिदिन का ज्ञान।',
    challengeBannerTitle: 'आज किसी विशेष चुनौती का सामना कर रहे हैं?',
    challengeBannerDesc:
      'अपनी समस्या या भाव लिखें और गीता को अनुकूलित समाधान के साथ आपका मार्गदर्शन करने दें।',
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
  guidance: {
    pageTitle: 'दिव्य मार्गदर्शन लें',
    pageSubtitle:
      'अपनी चुनौती, संदेह या प्रश्न बताएं और भगवद गीता से प्रेरित सलाह प्राप्त करें।',
    queryLabel: 'आज आप किस चुनौती, संदेह या भावना का सामना कर रहे हैं?',
    queryPlaceholder:
      'उदाहरण: मुझे अपने करियर के बारे में चिंता है, या मैं अपने क्रोध पर काबू पाने में संघर्ष कर रहा हूँ...',
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
    ...en.sidebar,
    subscribedAs: 'सदस्यता:',
    languagePrefs: 'भाषा और प्राथमिकताएं:',
    editPreferences: 'प्राथमिकताएं संपादित करें',
    language: 'भाषा',
    notifications: 'सूचनाएं',
    save: 'सहेजें',
    cancel: 'रद्द करें',
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
    webPushOnly: 'वेब पुश',
    allChannels: 'सभी चैनल',
    prefsUpdated: '✅ प्राथमिकताएं सहेजी गईं! ऐप अब आपकी भाषा में है।',
    guestSubscribeTitle: 'दैनिक ज्ञान की सदस्यता लें',
    guestSubscribeDesc: 'ईमेल या वेब पुश के माध्यम से दैनिक सुबह के श्लोक प्राप्त करें।',
    subscribeButton: 'सदस्यता लें',
    appLanguageLabel: 'ऐप की भाषा',
    guestWelcome: 'आपका स्वागत है, साधक',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TELUGU (తెలుగు)
// Translated: nav, sidebar, daily, card, guidance
// English:    auth, browse, search, bookmarks
// ─────────────────────────────────────────────────────────────────────────────
const te: Translations = {
  ...en,
  nav: {
    dailyInsight: 'దైనిక జ్ఞానం',
    browseChapters: 'అధ్యాయాలు చూడండి',
    searchTopics: 'విషయాలు వెతకండి',
    myBookmarks: 'నా బుక్‌మార్క్‌లు',
    seekGuidance: 'మార్గదర్శనం కోరండి',
    aboutKrishnaBodha: 'కృష్ణ బోధ గురించి',
    newBadge: 'కొత్తది',
  },
  daily: {
    pageTitle: 'నేటి జ్ఞానం',
    pageSubtitle: 'మీ మనసు మరియు కార్యాలను స్థిరపరచడానికి రోజువారీ జ్ఞానం.',
    challengeBannerTitle: 'నేడు ఒక నిర్దిష్ట సవాలును ఎదుర్కొంటున్నారా?',
    challengeBannerDesc:
      'మీ సమస్య లేదా మనోభావాన్ని టైప్ చేయండి మరియు గీత అనుకూలీకరించిన పరిష్కారాలతో మీకు మార్గనిర్దేశం చేయనివ్వండి.',
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
  guidance: {
    pageTitle: 'దివ్య మార్గదర్శనం కోరండి',
    pageSubtitle:
      'మీ సవాలు, సందేహం లేదా ప్రశ్నను వివరించండి మరియు భగవద్గీత నుండి ప్రేరణ పొందిన సలహా అందుకోండి.',
    queryLabel: 'నేడు మీరు ఏ సవాలు, సందేహం లేదా భావోద్వేగాన్ని ఎదుర్కొంటున్నారు?',
    queryPlaceholder:
      'ఉదా: నా కెరీర్ పాత్ గురించి ఆందోళనగా ఉన్నాను, లేదా నా కోపాన్ని నియంత్రించడంలో ఇబ్బంది పడుతున్నాను...',
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
    ...en.sidebar,
    subscribedAs: 'సభ్యత్వం:',
    languagePrefs: 'భాష మరియు ప్రాధాన్యతలు:',
    editPreferences: 'ప్రాధాన్యతలు సవరించండి',
    language: 'భాష',
    notifications: 'నోటిఫికేషన్‌లు',
    save: 'సేవ్ చేయండి',
    cancel: 'రద్దు చేయండి',
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
    webPushOnly: 'వెబ్ పుష్',
    allChannels: 'అన్ని ఛానెల్‌లు',
    prefsUpdated: '✅ ప్రాధాన్యతలు సేవ్ చేయబడ్డాయి! యాప్ ఇప్పుడు మీ భాషలో ఉంది.',
    guestSubscribeTitle: 'దినసరి జ్ఞానానికి చందా పొందండి',
    guestSubscribeDesc: 'ఇమెయిల్ లేదా వెబ్ పుష్ ద్వారా ప్రతిరోజూ ఉదయం శ్లోకాలను పొందండి.',
    subscribeButton: 'చందా పొందండి',
    appLanguageLabel: 'యాప్ భాష',
    guestWelcome: 'స్వాగతం, సాధకుడు',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// KANNADA (ಕನ್ನಡ)
// Translated: nav, sidebar, daily, card, guidance
// English:    auth, browse, search, bookmarks
// ─────────────────────────────────────────────────────────────────────────────
const kn: Translations = {
  ...en,
  nav: {
    dailyInsight: 'ದೈನಂದಿನ ಜ್ಞಾನ',
    browseChapters: 'ಅಧ್ಯಾಯಗಳನ್ನು ನೋಡಿ',
    searchTopics: 'ವಿಷಯಗಳನ್ನು ಹುಡುಕಿ',
    myBookmarks: 'ನನ್ನ ಬುಕ್‌ಮಾರ್ಕ್‌ಗಳು',
    seekGuidance: 'ಮಾರ್ಗದರ್ಶನ ಪಡೆಯಿರಿ',
    aboutKrishnaBodha: 'ಕೃಷ್ಣ ಬೋಧ ಬಗ್ಗೆ',
    newBadge: 'ಹೊಸದು',
  },
  daily: {
    pageTitle: 'ಇಂದಿನ ಜ್ಞಾನ',
    pageSubtitle: 'ನಿಮ್ಮ ಮನಸ್ಸು ಮತ್ತು ಕಾರ್ಯಗಳನ್ನು ಸ್ಥಿರಗೊಳಿಸಲು ದೈನಂದಿನ ಜ್ಞಾನ.',
    challengeBannerTitle: 'ಇಂದು ನಿರ್ದಿಷ್ಟ ಸವಾಲನ್ನು ಎದುರಿಸುತ್ತಿದ್ದೀರಾ?',
    challengeBannerDesc:
      'ನಿಮ್ಮ ಸಮಸ್ಯೆ ಅಥವಾ ಮನಸ್ಥಿತಿಯನ್ನು ಟೈಪ್ ಮಾಡಿ ಮತ್ತು ಗೀತೆ ಅನುಕೂಲಿಸಿದ ಪರಿಹಾರಗಳೊಂದಿಗೆ ನಿಮ್ಮನ್ನು ಮಾರ್ಗದರ್ಶಿಸಲು ಅವಕಾಶ ಮಾಡಿ.',
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
  guidance: {
    pageTitle: 'ದಿವ್ಯ ಮಾರ್ಗದರ್ಶನ ಕೋರಿ',
    pageSubtitle:
      'ನಿಮ್ಮ ಸವಾಲು, ಅನುಮಾನ ಅಥವಾ ಪ್ರಶ್ನೆಯನ್ನು ವಿವರಿಸಿ ಮತ್ತು ಭಗವದ್ಗೀತೆಯಿಂದ ಸ್ಫೂರ್ತಿ ಪಡೆದ ಸಲಹೆ ಪಡೆಯಿರಿ.',
    queryLabel: 'ಇಂದು ನೀವು ಯಾವ ಸವಾಲು, ಅನುಮಾನ ಅಥವಾ ಭಾವನೆಯನ್ನು ಎದುರಿಸುತ್ತಿದ್ದೀರಿ?',
    queryPlaceholder:
      'ಉದಾ: ನನ್ನ ವೃತ್ತಿ ಮಾರ್ಗದ ಬಗ್ಗೆ ಆತಂಕವಿದೆ, ಅಥವಾ ನನ್ನ ಕೋಪವನ್ನು ನಿಯಂತ್ರಿಸಲು ಹೆಣಗಾಡುತ್ತಿದ್ದೇನೆ...',
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
    ...en.sidebar,
    subscribedAs: 'ಚಂದಾದಾರಿಕೆ:',
    languagePrefs: 'ಭಾಷೆ ಮತ್ತು ಆದ್ಯತೆಗಳು:',
    editPreferences: 'ಆದ್ಯತೆಗಳನ್ನು ಸಂಪಾದಿಸಿ',
    language: 'ಭಾಷೆ',
    notifications: 'ಅಧಿಸೂಚನೆಗಳು',
    save: 'ಉಳಿಸಿ',
    cancel: 'ರದ್ದು ಮಾಡಿ',
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
    webPushOnly: 'ವೆಬ್ ಪುಶ್',
    allChannels: 'ಎಲ್ಲಾ ಚಾನೆಲ್‌ಗಳು',
    prefsUpdated: '✅ ಆದ್ಯತೆಗಳನ್ನು ಉಳಿಸಲಾಗಿದೆ! ಅಪ್ಲಿಕೇಶನ್ ಈಗ ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿದೆ.',
    guestSubscribeTitle: 'ದೈನಂದಿನ ಜ್ಞಾನಕ್ಕೆ ಚಂದಾದಾರರಾಗಿ',
    guestSubscribeDesc: 'ಇಮೇಲ್ ಅಥವಾ ವೆಬ್ ಪುಶ್ ಮೂಲಕ ಪ್ರತಿದಿನ ಬೆಳಿಗ್ಗೆ ಶ್ಲೋಕಗಳನ್ನು ಪಡೆಯಿರಿ.',
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
