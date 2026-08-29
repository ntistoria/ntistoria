import React, { useState, useEffect } from 'react';
import { University, Specialty } from '../types';
import { fetchInstitutionByCode, fetchSpecialtiesByInstitutionCode } from '../lib/catalogService';
import { ChevronRight, ArrowLeft, MapPin, Globe, Mail, GraduationCap, BookOpen, Users, Coins, Languages, Award, Loader2, Building2 } from 'lucide-react';

interface InstitutionProfileViewProps {
  code: string;
  onNavigateHome: () => void;
  onNavigateBack: () => void;
}

export const InstitutionProfileView: React.FC<InstitutionProfileViewProps> = ({
  code,
  onNavigateHome,
  onNavigateBack
}) => {
  const [institution, setInstitution] = useState<University | null>(null);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(false);

    Promise.all([
      fetchInstitutionByCode(code),
      fetchSpecialtiesByInstitutionCode(code)
    ]).then(([instData, specData]) => {
      if (mounted) {
        setInstitution(instData);
        setSpecialties(specData);
        setLoading(false);
      }
    }).catch(err => {
      console.error('Error loading institution profile:', err);
      if (mounted) {
        setError(true);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [code]);

  const isCollege = institution?.type === 'კოლეჯი';

  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6DDCB] pb-4">
        <nav className="flex items-center gap-2 text-xs font-semibold text-[#666666]">
          <button 
            onClick={onNavigateHome} 
            className="hover:text-[#C79B3A] transition-colors cursor-pointer"
          >
            მთავარი
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-[#C79B3A]" />
          <button 
            onClick={onNavigateBack} 
            className="hover:text-[#C79B3A] transition-colors cursor-pointer"
          >
            {isCollege ? 'კოლეჯები' : 'უნივერსიტეტები'}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-[#C79B3A]" />
          <span className="text-[#0D1B2A] font-bold line-clamp-1">
            {institution?.name || code}
          </span>
        </nav>

        <button
          onClick={onNavigateBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#FAF8F3] hover:bg-[#0D1B2A] text-[#0D1B2A] hover:text-white border border-[#E6DDCB] text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← {isCollege ? 'კოლეჯების სიაში' : 'უნივერსიტეტების სიაში'} დაბრუნება</span>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-24 text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#C79B3A] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#666666]">ინფორმაცია იტვირთება Supabase ბაზიდან...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-4 max-w-lg mx-auto">
          <p className="text-sm font-bold text-rose-800">ინფორმაციის ჩატვირთვა ვერ მოხერხდა.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-rose-700 text-white text-xs font-bold uppercase rounded-xl hover:bg-rose-800 transition-colors cursor-pointer"
          >
            თავიდან ცდა
          </button>
        </div>
      )}

      {/* Profile Card Header */}
      {!loading && !error && institution && (
        <>
          <div className="bg-white p-6 sm:p-10 rounded-3xl border-2 border-[#C79B3A] shadow-xl space-y-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              
              {/* Institution Logo */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#FAF8F3] border-2 border-[#E6DDCB] p-3 flex items-center justify-center shrink-0 shadow-md">
                {institution.logo_url ? (
                  <img src={institution.logo_url} alt={institution.name} className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <GraduationCap className="w-12 h-12 text-[#C79B3A]" />
                )}
              </div>

              {/* Institution Meta */}
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-[#0D1B2A] text-[#FAF8F3] px-3 py-1 rounded-full">
                    კოდი: {institution.code}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#FAF8F3] border border-[#C79B3A]/40 text-[#C79B3A]">
                    {institution.type || (isCollege ? 'კოლეჯი' : 'უნივერსიტეტი')}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {institution.status || 'სახელმწიფო'}
                  </span>
                </div>

                <h1 className="font-serif font-bold text-2xl sm:text-3xl lg:text-4xl text-[#0D1B2A] leading-tight">
                  {institution.name}
                </h1>

                {/* Info Pills Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-xs font-semibold text-[#666666]">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#C79B3A] shrink-0" />
                    <span className="line-clamp-1">{institution.address || institution.city || 'საქართველო'}</span>
                  </div>

                  {institution.website && (
                    <a 
                      href={institution.website.startsWith('http') ? institution.website : `https://${institution.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#0D1B2A] hover:text-[#C79B3A] transition-colors cursor-pointer"
                    >
                      <Globe className="w-4 h-4 text-[#C79B3A] shrink-0" />
                      <span className="line-clamp-1 underline font-mono">{institution.website}</span>
                    </a>
                  )}

                  {institution.email && (
                    <a 
                      href={`mailto:${institution.email}`}
                      className="flex items-center gap-2 text-[#0D1B2A] hover:text-[#C79B3A] transition-colors cursor-pointer"
                    >
                      <Mail className="w-4 h-4 text-[#C79B3A] shrink-0" />
                      <span className="line-clamp-1 font-mono">{institution.email}</span>
                    </a>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Institution Programs Header */}
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between border-b border-[#E6DDCB] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAF8F3] border border-[#C79B3A]/40 flex items-center justify-center text-[#C79B3A]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-2xl text-[#0D1B2A]">
                    ამ დაწესებულების პროგრამები
                  </h2>
                  <p className="text-xs text-[#666666]">
                    სულ სიაშია {specialties.length} აკადემიური/პროფესიული პროგრამა
                  </p>
                </div>
              </div>
            </div>

            {/* Empty Programs List State */}
            {specialties.length === 0 && (
              <div className="bg-white p-12 rounded-3xl border-2 border-[#E6DDCB] text-center space-y-3 max-w-md mx-auto">
                <Building2 className="w-10 h-10 text-[#C79B3A] mx-auto opacity-50" />
                <p className="text-sm font-bold text-[#0D1B2A]">ამ დაწესებულებისთვის პროგრამები არ არის მითითებული.</p>
              </div>
            )}

            {/* Specialty Cards Grid */}
            {specialties.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {specialties.map(spec => (
                  <div
                    key={spec.id}
                    className="bg-white rounded-3xl border-2 border-[#E6DDCB] hover:border-[#C79B3A] p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 group relative"
                  >
                    {/* Header: Title & Spec Code */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold bg-[#FAF8F3] border border-[#C79B3A]/40 text-[#C79B3A] px-2.5 py-0.5 rounded-md">
                          {spec.spec_code || `#${spec.id}`}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#0D1B2A] text-white">
                          {spec.program_type || 'ბაკალავრიატი'}
                        </span>
                      </div>

                      <h3 className="font-serif font-bold text-lg text-[#0D1B2A] group-hover:text-[#C79B3A] transition-colors leading-snug">
                        🎓 {spec.name}
                      </h3>

                      {spec.faculty && (
                        <p className="text-xs font-medium text-[#666666]">
                          ფაკულტეტი: <strong className="text-[#0D1B2A]">{spec.faculty}</strong>
                        </p>
                      )}
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#E6DDCB]/60 text-xs font-semibold text-[#0D1B2A]">
                      <div className="flex items-center gap-1.5 bg-[#FAF8F3] px-3 py-2 rounded-xl border border-[#E6DDCB]">
                        <Languages className="w-4 h-4 text-[#C79B3A]" />
                        <span>{spec.language || 'ქართული'}</span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-[#FAF8F3] px-3 py-2 rounded-xl border border-[#E6DDCB]">
                        <Users className="w-4 h-4 text-[#C79B3A]" />
                        <span>{spec.quota || 0} ადგილი</span>
                      </div>

                      <div className="col-span-2 flex items-center gap-1.5 bg-[#FAF8F3] px-3 py-2 rounded-xl border border-[#E6DDCB] justify-between">
                        <div className="flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-[#C79B3A]" />
                          <span>საფასური:</span>
                        </div>
                        <span className="font-mono font-bold text-[#C79B3A]">
                          {spec.tuition_fee > 0 ? `${spec.tuition_fee} ₾` : 'უფასო / დაფინანსებით'}
                        </span>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
};
