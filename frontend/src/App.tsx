import { Sidebar } from './components/Sidebar';
import { DailyTab } from './components/DailyTab';
import { AboutTab } from './components/AboutTab';
import { GuidanceTab } from './components/GuidanceTab';
import { SearchTab } from './components/SearchTab';
import { BrowseTab } from './components/BrowseTab';
import { BookmarksTab } from './components/BookmarksTab';
import { PreferencesModal } from './components/PreferencesModal';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { useApp } from './hooks/useApp';
import { AudioPlayer } from './components/AudioPlayer';

function App() {
  const {
    email,
    pref,
    lang,
    activeTab,
    browseChapterNumber,
    browseVerseNumber,
    guidanceQuery,
    setGuidanceQuery,
    guidanceLoading,
    guidanceResult,
    guidanceError,
    editPref,
    setEditPref,
    editLang,
    setEditLang,
    isPrefsModalOpen,
    setIsPrefsModalOpen,
    toast,
    telegramBotUsername,
    isPushSubscribed,
    loading,
    dailyShloka,
    chapters,
    bookmarks,
    searchQuery,
    setSearchQuery,
    searchResults,
    activeTopic,
    topics,
    handleLogout,
    handleSavePrefs,
    handleSendTestDelivery,
    handleSeekGuidance,
    handleEnableNotifications,
    handleGuestSubscribe,
    handleGuestLangChange,
    fetchDailyShloka,
    handleToggleBookmark,
    handleTopicClick,
    handleSearch,
    API_BASE
  } = useApp();

  return (
    <div className="app-container">
      {/* Global In-App Toast */}
      <Toast message={toast} />

      {/* Floating Audio Player */}
      <AudioPlayer />

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        email={email}
        lang={lang}
        onRefreshDaily={fetchDailyShloka}
        onOpenPrefs={() => setIsPrefsModalOpen(true)}
      />

      {/* Main Panel */}
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 100px)', justifyContent: 'space-between' }}>
        <div style={{ flexGrow: 1 }}>
          {activeTab === 'daily' && (
            <DailyTab
              loading={loading}
              dailyShloka={dailyShloka}
              bookmarks={bookmarks}
              onToggleBookmark={handleToggleBookmark}
              lang={lang}
            />
          )}

          {activeTab === 'browse' && (
            <BrowseTab
              chapters={chapters}
              lang={lang}
              bookmarks={bookmarks}
              onToggleBookmark={handleToggleBookmark}
              email={email}
              apiBase={API_BASE}
              browseChapterNumber={browseChapterNumber}
              browseVerseNumber={browseVerseNumber}
            />
          )}

          {activeTab === 'search' && (
            <SearchTab
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchResults={searchResults}
              activeTopic={activeTopic}
              topics={topics}
              onTopicClick={handleTopicClick}
              onSearchSubmit={handleSearch}
              onVerseSelect={(chapter, verse) => {
                window.location.hash = `#/chapter/${chapter}/verse/${verse}`;
              }}
              lang={lang}
            />
          )}

          {activeTab === 'bookmarks' && (
            <BookmarksTab
              bookmarks={bookmarks}
              onToggleBookmark={handleToggleBookmark}
              onBookmarkSelect={(chapter, verse) => {
                window.location.hash = `#/chapter/${chapter}/verse/${verse}`;
              }}
              lang={lang}
            />
          )}

          {activeTab === 'guidance' && (
            <GuidanceTab
              guidanceQuery={guidanceQuery}
              setGuidanceQuery={setGuidanceQuery}
              guidanceLoading={guidanceLoading}
              guidanceResult={guidanceResult}
              guidanceError={guidanceError}
              onSubmit={handleSeekGuidance}
              bookmarks={bookmarks}
              onToggleBookmark={handleToggleBookmark}
              lang={lang}
            />
          )}
          
          {activeTab === 'about' && (
            <AboutTab
              onSeekGuidanceClick={() => {
                window.location.hash = '#/guidance';
              }}
            />
          )}
        </div>

        {/* Global Footer */}
        <Footer lang={lang} />
      </main>

      {/* Preferences / Subscription Modal */}
      <PreferencesModal
        isOpen={isPrefsModalOpen}
        onClose={() => setIsPrefsModalOpen(false)}
        email={email}
        pref={pref}
        lang={lang}
        loading={loading}
        editPref={editPref}
        setEditPref={setEditPref}
        editLang={editLang}
        setEditLang={setEditLang}
        isPushSubscribed={isPushSubscribed}
        telegramBotUsername={telegramBotUsername}
        handleGuestLangChange={handleGuestLangChange}
        handleGuestSubscribe={handleGuestSubscribe}
        handleSavePrefs={handleSavePrefs}
        handleEnableNotifications={handleEnableNotifications}
        handleSendTestDelivery={handleSendTestDelivery}
        handleLogout={handleLogout}
      />
    </div>
  );
}

export default App;
