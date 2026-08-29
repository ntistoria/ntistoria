import React, { useState, useEffect, useMemo } from 'react';
import { ProgramCatalogItem } from '../types';
import { fetchAllProgramsWithInstitutions } from '../lib/catalogService';
import { Search, ChevronRight, Award, RotateCcw, BookOpen, MapPin, Users, Coins, Languages, GraduationCap, Building2, ArrowRight, Loader2 } from 'lucide-react';

interface ProgramsViewProps {
  onNavigateHome: () => void;
  onSelectInstitution: (code: string, type?: string) => void;
  initialQuery?: string;
  initialInstType?: string;
  initialProgType?: string;
}

export const ProgramsView: React.FC<ProgramsViewProps> = ({
  onNavigateHome,
  onSelectInstitution,
  initialQuery = '',
  initialInstType = '',
  initialProgType = ''
}) => {
  const [programs, setPrograms] = useState<ProgramCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedInstType, setSelectedInstType] = useState(initialInstType); // '' | 'უნივერსიტეტი' | 'კოლეჯი'
  const [selectedProgType, setSelectedProgType] = useState(initialProgType); // '' | 'ბაკალავრიატი' | 'პროფესიული' etc.
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // Fee & Quota Range Filters
  const [minFee, setMinFee] = useState<string>('');
  const [maxFee, setMaxFee] = useState<string>('');
  const [minQuota, setMinQuota] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(false);

    fetchAllProgramsWithInstitutions()
      .then(data => {
        if (mounted) {
          setPrograms(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Error fetching programs:', err);
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Sync state to URL hash
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedInstType) params.set('inst_type', selectedInstType);
    if (selectedProgType) params.set('prog_type', selectedProgType);

    const queryString = params.toString();
    const newHash = `#programs${queryString ? `?${queryString}` : ''}`;
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, '', newHash);
    }
  }, [searchQuery, selectedInstType, selectedProgType]);

  // Extract distinct values for filter dropdowns
  const availableFaculties = useMemo(() => {
    const set = new Set<string>();
    programs.forEach(p => { if (p.faculty) set.add(p.faculty); });
    return Array.from(set).sort();
  }, [programs]);

  const availableCities = useMemo(() => {
    const set = new Set<string>();
    programs.forEach(p => { if (p.institution_city) set.add(p.institution_city); });
    return Array.from(set).sort();
  }, [programs]);

  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    programs.forEach(p => { if (p.language) set.add(p.language); });
    return Array.from(set).sort();
  }, [programs]);

  const availableProgTypes = useMemo(() => {
    const set = new Set<string>();
    programs.forEach(p => { if (p.program_type) set.add(p.program_type); });
    return Array.from(set).sort();
  }, [programs]);

  // Filter Programs
  const filteredPrograms = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const minFeeVal = minFee !== '' ? parseFloat(minFee) : NaN;
    const maxFeeVal = maxFee !== '' ? parseFloat(maxFee) : NaN;
    const minQuotaVal = minQuota !== '' ? parseInt(minQuota, 10) : NaN;

    return programs.filter(p => {
      // 1. Text Search (Program name, spec code, faculty, institution name, city, program type)
      const matchesSearch = !q || (
        p.name.toLowerCase().includes(q) ||
        (p.spec_code && p.spec_code.toLowerCase().includes(q)) ||
        (p.faculty && p.faculty.toLowerCase().includes(q)) ||
        (p.institution_name && p.institution_name.toLowerCase().includes(q)) ||
        (p.institution_city && p.institution_city.toLowerCase().includes(q)) ||
        (p.program_type && p.program_type.toLowerCase().includes(q))
      );

      // 2. Institution Type Filter
      const matchesInstType = !selectedInstType || p.institution_type === selectedInstType;

      // 3. Program Type Filter
      const matchesProgType = !selectedProgType || p.program_type === selectedProgType;

      // 4. Language Filter
      const matchesLanguage = !selectedLanguage || p.language === selectedLanguage;

      // 5. Faculty Filter
      const matchesFaculty = !selectedFaculty || p.faculty === selectedFaculty;

      // 6. City Filter
      const matchesCity = !selectedCity || p.institution_city === selectedCity;

      // 7. Fee Range Filter
      const fee = p.tuition_fee || 0;
      const matchesMinFee = isNaN(minFeeVal) || fee >= minFeeVal;
      const matchesMaxFee = isNaN(maxFeeVal) || fee <= maxFeeVal;

      // 8. Quota Filter
      const quota = p.quota || 0;
      const matchesMinQuota = isNaN(minQuotaVal) || quota >= minQuotaVal;

      return matchesSearch && matchesInstType && matchesProgType && matchesLanguage && matchesFaculty && matchesCity && matchesMinFee && matchesMaxFee && matchesMinQuota;
    });
  }, [programs, searchQuery, selectedInstType, selectedProgType, selectedLanguage, selectedFaculty, selectedCity, minFee, maxFee, minQuota]);

  // Pagination State (50 programs per page)
  const ITEMS_PER_PAGE = 50;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedInstType, selectedProgType, selectedLanguage, selectedFaculty, selectedCity, minFee, maxFee, minQuota]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedInstType('');
    setSelectedProgType('');
    setSelectedLanguage('');
    setSelectedFaculty('');
    setSelectedCity('');
    setMinFee('');
    setMaxFee('');
    setMinQuota('');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredPrograms.length / ITEMS_PER_PAGE) || 1;
  const paginatedPrograms = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPrograms.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPrograms, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 400, behavior: 'smooth' });
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
        <span className="text-[#0D1B2A] font-bold">პროგრამების კატალოგი</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border-2 border-[#E6DDCB] shadow-sm space-y-3 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF8F3] border border-[#C79B3A]/40 flex items-center justify-center text-[#C79B3A]">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#0D1B2A]">
              პროგრამების კატალოგი
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] font-medium">
              საქართველოს უნივერსიტეტებისა და კოლეჯების სრული აკადემიური & პროფესიული პროგრამები
            </p>
          </div>
        </div>
      </div>

      {/* Unified Search Input */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-[#E6DDCB] shadow-sm space-y-5">
        <div className="relative">
          <Search className="w-5 h-5 text-[#C79B3A] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 მოძებნე ნებისმიერი პროგრამა, სპეციალობა, ფაკულტეტი, უნივერსიტეტი..."
            className="w-full bg-[#FAF8F3] border-2 border-[#E6DDCB] focus:border-[#C79B3A] rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold text-[#0D1B2A] focus:outline-none focus:ring-2 focus:ring-[#C79B3A]/30 transition-all placeholder:text-[#8A8A8A]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8A8A8A] hover:text-[#0D1B2A] px-2 py-1 bg-gray-200 rounded-lg"
            >
              გასუფთავება
            </button>
          )}
        </div>

        {/* Detailed Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          
          {/* Institution Type Filter */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-1 block">
              დაწესებულების ტიპი
            </label>
            <select
              value={selectedInstType}
              onChange={(e) => setSelectedInstType(e.target.value)}
              className="w-full bg-[#FAF8F3] border border-[#E6DDCB] focus:border-[#C79B3A] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#0D1B2A] focus:outline-none cursor-pointer"
            >
              <option value="">ყველა (უნივერსიტეტი + კოლეჯი)</option>
              <option value="უნივერსიტეტი">🎓 უნივერსიტეტები</option>
              <option value="კოლეჯი">📚 კოლეჯები</option>
            </select>
          </div>

          {/* Program Type Filter */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-1 block">
              პროგრამის ტიპი
            </label>
            <select
              value={selectedProgType}
              onChange={(e) => setSelectedProgType(e.target.value)}
              className="w-full bg-[#FAF8F3] border border-[#E6DDCB] focus:border-[#C79B3A] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#0D1B2A] focus:outline-none cursor-pointer"
            >
              <option value="">ყველა ტიპი</option>
              {availableProgTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-1 block">
              სწავლების ენა
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full bg-[#FAF8F3] border border-[#E6DDCB] focus:border-[#C79B3A] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#0D1B2A] focus:outline-none cursor-pointer"
            >
              <option value="">ყველა ენა</option>
              {availableLanguages.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Faculty Filter */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-1 block">
              ფაკულტეტი / მიმართულება
            </label>
            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="w-full bg-[#FAF8F3] border border-[#E6DDCB] focus:border-[#C79B3A] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#0D1B2A] focus:outline-none cursor-pointer"
            >
              <option value="">ყველა ფაკულტეტი</option>
              {availableFaculties.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-1 block">
              მდებარეობა / ქალაქი
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-[#FAF8F3] border border-[#E6DDCB] focus:border-[#C79B3A] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#0D1B2A] focus:outline-none cursor-pointer"
            >
              <option value="">ყველა ქალაქი</option>
              {availableCities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Fee Range Filters */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-1 block">
              მაქს. სწავლის საფასური (₾)
            </label>
            <input
              type="number"
              value={maxFee}
              onChange={(e) => setMaxFee(e.target.value)}
              placeholder="მაგ: 2250"
              className="w-full bg-[#FAF8F3] border border-[#E6DDCB] focus:border-[#C79B3A] rounded-xl px-3 py-2 text-xs font-semibold text-[#0D1B2A] focus:outline-none placeholder:text-[#8A8A8A]"
            />
          </div>

          {/* Quota Filter */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#666666] mb-1 block">
              მინ. კვოტა (ადგილი)
            </label>
            <input
              type="number"
              value={minQuota}
              onChange={(e) => setMinQuota(e.target.value)}
              placeholder="მაგ: 50"
              className="w-full bg-[#FAF8F3] border border-[#E6DDCB] focus:border-[#C79B3A] rounded-xl px-3 py-2 text-xs font-semibold text-[#0D1B2A] focus:outline-none placeholder:text-[#8A8A8A]"
            />
          </div>

          {/* Reset Filters */}
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ფილტრების გასუფთავება</span>
            </button>
          </div>

        </div>
      </div>

      {/* Result Counter Header */}
      <div className="flex items-center justify-between border-b border-[#E6DDCB] pb-4">
        <h2 className="font-serif font-bold text-xl text-[#0D1B2A]">
          ნაპოვნია: <span className="text-[#C79B3A]">{filteredPrograms.length}</span> პროგრამა
        </h2>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-24 text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#C79B3A] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#666666]">პროგრამები იტვირთება Supabase ბაზიდან...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-4 max-w-lg mx-auto">
          <p className="text-sm font-bold text-rose-800">მონაცემების ჩატვირთვა ვერ მოხერხდა.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-rose-700 text-white text-xs font-bold uppercase rounded-xl hover:bg-rose-800 transition-colors cursor-pointer"
          >
            თავიდან ცდა
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredPrograms.length === 0 && (
        <div className="bg-white p-12 rounded-3xl border-2 border-[#E6DDCB] text-center space-y-4 max-w-md mx-auto">
          <BookOpen className="w-12 h-12 text-[#C79B3A] mx-auto opacity-50" />
          <h3 className="font-serif font-bold text-lg text-[#0D1B2A]">მითითებული კრიტერიუმებით პროგრამა ვერ მოიძებნა</h3>
          <p className="text-xs text-[#666666]">სცადეთ შეცვალოთ საძიებო ტექსტი ან ფილტრები.</p>
          <button
            onClick={handleResetFilters}
            className="px-6 py-2.5 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer"
          >
            ფილტრების გასუფთავება
          </button>
        </div>
      )}

      {/* Program Cards Grid */}
      {!loading && !error && filteredPrograms.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedPrograms.map((prog) => (
              <div
                key={prog.id}
                className="bg-white rounded-3xl border-2 border-[#E6DDCB] hover:border-[#C79B3A] p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 group relative"
              >
                {/* Institution Logo & Type Badge */}
                <div className="flex items-start justify-between gap-3 border-b border-[#E6DDCB]/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF8F3] border border-[#E6DDCB] p-1 flex items-center justify-center shrink-0">
                      {prog.institution_logo ? (
                        <img src={prog.institution_logo} alt={prog.institution_name} className="w-full h-full object-contain rounded-lg" />
                      ) : (
                        <GraduationCap className="w-5 h-5 text-[#C79B3A]" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-[#C79B3A] line-clamp-1">
                        {prog.institution_name}
                      </span>
                      <span className="text-[9px] font-mono text-[#8A8A8A] block">
                        {prog.institution_city || 'საქართველო'}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 border ${
                    prog.institution_type === 'კოლეჯი' 
                      ? 'bg-purple-50 text-purple-700 border-purple-200' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {prog.institution_type || 'უნივერსიტეტი'}
                  </span>
                </div>

                {/* Title & Faculty */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold bg-[#FAF8F3] border border-[#C79B3A]/40 text-[#C79B3A] px-2 py-0.5 rounded-md">
                      {prog.spec_code || `#${prog.id}`}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#0D1B2A] text-white">
                      {prog.program_type || 'ბაკალავრიატი'}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-base text-[#0D1B2A] group-hover:text-[#C79B3A] transition-colors leading-snug">
                    🎓 {prog.name}
                  </h3>

                  {prog.faculty && (
                    <p className="text-xs font-medium text-[#666666]">
                      ფაკულტეტი: <strong className="text-[#0D1B2A]">{prog.faculty}</strong>
                    </p>
                  )}
                </div>

                {/* Details & CTA Button */}
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-[#0D1B2A]">
                    <div className="flex items-center gap-1 bg-[#FAF8F3] px-2.5 py-1.5 rounded-xl border border-[#E6DDCB]">
                      <Languages className="w-3.5 h-3.5 text-[#C79B3A]" />
                      <span>{prog.language || 'ქართული'}</span>
                    </div>

                    <div className="flex items-center gap-1 bg-[#FAF8F3] px-2.5 py-1.5 rounded-xl border border-[#E6DDCB]">
                      <Users className="w-3.5 h-3.5 text-[#C79B3A]" />
                      <span>{prog.quota || 0} ადგილი</span>
                    </div>

                    <div className="col-span-2 flex items-center justify-between bg-[#FAF8F3] px-3 py-1.5 rounded-xl border border-[#E6DDCB]">
                      <div className="flex items-center gap-1 text-[#666666]">
                        <Coins className="w-3.5 h-3.5 text-[#C79B3A]" />
                        <span>საფასური:</span>
                      </div>
                      <span className="font-mono font-bold text-[#C79B3A]">
                        {prog.tuition_fee > 0 ? `${prog.tuition_fee} ₾` : 'უფასო'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectInstitution(prog.institution_code, prog.institution_type)}
                    className="w-full py-2 bg-[#0D1B2A] hover:bg-[#C79B3A] text-white hover:text-[#0D1B2A] text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>დაწესებულების ნახვა</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))}
          </div>

          {/* Pagination Controls Bar */}
          {totalPages > 1 && (
            <div className="bg-white p-5 rounded-3xl border-2 border-[#E6DDCB] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
              <div className="text-xs text-[#666666] font-medium text-center sm:text-left">
                გვერდი <strong className="text-[#0D1B2A]">{currentPage}</strong> / <strong>{totalPages}</strong> (სულ <strong className="text-[#C79B3A]">{filteredPrograms.length}</strong> პროგრამა)
              </div>

              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3.5 py-2 bg-[#FAF8F3] hover:bg-[#0D1B2A] text-[#0D1B2A] hover:text-white border border-[#E6DDCB] rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  ← წინა
                </button>

                {/* Generate page numbers array */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2))
                  .map((p, idx, arr) => {
                    const prevPage = arr[idx - 1];
                    const showEllipsis = prevPage && p - prevPage > 1;

                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && (
                          <span className="px-1 text-xs text-[#8A8A8A]">...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(p)}
                          className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            currentPage === p
                              ? 'bg-[#0D1B2A] text-[#FAF8F3] border-2 border-[#C79B3A] shadow-sm'
                              : 'bg-[#FAF8F3] hover:bg-[#E6DDCB]/60 text-[#0D1B2A] border border-[#E6DDCB]'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

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
