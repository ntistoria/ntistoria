import React, { useState, useEffect } from 'react';
import { NavTab } from '../types';
import { Logo } from './Logo';
import { Menu, X, BookOpen, Search, ArrowRight, User, ShieldCheck } from 'lucide-react';
import { isAdminUser } from '../lib/blogService';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenSearch?: () => void;
  onOpenAuth?: () => void;
  onOpenProfile?: () => void;
  user?: { name: string; email: string } | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenSearch, onOpenAuth, onOpenProfile, user, onLogout }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAdmin = isAdminUser(user);

  const baseNavItems: { id: NavTab; label: string }[] = [
    { id: 'home', label: 'მთავარი' },
    { id: 'universities', label: 'უნივერსიტეტები' },
    { id: 'colleges', label: 'კოლეჯები' },
    { id: 'programs', label: 'პროგრამები' },
    { id: 'blog', label: 'ბლოგი' },
    { id: 'tests', label: 'ტესტები' },
    { id: 'videos', label: 'ვიდეოთეკა' },
    { id: 'quizzes', label: 'ქვიზები' },
    { id: 'contact', label: 'კონტაქტი' },
  ];

  const navItems = baseNavItems;


  const handleNavClick = (id: NavTab) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md border-b border-[#E6DDCB] shadow-sm' 
          : 'bg-white/90 backdrop-blur-sm border-b border-[#E6DDCB]'
      }`}
    >
      {/* Top Branding Line */}
      <div className="h-1 bg-[#C79B3A] w-full" />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-4">
        <div className="flex items-center justify-between">
          
          {/* Logo Left */}
          <Logo 
            variant="compact" 
            onClick={() => handleNavClick('home')} 
          />

          {/* Menu Center (Desktop) */}
          <nav className="hidden md:flex items-center gap-10 text-[11px] uppercase tracking-[0.15em] font-semibold text-[#666666]">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative py-1 transition-colors duration-200 cursor-pointer ${
                    isActive 
                      ? 'text-[#13253D] border-b border-[#C79B3A] pb-1 font-bold' 
                      : 'hover:text-[#13253D]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                className="p-2 text-[#666666] hover:text-[#13253D] hover:bg-[#F5F2EA] rounded-[2px] border border-[#E6DDCB] transition-colors cursor-pointer"
                title="ძებნა"
              >
                <Search className="w-4 h-4 text-[#C79B3A]" />
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => handleNavClick('admin')}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#0D1B2A] bg-[#C79B3A] hover:bg-[#E6C86B] px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>ადმინ პანელი</span>
                  </button>
                )}

                {onOpenProfile && (
                  <button
                    onClick={onOpenProfile}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#13253D] bg-[#F5F2EA] hover:bg-[#E6DDCB]/60 px-3 py-1.5 rounded-lg border border-[#E6DDCB] cursor-pointer transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-[#C79B3A]" />
                    <span>{user.name}</span>
                  </button>
                )}

                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-[#666666] hover:text-[#13253D] transition-colors cursor-pointer"
                >
                  გამოსვლა
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-6 py-2.5 bg-[#13253D] text-[#FAF8F3] text-[11px] uppercase tracking-widest rounded-[2px] font-bold hover:bg-[#C79B3A] hover:text-[#0D1B2A] transition-all cursor-pointer shadow-sm active:scale-[0.98]"
              >
                ავტორიზაცია
              </button>
            )}
          </div>


          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#13253D] hover:bg-[#F5F2EA] rounded-md transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-[#C79B3A]" /> : <Menu className="w-6 h-6 text-[#13253D]" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E6DDCB] px-4 pt-3 pb-6 shadow-xl animate-in fade-in duration-200">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg text-left text-base font-medium transition-colors ${
                    isActive 
                      ? 'bg-[#F5F2EA] text-[#0D1B2A] font-semibold border-l-2 border-[#C79B3A]' 
                      : 'text-[#666666] hover:bg-[#F5F2EA]/60 hover:text-[#0D1B2A]'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <ArrowRight className="w-4 h-4 text-[#C79B3A]" />}
                </button>
              );
            })}
            
            <div className="pt-3 mt-2 border-t border-[#E6DDCB]">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-2 pb-1">
                    <span className="text-sm font-semibold text-[#13253D]">{user.name}</span>
                    <button
                      onClick={() => {
                        if (onLogout) onLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                    >
                      გამოსვლა
                    </button>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => { handleNavClick('admin'); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 bg-[#C79B3A] hover:bg-[#E6C86B] text-[#0D1B2A] font-bold text-sm rounded-xl cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>ადმინ პანელი</span>
                    </button>
                  )}
                  {onOpenProfile && (
                    <button
                      onClick={() => { if (onOpenProfile) onOpenProfile(); setMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 bg-[#F5F2EA] hover:bg-[#E6DDCB] text-[#13253D] font-semibold text-sm rounded-xl border border-[#E6DDCB] cursor-pointer"
                    >
                      <User className="w-4 h-4 text-[#C79B3A]" />
                      <span>პროფილი</span>
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (onOpenAuth) onOpenAuth();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#C79B3A] hover:bg-[#D4AF37] text-[#0D1B2A] font-semibold text-base py-3 rounded-[10px] shadow-sm cursor-pointer"
                >
                  <User className="w-5 h-5" />
                  <span>ავტორიზაცია</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
