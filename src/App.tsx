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
import { fetchUserProfile, syncUserProfile } from './lib/userService';

// Dynamic SEO Meta Manager Helper for SPA
function updateSeoMetaData(options: {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl?: string;
  articleJsonLd?: any;
}) {
  document.title = options.title;

  const setMeta = (nameOrProperty: string, content: string, isProperty = false) => {
    let el = document.querySelector(
      isProperty ? `meta[property="${nameOrProperty}"]` : `meta[name="${nameOrProperty}"]`
    );
    if (!el) {
      el = document.createElement('meta');
      if (isProperty) el.setAttribute('property', nameOrProperty);
      else el.setAttribute('name', nameOrProperty);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  setMeta('description', options.description);
  setMeta('og:title', options.title, true);
  setMeta('og:description', options.description, true);
  setMeta('og:url', options.canonicalUrl, true);
  setMeta('twitter:title', options.title);
  setMeta('twitter:description', options.description);

  if (options.imageUrl) {
    setMeta('og:image', options.imageUrl, true);
    setMeta('twitter:image', options.imageUrl);
  }

  // Canonical Link
  let canonicalEl = document.querySelector('link[rel="canonical"]');
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', options.canonicalUrl);

  // Dynamic Article JSON-LD Schema
  let schemaEl = document.getElementById('dynamic-article-schema');
  if (options.articleJsonLd) {
    if (!schemaEl) {
      schemaEl = document.createElement('script');
      schemaEl.id = 'dynamic-article-schema';
      schemaEl.setAttribute('type', 'application/ld+json');
      document.head.appendChild(schemaEl);
    }
    schemaEl.textContent = JSON.stringify(options.articleJsonLd);
  } else if (schemaEl) {
    schemaEl.remove();
  }
}

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedTest, setSelectedTest] = useState<HistoryTest | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoLesson | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  // Dynamic SEO title, description, canonical & Open Graph manager
  useEffect(() => {
    if (selectedArticle) {
      const artTitle = `${selectedArticle.title} — NT ისტორიის მასწავლებელი`;
      const artDesc = selectedArticle.excerpt 
        ? (selectedArticle.excerpt.length > 155 ? `${selectedArticle.excerpt.slice(0, 155)}...` : selectedArticle.excerpt)
        : `წაიკითხეთ სტატია "${selectedArticle.title}" - NT ისტორიის მასწავლებელი ნოდარ თოთაძე.`;
      const artUrl = `https://ntistoria.vercel.app/?article=${encodeURIComponent(selectedArticle.slug || selectedArticle.id)}`;

      updateSeoMetaData({
        title: artTitle,
        description: artDesc,
        canonicalUrl: artUrl,
        imageUrl: selectedArticle.imageUrl,
        articleJsonLd: {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": selectedArticle.title,
          "description": selectedArticle.excerpt,
          "image": selectedArticle.imageUrl,
          "author": {
            "@type": "Person",
            "name": selectedArticle.author || "ნოდარ თოთაძე"
          },
          "publisher": {
            "@type": "Organization",
            "name": "NT ისტორიის მასწავლებელი",
            "logo": {
              "@type": "ImageObject",
              "url": "https://enjnwxpzafroxapksdlt.supabase.co/storage/v1/object/public/photos/logpng.png"
            }
          },
          "datePublished": selectedArticle.date || "2026-08-24",
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": artUrl
          }
        }
      });
      return;
    }

    switch (activeTab) {
      case 'home':
        updateSeoMetaData({
          title: 'NT ისტორიის მასწავლებელი — ეროვნული გამოცდების მოსამზადებელი',
          description: 'ისტორიის პედაგოგ ნოდარ თოთაძის მოსამზადებელი პორტალი. ეროვნული გამოცდების ტესტები, ისტორიული ბლოგი, რუკები და ვიდეო გაკვეთილები.',
          canonicalUrl: 'https://ntistoria.vercel.app/'
        });
        break;

      case 'blog':
        updateSeoMetaData({
          title: 'ისტორიული ბლოგი და სტატიები — NT ისტორიის მასწავლებელი',
          description: 'საქართველოსა და მსოფლიო ისტორიის სამეცნიერო და შემეცნებითი სტატიები, ისტორიული წყაროების ანალიზი და ეროვნული გამოცდების დამხმარე მასალები.',
          canonicalUrl: 'https://ntistoria.vercel.app/?tab=blog'
        });
        break;

      case 'tests':
        updateSeoMetaData({
          title: 'ისტორიის ტესტები და ეროვნული გამოცდები — NT ისტორია',
          description: 'ეროვნული გამოცდების ისტორიის ტესტები: არჩევითპასუხიანი, რუკები, წყაროები, ანალოგიები, ქრონოლოგია და ილუსტრაციები.',
          canonicalUrl: 'https://ntistoria.vercel.app/?tab=tests'
        });
        break;

      case 'videos':
        updateSeoMetaData({
          title: 'ვიდეო გაკვეთილები ისტორიაში — ეროვნული გამოცდები',
          description: 'ისტორიის ვიდეო გაკვეთილები, ლექციები და ეროვნული გამოცდების საგამოცდო მასალების მიმოხილვა ნოდარ თოთაძისგან.',
          canonicalUrl: 'https://ntistoria.vercel.app/?tab=videos'
        });
        break;

      case 'quizzes':
        updateSeoMetaData({
          title: 'ონლაინ ვიქტორინები და ქვიზები ისტორიაში — NT ისტორია',
          description: 'ინტერაქტიული ვიქტორინები და სწრაფი ქვიზები საქართველოსა და მსოფლიო ისტორიაში ეროვნული გამოცდებისთვის.',
          canonicalUrl: 'https://ntistoria.vercel.app/?tab=quizzes'
        });
        break;

      case 'contact':
        updateSeoMetaData({
          title: 'კონტაქტი — NT ისტორიის მასწავლებელი ნოდარ თოთაძე',
          description: 'დაუკავშირდით ისტორიის პედაგოგ ნოდარ თოთაძეს. ეროვნული გამოცდების მოსამზადებელი ჯგუფები, მისამართი და საკონტაქტო ინფორმაცია.',
          canonicalUrl: 'https://ntistoria.vercel.app/?tab=contact'
        });
        break;

      default:
        updateSeoMetaData({
          title: 'NT ისტორიის მასწავლებელი — ეროვნული გამოცდების მოსამზადებელი',
          description: 'ისტორიის პედაგოგ ნოდარ თოთაძის მოსამზადებელი პორტალი. ეროვნული გამოცდების ტესტები, ისტორიული ბლოგი, რუკები და ვიდეო გაკვეთილები.',
          canonicalUrl: 'https://ntistoria.vercel.app/'
        });
    }

    // Single Page Application GA4 Virtual Pageview Tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      let currentPath = '/';
      if (selectedArticle) {
        currentPath = `/?article=${encodeURIComponent(selectedArticle.slug || selectedArticle.id)}`;
      } else if (activeTab && activeTab !== 'home') {
        currentPath = `/?tab=${activeTab}`;
      }
      (window as any).gtag('config', 'G-VHKM6K967T', { page_path: currentPath });
    }
  }, [activeTab, selectedArticle]);

  useEffect(() => {
    // Process Supabase session (without forcing activeTab='admin' on refresh)
    const handleSession = async (session: any) => {
      if (session?.user) {
        const meta = session.user.user_metadata;
        const metaName = meta?.full_name || 
                     `${meta?.first_name || ''} ${meta?.last_name || ''}`.trim() || 
                     session.user.email?.split('@')[0] || 'მომხმარებელი';
        const userEmail = session.user.email || '';

        let finalName = metaName;
        try {
          const dbProfile = await fetchUserProfile(userEmail);
          if (dbProfile && dbProfile.full_name) {
            finalName = dbProfile.full_name;
          } else {
            await syncUserProfile({
              id: session.user.id,
              email: userEmail,
              full_name: metaName,
              avatar_url: meta?.avatar_url
            });
          }
        } catch (e) {}

        const userData = { name: finalName, email: userEmail };
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseArticle = () => {
    setSelectedArticle(null);
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
