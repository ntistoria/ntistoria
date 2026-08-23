import React, { useState, useEffect } from 'react';
import { NavTab, Article, HistoryTest, VideoLesson } from './types';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeView } from './views/HomeView';
import { BlogView } from './views/BlogView';
import { TestsView } from './views/TestsView';
import { VideosView } from './views/VideosView';
import { QuizzesView } from './views/QuizzesView';
import { ContactView } from './views/ContactView';
import { AdminView } from './views/AdminView';
import { ArticleModal } from './components/ArticleModal';
import { TestRunnerModal } from './components/TestRunnerModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { SearchModal } from './components/SearchModal';
import { AuthModal } from './components/AuthModal';
import { StudentProfileModal } from './components/StudentProfileModal';
import { ARTICLES } from './data/historyData';
import { supabase } from './lib/supabase';
import { isAdminUser } from './lib/blogService';


export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedTest, setSelectedTest] = useState<HistoryTest | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoLesson | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    // Check initial active Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const meta = session.user.user_metadata;
        const name = meta?.full_name || 
                     `${meta?.first_name || ''} ${meta?.last_name || ''}`.trim() || 
                     session.user.email?.split('@')[0] || 'მომხმარებელი';
        setUser({ name, email: session.user.email || '' });
      }
    });

    // Listen for real-time auth changes (Login, Logout, Token Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const meta = session.user.user_metadata;
        const name = meta?.full_name || 
                     `${meta?.first_name || ''} ${meta?.last_name || ''}`.trim() || 
                     session.user.email?.split('@')[0] || 'მომხმარებელი';
        setUser({ name, email: session.user.email || '' });
      } else {
        setUser(null);
      }
    });

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
  };

  const handleOpenTest = (test: HistoryTest) => {
    setSelectedTest(test);
  };

  const handleOpenVideo = (video: VideoLesson) => {
    setSelectedVideo(video);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1B1B1B] selection:bg-[#C79B3A] selection:text-[#0D1B2A]">
      
      {/* Sticky Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main View Container */}
      <main className="flex-1 pt-24 px-4 sm:px-6 lg:px-8">
        {activeTab === 'home' && (
          <HomeView
            setActiveTab={setActiveTab}
            onOpenArticle={handleOpenArticle}
            onOpenTest={handleOpenTest}
            onOpenVideo={handleOpenVideo}
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
      </main>

      {/* Footer */}
      <Footer setActiveTab={setActiveTab} />

      {/* Interactive Modals */}
      <ArticleModal 
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        onSelectRelated={(art) => setSelectedArticle(art)}
        allArticles={ARTICLES}
      />

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
        onOpenVideo={handleOpenVideo}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccessLogin={(userData) => {
          setUser(userData);
          // Automatically redirect admins to admin panel
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

