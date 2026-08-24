import React, { useState, useEffect } from 'react';
import { NavTab, Article, HistoryTest, VideoLesson } from './types';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeView } from './views/HomeView';
import { BlogView } from './views/BlogView';
import { TestsView } from './views/TestsView';
import { QuizzesView } from './views/QuizzesView';
import { VideosView } from './views/VideosView';
import { ContactView } from './views/ContactView';
import { AdminView } from './views/AdminView';
import { ArticleDetailView } from './views/ArticleDetailView';
import { TestRunnerModal } from './components/TestRunnerModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { SearchModal } from './components/SearchModal';
import { AuthModal } from './components/AuthModal';
import { StudentProfileModal } from './components/StudentProfileModal';
import { supabase } from './lib/supabase';
import { isAdminUser, fetchAllArticles } from './lib/blogService';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedTest, setSelectedTest] = useState<HistoryTest | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoLesson | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    // Process Supabase session (without forcing activeTab='admin' on refresh)
    const handleSession = (session: any) => {
      if (session?.user) {
        const meta = session.user.user_metadata;
        const name = meta?.full_name || 
                     `${meta?.first_name || ''} ${meta?.last_name || ''}`.trim() || 
                     session.user.email?.split('@')[0] || 'მომხმარებელი';
        const userData = { name, email: session.user.email || '' };
        setUser(userData);

        // Clean up URL hash or search params from Google OAuth redirect if needed
        if (window.location.hash || window.location.search.includes('code=')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else {
        const isOverride = localStorage.getItem('ntistoria_admin_override') === 'true';
        if (!isOverride) {
          setUser(null);
        }
      }
    };

    // Check initial active Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // Listen for real-time auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    // Check for direct article URL parameter e.g. ?article=slug_or_id
    const params = new URLSearchParams(window.location.search);
    const articleParam = params.get('article');
    if (articleParam) {
      fetchAllArticles().then(articles => {
        const match = articles.find(a => a.slug === articleParam || a.id === articleParam);
        if (match) {
          setSelectedArticle(match);
        }
      }).catch(console.error);
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUser(null);
  };

  const handleOpenArticle = (article: Article) => {
    setSelectedArticle(article);
    const articleSlugOrId = article.slug || article.id;
    if (window.history.pushState) {
      const newUrl = `${window.location.pathname}?article=${encodeURIComponent(articleSlugOrId)}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseArticle = () => {
    setSelectedArticle(null);
    if (window.history.pushState) {
      window.history.pushState({}, '', window.location.pathname);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenTest = (test: HistoryTest) => {
    setSelectedTest(test);
  };

  const handleOpenVideo = (video: VideoLesson) => {
    setSelectedVideo(video);
  };

  const handleTabChange = (tab: NavTab) => {
    handleCloseArticle();
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1B1B1B] selection:bg-[#C79B3A] selection:text-[#0D1B2A]">
      {/* Top Sticky Header */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Dynamic View Area */}
      <main className="flex-1">
        {selectedArticle ? (
          <ArticleDetailView 
            article={selectedArticle}
            onBack={handleCloseArticle}
            onSelectRelated={(art) => handleOpenArticle(art)}
          />
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeView 
                onOpenArticle={handleOpenArticle} 
                onOpenTest={handleOpenTest}
                setActiveTab={handleTabChange}
              />
            )}

            {activeTab === 'blog' && (
              <BlogView
                onOpenArticle={handleOpenArticle}
              />
            )}

            {activeTab === 'tests' && (
              <TestsView
                onOpenTest={handleOpenTest}
                user={user}
              />
            )}

            {activeTab === 'quizzes' && (
              <QuizzesView />
            )}

            {activeTab === 'videos' && (
              <VideosView />
            )}

            {activeTab === 'contact' && (
              <ContactView />
            )}

            {activeTab === 'admin' && (
              <AdminView
                user={user}
                onOpenArticle={handleOpenArticle}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <Footer setActiveTab={handleTabChange} />

      {/* Interactive Modals */}
      <TestRunnerModal
        test={selectedTest}
        onClose={() => setSelectedTest(null)}
        userEmail={user?.email}
      />

      <VideoPlayerModal
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpenArticle={handleOpenArticle}
        onOpenTest={handleOpenTest}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccessLogin={(userData) => {
          setUser(userData);
          if (isAdminUser(userData)) {
            setActiveTab('admin');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          setIsAuthOpen(false);
        }}
      />

      <StudentProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
      />
    </div>
  );
}

export default App;
