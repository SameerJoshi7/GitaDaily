import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { DailyTab } from './components/DailyTab';
import { AboutTab } from './components/AboutTab';
import { GuidanceTab } from './components/GuidanceTab';
import { SearchTab } from './components/SearchTab';
import { ShlokaDetailTab } from './components/ShlokaDetailTab';
import { BrowseTab } from './components/BrowseTab';
import { BookmarksTab } from './components/BookmarksTab';
import { PreferencesModal } from './components/PreferencesModal';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { WelcomeModal } from './components/WelcomeModal';
import { NamePromptModal } from './components/NamePromptModal';
import { FeedbackModal } from './components/FeedbackModal';
import { InstallPrompt } from './components/InstallPrompt';
import { NotificationPrompt } from './components/NotificationPrompt';
import { useApp } from './hooks/useApp';
import { useRegisterSW } from 'virtual:pwa-register/react';

function App() {
  const navigate = useNavigate();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const {
    email,
    pref,
    lang,
    activeTab,
    browseChapterNumber,
    browseVerseNumber,
    readingHistory,
    guidanceQuery,
    setGuidanceQuery,
    guidanceLoading,
    guidanceResult,
    guidanceError,
    guidanceRetryTimer,
    editPref,
    setEditPref,
    userName,
    editName,
    setEditName,

    isPrefsModalOpen,
    setIsPrefsModalOpen,
    toast,
    isPushSubscribed,
    loading,
    dailyShloka,
    specificShloka,
    chapters,
    bookmarks,
    searchQuery,
    setSearchQuery,
    searchResults,
    searchError,
    searchRetryTimer,
    activeTopic,
    topics,
    handleLogout,
    handleDeleteAccount,
    handleSavePrefs,
    handleSendTestDelivery,
    handleSeekGuidance,
    handleEnableNotifications,
    handleSendOtp,
    handleVerifyOtp,
    handleGuestSubscribe,
    handleUpgradePreference,
    handleGuestLangChange,
    fetchDailyShloka,
    handleToggleBookmark,
    handleTopicClick,
    handleSearch,
    API_BASE,
    setUserName
  } = useApp();

  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [showInitialOnboarding, setShowInitialOnboarding] = useState(false);

  // Track app opens and automatically show feedback modal for subscribers on 3rd open
  useEffect(() => {
    if (!sessionStorage.getItem('gitadaily_session_started')) {
      sessionStorage.setItem('gitadaily_session_started', 'true');
      const opens = parseInt(localStorage.getItem('gitadaily_app_opens') || '0', 10) + 1;
      localStorage.setItem('gitadaily_app_opens', opens.toString());

      // Subscriber check: must have email
      // Query check: must have queried for guidance
      if (
        email && 
        opens === 3 && 
        localStorage.getItem('gitadaily_has_queried') === 'true' &&
        localStorage.getItem('gitadaily_feedback_submitted') !== 'true'
      ) {
        setTimeout(() => setIsFeedbackModalOpen(true), 1500);
      }
    }
  }, [email]);

  const handleFeedbackSubmit = async (guidanceRating: number, appRating: number, suggestions: string, isEdit: boolean, newName: string) => {
    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guidanceRating,
          appRating,
          suggestions,
          userEmail: email, // optional, will be empty string if guest
          userName: newName,
          isEdit
        })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('gitadaily_feedback_submitted', 'true');
        alert(`Thank you! Your feedback has been ${isEdit ? 'updated' : 'submitted'}.`);
        setIsFeedbackModalOpen(false);
      } else {
        alert(data.error || 'Failed to submit feedback.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to the server.');
    }
  };

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('gitadaily_welcome_seen');
    if (!hasSeenWelcome && !email) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsWelcomeModalOpen(true);
    }
  }, [email]);

  const handleCloseWelcome = () => {
    localStorage.setItem('gitadaily_welcome_seen', 'true');
    setIsWelcomeModalOpen(false);
  };

  return (
    <div className="app-container">
      {/* Global In-App Toast */}
      <Toast message={toast} />

      <NotificationPrompt
        email={email}
        pref={pref}
        handleEnableNotifications={handleEnableNotifications}
        handleUpgradePreference={handleUpgradePreference}
        showInitialOnboarding={showInitialOnboarding}
        onInitialOnboardingComplete={(skipped) => {
          setShowInitialOnboarding(false);
          if (skipped) {
            alert('You can update your notification preferences anytime from Settings.');
          }
        }}
      />


      <Sidebar
        activeTab={activeTab}
        email={email}
        userName={userName}
        lang={lang}
        onRefreshDaily={fetchDailyShloka}
        onOpenPrefs={() => setIsPrefsModalOpen(true)}
        onOpenFeedback={() => setIsFeedbackModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Panel */}
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 100px)', justifyContent: 'space-between' }}>
        <div style={{ flexGrow: 1 }}>
          <Routes>
            <Route path="/dailyinsights" element={
              <DailyTab
                loading={loading}
                dailyShloka={dailyShloka}
                bookmarks={bookmarks}
                onToggleBookmark={handleToggleBookmark}
                lang={lang}
              />
            } />

            <Route path="/browse" element={
              <BrowseTab
                chapters={chapters}
                lang={lang}
                bookmarks={bookmarks}
                onToggleBookmark={handleToggleBookmark}
                email={email}
                apiBase={API_BASE}
                browseChapterNumber={browseChapterNumber}
                browseVerseNumber={browseVerseNumber}
                readingHistory={readingHistory}
              />
            } />

            <Route path="/searchinsights" element={
              <SearchTab
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchResults={searchResults}
                searchError={searchError}
                searchRetryTimer={searchRetryTimer}
                activeTopic={activeTopic}
                topics={topics}
                onTopicClick={handleTopicClick}
                onSearchSubmit={handleSearch}
                onVerseSelect={(chapter, verse) => {
                  navigate(`/chapter/${chapter}/verse/${verse}`);
                }}
                lang={lang}
              />
            } />

            <Route path="/chapter/:chapter/verse/:verse" element={
              <ShlokaDetailTab
                shloka={specificShloka}
                loading={loading}
                bookmarks={bookmarks}
                onToggleBookmark={handleToggleBookmark}
                lang={lang}
              />
            } />

            <Route path="/bookmarks" element={
              <BookmarksTab
                bookmarks={bookmarks}
                onToggleBookmark={handleToggleBookmark}
                onBookmarkSelect={(chapter, verse) => {
                  navigate(`/chapter/${chapter}/verse/${verse}`);
                }}
                lang={lang}
              />
            } />

            <Route path="/guidance" element={
              <GuidanceTab
                guidanceQuery={guidanceQuery}
                setGuidanceQuery={setGuidanceQuery}
                guidanceLoading={guidanceLoading}
                guidanceResult={guidanceResult}
                guidanceError={guidanceError}
                guidanceRetryTimer={guidanceRetryTimer}
                onSubmit={handleSeekGuidance}
                bookmarks={bookmarks}
                onToggleBookmark={handleToggleBookmark}
                lang={lang}
                onSubscribeClick={() => setIsPrefsModalOpen(true)}
              />
            } />
            
            <Route path="/about" element={
              <AboutTab
                onSeekGuidanceClick={() => {
                  navigate('/guidance');
                }}
              />
            } />

            <Route path="*" element={<Navigate to="/guidance" replace />} />
          </Routes>
        </div>

        {/* Global Footer */}
        <Footer />
      </main>

      {/* Preferences / Subscription Modal */}
      <PreferencesModal
        isOpen={isPrefsModalOpen}
        onClose={() => setIsPrefsModalOpen(false)}
        email={email}
        pref={pref}
        lang={lang}
        onLangChange={handleGuestLangChange}
        loading={loading}
        editPref={editPref}
        setEditPref={setEditPref}
        editName={editName}
        setEditName={setEditName}

        isPushSubscribed={isPushSubscribed}

        handleGuestSubscribe={async (emailVal, prefVal) => {
          const res = await handleGuestSubscribe(emailVal, prefVal);
          if (res.success) {
            setShowInitialOnboarding(true);
          }
          return res;
        }}
        handleSendOtp={handleSendOtp}
        handleVerifyOtp={handleVerifyOtp}
        handleSavePrefs={handleSavePrefs}
        handleEnableNotifications={handleEnableNotifications}
        handleSendTestDelivery={handleSendTestDelivery}
        handleDeleteAccount={handleDeleteAccount}
      />

      {/* Welcome Modal for First-time Users */}
      {isWelcomeModalOpen && (
        <WelcomeModal
          isOpen={isWelcomeModalOpen}
          onClose={handleCloseWelcome}
        />
      )}

      {/* Name Prompt Modal for Logged-In Users Without a Name */}
      <NamePromptModal
        isOpen={!!email && !userName}
        loading={loading}
        onSave={async (name) => {
          setEditName(name);
          await handleSavePrefs(undefined, name);
        }}
      />

      {/* Anonymous Feedback Modal */}
      <FeedbackModal 
        isOpen={isFeedbackModalOpen} 
        onClose={() => setIsFeedbackModalOpen(false)}
        onSubmit={handleFeedbackSubmit}
        loading={false}
        email={email}
        userName={userName}
        onNameUpdate={setUserName}
      />
      
      <InstallPrompt />

      {/* PWA Update Banner */}
      {needRefresh && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--bg-tertiary)',
          border: '1px solid var(--gold-primary)',
          boxShadow: '0 4px 12px rgba(212, 175, 55, 0.2)',
          padding: '1rem',
          borderRadius: '12px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.8rem',
          width: '90%',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <div style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            <strong style={{ color: 'var(--gold-primary)' }}>New update available!</strong><br />
            Click reload to get the latest features.
          </div>
          <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
            <button 
              className="primary-btn" 
              style={{ flex: 1, padding: '0.5rem', justifyContent: 'center' }}
              onClick={() => {
                setNeedRefresh(false);
                updateServiceWorker(true);
              }}
            >
              Reload
            </button>
            <button 
              className="primary-btn" 
              style={{ flex: 1, padding: '0.5rem', justifyContent: 'center', background: 'transparent', border: '1px solid var(--card-border)' }}
              onClick={() => setNeedRefresh(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
