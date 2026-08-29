import React, { useState, useEffect, useMemo } from 'react';
import { University } from '../types';
import { fetchInstitutions } from '../lib/catalogService';
import { GeorgiaMap } from '../components/GeorgiaMap';
import { Search, MapPin, GraduationCap, ChevronRight, RotateCcw, Building2, BookOpen, ArrowRight, Loader2 } from 'lucide-react';

interface UniversitiesViewProps {
  onNavigateHome: () => void;
  onSelectUniversity: (code: string) => void;
  initialQuery?: string;
  initialCity?: string;
  initialStatus?: string;
}

export const UniversitiesView: React.FC<UniversitiesViewProps> = ({
  onNavigateHome,
  onSelectUniversity,
  initialQuery = '',
  initialCity = '',
  initialStatus = ''
}) => {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);

  const [hoveredCode, setHoveredCode] = useState<string | undefined>();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(false);

    fetchInstitutions('უნივერსიტეტი')
      .then(data => {
        if (mounted) {
          setUniversities(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to load universities:', err);
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Update URL Query Parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedCity) params.set('location', selectedCity);
    if (selectedStatus) params.set('status', selectedStatus);

    const queryString = params.toString();
    const newHash = `#universities${queryString ? `?${queryString}` : ''}`;
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, '', newHash);
    }
  }, [searchQuery, selectedCity, selectedStatus]);

  // Extract distinct cities for dropdown
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    universities.forEach(u => {
      if (u.city) set.add(u.city);
    });
    return Array.from(set).sort();
  }, [universities]);

  // Filter Universities
  const filteredUniversities = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return universities.filter(u => {
      // 1. Text Search (Name, Code, Address, City, Status)
      const matchesSearch = !q || (
        u.name.toLowerCase().includes(q) ||
        u.code.toLowerCase().includes(q) ||
        (u.address && u.address.toLowerCase().includes(q)) ||
        (u.city && u.city.toLowerCase().includes(q)) ||
        (u.status && u.status.toLowerCase().includes(q))
      );

      // 2. City Filter
      const matchesCity = !selectedCity || u.city === selectedCity;

      // 3. Status Filter
      const matchesStatus = !selectedStatus || u.status === selectedStatus;

      return matchesSearch && matchesCity && matchesStatus;
    });
  }, [universities, searchQuery, selectedCity, selectedStatus]);

  // Pagination State (24 per page for lightweight rendering)
  const ITEMS_PER_PAGE = 24;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCity, selectedStatus]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCity('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredUniversities.length / ITEMS_PER_PAGE) || 1;
  const paginatedUniversities = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUniversities.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUniversities, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 450, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-[#666666]">
        <button 
          onClick={onNavigateHome} 
          className="hover:text-[#C79B3A] transition-colors cursor-pointer"
        >
          მთავარი
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-[#C79B3A]" />
        <span className="text-[#0D1B2A] font-bold">უნივერსიტეტები</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border-2 border-[#E6DDCB] shadow-sm space-y-3 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF8F3] border border-[#C79B3A]/40 flex items-center justify-center text-[#C79B3A]">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#0D1B2A]">
              უნივერსიტეტები
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] font-medium">
              საქართველოს უმაღლესი სასწავლებლების სრული აკადემიური კატალოგი
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-[#E6DDCB] shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Flexible Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-[#C79B3A] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 მოძებნე უნივერსიტეტი, კოდი, ქალაქი..."
              className="w-full bg-[#FAF8F3] border border-[#E6DDCB] focus:border-[#C79B3A] rounded-xl pl-11 pr-4 py-3 text-xs font-semibold text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#C79B3A]/30 transition-all placeholder:text-[#8A8A8A]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8A8A8A] hover:text-[#0D1B2A] font-bold px-1.5 py-0.5 rounded"
              >
                ✕
              </button>
            )}
          </div>

          {/* City Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-[#FAF8F3] border border-[#E6DDCB] focus:border-[#C79B3A] rounded-xl px-4 py-3 text-xs font-semibold text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#C79B3A]/30 transition-all cursor-pointer"
            >
              <option value="">ყველა ქალაქი</option>
              {availableCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-[#FAF8F3] border border-[#E6DDCB] focus:border-[#C79B3A] rounded-xl px-4 py-3 text-xs font-semibold text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#C79B3A]/30 transition-all cursor-pointer"
            >
              <option value="">ყველა სტატუსი</option>
              <option value="სახელმწიფო">🎓 სახელმწიფო</option>
              <option value="კერძო">🏢 კერძო</option>
            </select>
          </div>

        </div>

        {/* Active Filters summary & Reset */}
        {(searchQuery || selectedCity || selectedStatus) && (
          <div className="flex items-center justify-between pt-2 border-t border-[#E6DDCB]/60 text-xs">
            <span className="text-[#666666] font-medium">
              აქტიური ფილტრი: <strong className="text-[#0D1B2A]">{filteredUniversities.length}</strong> შედეგი
            </span>
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 text-rose-600 hover:text-rose-800 font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ფილტრების გასუფთავება</span>
            </button>
          </div>
        )}
      </div>

      {/* Georgia Interactive Map */}
      {!loading && !error && (
        <GeorgiaMap
          institutions={filteredUniversities}
          onSelectInstitution={onSelectUniversity}
          selectedCode={hoveredCode}
          height="400px"
        />
      )}

      {/* Result Counter Header */}
      <div className="flex items-center justify-between border-b border-[#E6DDCB] pb-4">
        <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
          ნაპოვნია: <span className="text-[#C79B3A]">{filteredUniversities.length}</span> უნივერსიტეტი
        </h2>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-20 text-center space-y-4">
          <Loader2 className="w-10 h-10 text-[#C79B3A] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#666666]">უნივერსიტეტები იტვირთება Supabase ბაზიდან...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-4 max-w-lg mx-auto">
          <p className="text-sm font-bold text-rose-800">მონაცემების ჩატვირთვა ვერ მოხერხდა.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-rose-700 text-white text-xs font-bold uppercase rounded-xl hover:bg-rose-800 transition-colors"
          >
            თავიდან ცდა
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredUniversities.length === 0 && (
        <div className="bg-white p-12 rounded-3xl border-2 border-[#E6DDCB] text-center space-y-4 max-w-md mx-auto">
          <Building2 className="w-12 h-12 text-[#C79B3A] mx-auto opacity-50" />
          <h3 className="font-serif font-bold text-lg text-[#0D1B2A]">მითითებული კრიტერიუმებით უნივერსიტეტი ვერ მოიძებნა</h3>
          <p className="text-xs text-[#666666]">სცადეთ შეცვალოთ საძიებო ტექსტი ან ფილტრები.</p>
          <button
            onClick={handleResetFilters}
            className="px-6 py-2.5 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer"
          >
            ფილტრების გასუფთავება
          </button>
        </div>
      )}

      {/* University Cards Grid */}
      {!loading && !error && filteredUniversities.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedUniversities.map((uni) => {
              const cleanCode = uni.code.replace('#', '');
              return (
                <div
                  key={uni.id}
                  onMouseEnter={() => setHoveredCode(uni.code)}
                  onMouseLeave={() => setHoveredCode(undefined)}
                  onClick={() => onSelectUniversity(uni.code)}
                  className="bg-white rounded-3xl border-2 border-[#E6DDCB] hover:border-[#C79B3A] p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-5 cursor-pointer group relative overflow-hidden"
                >
                  {/* Logo & Status / Code Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-[#FAF8F3] border border-[#E6DDCB] p-2 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {uni.logo_url ? (
                        <img src={uni.logo_url} alt={uni.name} className="w-full h-full object-contain rounded-lg" />
                      ) : (
                        <GraduationCap className="w-8 h-8 text-[#C79B3A]" />
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[11px] font-mono font-bold bg-[#FAF8F3] border border-[#C79B3A]/40 text-[#C79B3A] px-2.5 py-0.5 rounded-lg shadow-xs">
                        {uni.code}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full border ${
                        uni.status === 'სახელმწიფო' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {uni.status || 'უნივერსიტეტი'}
                      </span>
                    </div>
                  </div>

                  {/* Name & Location Info */}
                  <div className="space-y-2 flex-1">
                    <h3 className="font-serif font-bold text-base sm:text-lg text-[#0D1B2A] group-hover:text-[#C79B3A] transition-colors leading-snug line-clamp-2">
                      {uni.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-[#666666] font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#C79B3A] shrink-0" />
                      <span>{uni.city || uni.address || 'საქართველო'}</span>
                    </div>
                  </div>

                  {/* Programs count & Detail CTA Button */}
                  <div className="pt-4 border-t border-[#E6DDCB]/60 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#0D1B2A]">
                      <BookOpen className="w-4 h-4 text-[#C79B3A]" />
                      <span>{uni.program_count || 0} პროგრამა</span>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0D1B2A] group-hover:text-[#C79B3A] transition-colors">
                      <span>დეტალურად</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-white p-5 rounded-3xl border-2 border-[#E6DDCB] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
              <div className="text-xs text-[#666666] font-medium text-center sm:text-left">
                გვერდი <strong className="text-[#0D1B2A]">{currentPage}</strong> / <strong>{totalPages}</strong> (სულ <strong className="text-[#C79B3A]">{filteredUniversities.length}</strong> უნივერსიტეტი)
              </div>

              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3.5 py-2 bg-[#FAF8F3] hover:bg-[#0D1B2A] text-[#0D1B2A] hover:text-white border border-[#E6DDCB] rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  ← წინა
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentPage === p
                        ? 'bg-[#0D1B2A] text-[#FAF8F3] border-2 border-[#C79B3A] shadow-sm'
                        : 'bg-[#FAF8F3] hover:bg-[#E6DDCB]/60 text-[#0D1B2A] border border-[#E6DDCB]'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-2 bg-[#FAF8F3] hover:bg-[#0D1B2A] text-[#0D1B2A] hover:text-white border border-[#E6DDCB] rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  შემდეგი →
                </button>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};
