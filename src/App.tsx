import React, { useState, useEffect, useCallback } from 'react';
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
import { UniversitiesView } from './views/UniversitiesView';
import { CollegesView } from './views/CollegesView';
import { InstitutionProfileView } from './views/InstitutionProfileView';
import { ProgramsView } from './views/ProgramsView';
import { TestRunnerModal } from './components/TestRunnerModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { SearchModal } from './components/SearchModal';
import { AuthModal } from './components/AuthModal';
import { StudentProfileModal } from './components/StudentProfileModal';
import { supabase } from './lib/supabase';
import { isAdminUser, fetchAllArticles, getInitialArticles, generateSlug } from './lib/blogService';
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
  const [allArticles, setAllArticles] = useState<Article[]>(() => getInitialArticles());
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedTest, setSelectedTest] = useState<HistoryTest | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoLesson | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [selectedInstitutionCode, setSelectedInstitutionCode] = useState<string | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

  // Route syncing helper
  const syncRouteWithState = useCallback((articlesList: Article[]) => {
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const queryArticle = searchParams.get('article');

    // 1. Institution Profile Routes (/universities/:code or /colleges/:code)
    if (pathname.startsWith('/universities/')) {
      const code = decodeURIComponent(pathname.replace('/universities/', '').replace(/\/$/, ''));
      setActiveTab('universities');
      setSelectedInstitutionCode(code);
      setSelectedArticle(null);
      return;
    }

    if (pathname === '/universities') {
      setActiveTab('universities');
      setSelectedInstitutionCode(null);
      setSelectedArticle(null);
      return;
    }

    if (pathname.startsWith('/colleges/')) {
      const code = decodeURIComponent(pathname.replace('/colleges/', '').replace(/\/$/, ''));
      setActiveTab('colleges');
      setSelectedInstitutionCode(code);
      setSelectedArticle(null);
      return;
    }

    if (pathname === '/colleges') {
      setActiveTab('colleges');
      setSelectedInstitutionCode(null);
      setSelectedArticle(null);
      return;
    }

    if (pathname === '/programs') {
      setActiveTab('programs');
      setSelectedInstitutionCode(null);
      setSelectedArticle(null);
      return;
    }

    if (pathname.startsWith('/blog/')) {
      const slugOrId = decodeURIComponent(pathname.replace('/blog/', '').replace(/\/$/, ''));
      const found = articlesList.find(a => {
        if (!a) return false;
        const aSlug = a.slug ? a.slug.trim() : '';
        const genSlug = generateSlug(a.title, a.id);
        const target = slugOrId.trim();
        return (
          a.id === target ||
          aSlug === target ||
          genSlug === target ||
          (a.title && generateSlug(a.title).startsWith(target)) ||
          (target && genSlug.startsWith(target))
        );
      });
      setActiveTab('blog');
      setSelectedInstitutionCode(null);
      if (found) {
        setSelectedArticle(found);
      } else {
        setSelectedArticle(null);
      }
      return;
    }

    if (pathname === '/blog') {
      setActiveTab('blog');
      setSelectedInstitutionCode(null);
      setSelectedArticle(null);
      return;
    }

    if (pathname === '/tests') {
      setActiveTab('tests');
      setSelectedInstitutionCode(null);
      setSelectedArticle(null);
      return;
    }

    if (pathname === '/videos') {
      setActiveTab('videos');
      setSelectedInstitutionCode(null);
      setSelectedArticle(null);
      return;
    }

    if (pathname.startsWith('/quizzes')) {
      const quizId = pathname.startsWith('/quizzes/')
        ? decodeURIComponent(pathname.replace('/quizzes/', '').replace(/\/$/, ''))
        : null;
      setActiveTab('quizzes');
      setSelectedInstitutionCode(null);
      setSelectedArticle(null);
      setSelectedQuizId(quizId);
      return;
    }

    if (pathname === '/contact') {
      setActiveTab('contact');
      setSelectedInstitutionCode(null);
      setSelectedArticle(null);
      return;
    }

    if (pathname === '/admin') {
      setActiveTab('admin');
      setSelectedInstitutionCode(null);
      setSelectedArticle(null);
      return;
    }

    if (queryArticle) {
      const decodedQuery = decodeURIComponent(queryArticle);
      const found = articlesList.find(a => a.slug === decodedQuery || a.id === decodedQuery || generateSlug(a.title, a.id) === decodedQuery);
      if (found) {
        setActiveTab('blog');
        setSelectedInstitutionCode(null);
        setSelectedArticle(found);
        return;
      }
    }

    const tabParam = searchParams.get('tab') as NavTab;
    if (tabParam) {
      setActiveTab(tabParam);
      setSelectedInstitutionCode(null);
      setSelectedArticle(null);
      return;
    }

    if (pathname === '/' || pathname === '') {
      setActiveTab('home');
      setSelectedInstitutionCode(null);
      setSelectedArticle(null);
    }
  }, []);

  // Fetch articles and sync route on mount
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      const fetched = await fetchAllArticles();
      if (isMounted) {
        setAllArticles(fetched);
        syncRouteWithState(fetched);
      }
    };
    init();

    const handlePopState = () => {
      syncRouteWithState(allArticles);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      isMounted = false;
      window.removeEventListener('popstate', handlePopState);
    };
  }, [syncRouteWithState]);

  // Dynamic SEO title, description, canonical & Open Graph manager
  useEffect(() => {
    if (selectedArticle) {
      const artTitle = `${selectedArticle.title} — NT ისტორიის მასწავლებელი`;
      const artDesc = selectedArticle.excerpt 
        ? (selectedArticle.excerpt.length > 155 ? `${selectedArticle.excerpt.slice(0, 155)}...` : selectedArticle.excerpt)
        : `წაიკითხეთ სტატია "${selectedArticle.title}" - NT ისტორიის მასწავლებელი ნოდარ თოთაძე.`;
      const postSlugOrId = selectedArticle.slug || selectedArticle.id;
      const artUrl = `https://ntistoria.vercel.app/blog/${encodeURIComponent(postSlugOrId)}`;

      updateSeoMetaData({
        title: artTitle,
        description: artDesc,
        canonicalUrl: artUrl,
        imageUrl: selectedArticle.imageUrl
      });
      return;
    }

    const domain = 'https://ntistoria.vercel.app';

    if (selectedInstitutionCode) {
      const cleanCode = selectedInstitutionCode.replace('#', '');
      const isCol = activeTab === 'colleges';
      const instTitle = isCol
        ? `კოლეჯი #${cleanCode} — პროფესიული პროგრამები, მისამართი | NT ისტორია`
        : `უნივერსიტეტი #${cleanCode} — აკადემიური პროგრამები, ფაკულტეტები, მისამართი | NT ისტორია`;

      updateSeoMetaData({
        title: instTitle,
        description: `იხილეთ დაწესებულების (#${cleanCode}) სრული აკადემიური და პროფესიული პროგრამები, ფაკულტეტები, კვოტები, სწავლის საფასური, მისამართი და ინტერაქტიული რუკა.`,
        canonicalUrl: `${domain}/${isCol ? 'colleges' : 'universities'}/${cleanCode}`,
        articleJsonLd: {
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "name": `უმაღლესი/პროფესიული სასწავლებელი #${cleanCode}`,
          "identifier": cleanCode,
          "url": `${domain}/${isCol ? 'colleges' : 'universities'}/${cleanCode}`
        }
      });
      return;
    }

    switch (activeTab) {
      case 'home':
        updateSeoMetaData({
          title: 'NT ისტორიის მასწავლებელი — ეროვნული გამოცდების მოსამზადებელი',
          description: 'ისტორიის პედაგოგ ნოდარ თოთაძის მოსამზადებელი პორტალი. ეროვნული გამოცდების ტესტები, ისტორიული ბლოგი, რუკები და ვიდეო გაკვეთილები.',
          canonicalUrl: `${domain}/`
        });
        break;

      case 'universities':
        updateSeoMetaData({
          title: 'საქართველოს უნივერსიტეტების სრული კატალოგი (2026) — უმაღლესი სასწავლებლები, რუკა, ფაკულტეტები | NT ისტორია',
          description: 'საქართველოს 120+ უნივერსიტეტის სრული კატალოგი: თსუ (001), ილიაუნი (010), სტუ (003), კავკასიის უნივერსიტეტი და სხვა. იპოვეთ აკადემიური პროგრამები, საგამოცდო კოეფიციენტები, მისამართები და ინტერაქტიული რუკა.',
          canonicalUrl: `${domain}/universities`,
          articleJsonLd: {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "საქართველოს უნივერსიტეტების კატალოგი",
            "description": "საქართველოს ავტორიზებული უნივერსიტეტების სრული ჩამონათვალი და აკადემიური პროგრამები"
          }
        });
        break;

      case 'colleges':
        updateSeoMetaData({
          title: 'საქართველოს კოლეჯები 2026 — პროფესიული სასწავლებლების კატალოგი, რუკა | NT ისტორია',
          description: 'საქართველოს ავტორიზებული პროფესიული კოლეჯების სრული კატალოგი, პროფესიული პროგრამები, სწავლის პირობები, მისამართები და ინტერაქტიული რუკა.',
          canonicalUrl: `${domain}/colleges`,
          articleJsonLd: {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "საქართველოს პროფესიული კოლეჯების კატალოგი",
            "description": "საქართველოს ავტორიზებული პროფესიული კოლეჯების ჩამონათვალი და პროფესიული პროგრამები"
          }
        });
        break;

      case 'programs':
        updateSeoMetaData({
          title: 'უნივერსიტეტების და კოლეჯების პროგრამების კატალოგი (2026) — 1000+ სპეციალობა | NT ისტორია',
          description: 'იპოვეთ 1000-ზე მეტი აკადემიური და პროფესიული პროგრამა: ბაკალავრიატი, მაგისტრატურა, პროფესიული განათლება. სწავლის საფასური, კვოტები, ფაკულტეტები და NAEC კოდები.',
          canonicalUrl: `${domain}/programs`,
          articleJsonLd: {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "საქართველოს უნივერსიტეტებისა და კოლეჯების პროგრამების კატალოგი",
            "description": "1000-ზე მეტი აკადემიური და პროფესიული პროგრამის ერთიანი ბაზა"
          }
        });
        break;

      case 'blog':
        updateSeoMetaData({
          title: 'ისტორიული ბლოგი და სტატიები — NT ისტორიის მასწავლებელი',
          description: 'საქართველოსა და მსოფლიო ისტორიის სამეცნიერო და შემეცნებითი სტატიები, ისტორიული წყაროების ანალიზი და ეროვნული გამოცდების დამხმარე მასალები.',
          canonicalUrl: `${domain}/blog`
        });
        break;

      case 'tests':
        updateSeoMetaData({
          title: 'ისტორიის ტესტები და ეროვნული გამოცდები — NT ისტორია',
          description: 'ეროვნული გამოცდების ისტორიის ტესტები: არჩევითპასუხიანი, რუკები, წყაროები, ანალოგიები, ქრონოლოგია და ილუსტრაციები.',
          canonicalUrl: `${domain}/tests`
        });
        break;

      case 'videos':
        updateSeoMetaData({
          title: 'ვიდეო გაკვეთილები ისტორიაში — ეროვნული გამოცდები',
          description: 'ისტორიის ვიდეო გაკვეთილები, ლექციები და ეროვნული გამოცდების საგამოცდო მასალების მიმოხილვა ნოდარ თოთაძისგან.',
          canonicalUrl: `${domain}/videos`
        });
        break;

      case 'quizzes':
        updateSeoMetaData({
          title: 'ონლაინ ვიქტორინები და ქვიზები ისტორიაში — NT ისტორია',
          description: 'ინტერაქტიული ვიქტორინები და სწრაფი ქვიზები საქართველოსა და მსოფლიო ისტორიაში ეროვნული გამოცდებისთვის.',
          canonicalUrl: `${domain}/quizzes`
        });
        break;

      case 'contact':
        updateSeoMetaData({
          title: 'კონტაქტი — NT ისტორიის მასწავლებელი ნოდარ თოთაძე',
          description: 'დაუკავშირდით ისტორიის პედაგოგ ნოდარ თოთაძეს. ეროვნული გამოცდების მოსამზადებელი ჯგუფები, მისამართი და საკონტაქტო ინფორმაცია.',
          canonicalUrl: `${domain}/contact`
        });
        break;

      default:
        updateSeoMetaData({
          title: 'NT ისტორიის მასწავლებელი — ეროვნული გამოცდების მოსამზადებელი',
          description: 'ისტორიის პედაგოგ ნოდარ თოთაძის მოსამზადებელი პორტალი. ეროვნული გამოცდების ტესტები, ისტორიული ბლოგი, რუკები და ვიდეო გაკვეთილები.',
          canonicalUrl: `${domain}/`
        });
    }

    if (typeof window !== 'undefined' && (window as any).gtag) {
      let currentPath = '/';
      if (selectedArticle) {
        currentPath = `/blog/${encodeURIComponent(selectedArticle.slug || selectedArticle.id)}`;
      } else if (selectedInstitutionCode) {
        currentPath = `/${activeTab}/${encodeURIComponent(selectedInstitutionCode.replace('#', ''))}`;
      } else if (activeTab && activeTab !== 'home') {
        currentPath = `/${activeTab}`;
      }
      (window as any).gtag('config', 'G-VHKM6K967T', { page_path: currentPath });
    }
  }, [activeTab, selectedArticle, selectedInstitutionCode]);

  useEffect(() => {
    // Process Supabase session
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

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

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
    setSelectedInstitutionCode(null);
    setActiveTab('blog');
    const slugOrId = encodeURIComponent(article.slug || article.id);
    const newPath = `/blog/${slugOrId}`;
    if (window.location.pathname !== newPath) {
      window.history.pushState({ articleId: article.id }, '', newPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseArticle = () => {
    setSelectedArticle(null);
    if (window.location.pathname !== '/blog') {
      window.history.pushState({}, '', '/blog');
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
    setSelectedArticle(null);
    setSelectedInstitutionCode(null);
    setActiveTab(tab);
    const newPath = tab === 'home' ? '/' : `/${tab}`;
    if (window.location.pathname !== newPath) {
      window.history.pushState({ tab }, '', newPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectInstitution = (code: string, type?: string) => {
    setSelectedArticle(null);
    setSelectedInstitutionCode(code);
    const cleanCode = code.replace('#', '');
    const isCol = type === 'კოლეჯი' || activeTab === 'colleges';
    const newPath = isCol ? `/colleges/${cleanCode}` : `/universities/${cleanCode}`;
    if (window.location.pathname !== newPath) {
      window.history.pushState({ institutionCode: code }, '', newPath);
    }
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
      <main className="flex-1 pt-20">
        {selectedArticle ? (
          <ArticleDetailView 
            article={selectedArticle}
            onBack={handleCloseArticle}
            onSelectRelated={(art) => handleOpenArticle(art)}
            allArticles={allArticles}
          />
        ) : selectedInstitutionCode ? (
          <InstitutionProfileView
            code={selectedInstitutionCode}
            onNavigateHome={() => handleTabChange('home')}
            onNavigateBack={() => {
              const backTab = activeTab === 'colleges' ? 'colleges' : 'universities';
              setSelectedInstitutionCode(null);
              handleTabChange(backTab);
            }}
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

            {activeTab === 'universities' && (
              <UniversitiesView
                onNavigateHome={() => handleTabChange('home')}
                onSelectUniversity={(code) => handleSelectInstitution(code, 'უნივერსიტეტი')}
              />
            )}

            {activeTab === 'colleges' && (
              <CollegesView
                onNavigateHome={() => handleTabChange('home')}
                onSelectCollege={(code) => handleSelectInstitution(code, 'კოლეჯი')}
              />
            )}

            {activeTab === 'programs' && (
              <ProgramsView
                onNavigateHome={() => handleTabChange('home')}
                onSelectInstitution={(code, type) => handleSelectInstitution(code, type)}
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
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            )}

            {activeTab === 'quizzes' && (
              <QuizzesView
                user={user}
                onOpenAuth={() => setIsAuthOpen(true)}
                initialQuizId={selectedQuizId}
              />
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
            handleTabChange('admin');
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
