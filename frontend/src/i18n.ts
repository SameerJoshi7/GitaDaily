/**
 * GitaDaily – Internationalization (i18n) Dictionary
 * Supported languages: English, Hindi, Telugu, Kannada
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
    heroDescription: 'Start your morning with ancient wisdom, or seek direct counsel for any life problem. Describe your challenge, and get instant, personalized AI reflections rooted in the eternal truths of the Bhagavad Gita.',
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
    pushNote: '🔔 Note: To receive push notifications, click "Enable Browser Notifications" on the settings sidebar once logged in.',
    madeWith: 'Made with ❤️ by',
    otpPlaceholder: '_ _ _ _ _ _',
    emailPlaceholder: 'email@example.com',
  },
  daily: {
    pageTitle: "Today's Wisdom",
    pageSubtitle: 'A daily dose of wisdom to ground your mind and actions.',
    challengeBannerTitle: 'Facing a specific challenge today?',
    challengeBannerDesc: 'Type your problem or mood and let the Gita guide you with customized solutions.',
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
    pageSubtitle: 'Describe your challenge, mood, or question, and receive counsel inspired by the Bhagavad Gita.',
    queryLabel: 'What challenge, doubt, or emotion are you facing today?',
    queryPlaceholder: 'E.g., I am feeling anxious about my career path, or I am struggling to control my anger...',
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

const hi: Translations = {
  ...en,
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

const te: Translations = {
  ...en,
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

const kn: Translations = {
  ...en,
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
