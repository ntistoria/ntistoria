import React, { useState, useEffect } from 'react';
import { AnalyticsStats, fetchAnalyticsStats } from '../lib/analyticsService';
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  Calendar, 
  Globe, 
  Smartphone, 
  Monitor, 
  Tablet, 
  RefreshCw, 
  FileText, 
  Compass, 
  Sparkles 
} from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await fetchAnalyticsStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading analytics stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading && !stats) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-[#E6DDCB] shadow-sm text-center py-16 space-y-4">
        <div className="w-8 h-8 border-3 border-[#C79B3A] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-[#666666]">ანალიტიკის ჩატვირთვა...</p>
      </div>
    );
  }

  const todayViews = stats?.todayViews || 0;
  const last7DaysViews = stats?.last7DaysViews || 0;
  const totalViews = stats?.totalViews || 0;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E6DDCB] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 bg-[#FAF8F3] border border-[#C79B3A]/40 text-[#C79B3A] text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Supabase In-House Analytics
            </span>
          </div>
          <h2 className="font-serif font-bold text-2xl text-[#0D1B2A]">
            ვიზიტორების ანალიტიკა
          </h2>
          <p className="text-xs text-[#666666]">
            რეალური ვიზიტების, ტრაფიკის წყაროებისა და მოწყობილობების სტატისტიკა.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          disabled={loading}
          className="px-4 py-2.5 bg-[#FAF8F3] hover:bg-[#E6DDCB] border border-[#E6DDCB] text-[#0D1B2A] text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#C79B3A] ${loading ? 'animate-spin' : ''}`} />
          <span>განახლება</span>
        </button>
      </div>

      {/* 1. TOP CARDS (Summary Stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Card 1: Today Views */}
        <div className="bg-white p-6 rounded-3xl border-2 border-[#E6DDCB] shadow-sm hover:border-[#C79B3A] transition-all space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-[#666666]">
              დღევანდელი ვიზიტები
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-serif font-bold text-4xl text-[#0D1B2A]">
              {todayViews}
            </span>
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> დღეს
            </span>
          </div>
          
          <div className="w-full h-1 bg-[#FAF8F3] rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${totalViews > 0 ? Math.min(100, Math.max(10, (todayViews / totalViews) * 100)) : 0}%` }} />
          </div>
        </div>

        {/* Card 2: Last 7 Days */}
        <div className="bg-white p-6 rounded-3xl border-2 border-[#E6DDCB] shadow-sm hover:border-[#C79B3A] transition-all space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-[#666666]">
              ბოლო 7 დღის ვიზიტები
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-serif font-bold text-4xl text-[#0D1B2A]">
              {last7DaysViews}
            </span>
            <span className="text-xs text-blue-700 font-semibold">
              ბოლო 7 დღე
            </span>
          </div>

          <div className="w-full h-1 bg-[#FAF8F3] rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${totalViews > 0 ? Math.min(100, Math.max(15, (last7DaysViews / totalViews) * 100)) : 0}%` }} />
          </div>
        </div>

        {/* Card 3: Total Views */}
        <div className="bg-white p-6 rounded-3xl border-2 border-[#C79B3A] shadow-md space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-bold text-[#C79B3A]">
              სულ ნახვები (All-Time)
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#FAF8F3] border border-[#C79B3A]/40 text-[#C79B3A] flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-serif font-bold text-4xl text-[#0D1B2A]">
              {totalViews}
            </span>
            <span className="text-xs text-[#C79B3A] font-semibold">
              ჯამური ნახვა
            </span>
          </div>

          <div className="w-full h-1 bg-[#FAF8F3] rounded-full overflow-hidden">
            <div className="h-full bg-[#C79B3A] rounded-full w-full" />
          </div>
        </div>

      </div>

      {/* 2. MAIN ANALYTICS BREAKDOWN GRID (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Top Pages (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-[#E6DDCB] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#E6DDCB] pb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#C79B3A]" />
              <h3 className="font-serif font-bold text-xl text-[#0D1B2A]">
                ტოპ პოპულარული გვერდები
              </h3>
            </div>
            <span className="text-xs text-[#666666] font-semibold">
              ტოპ 5 გვერდი
            </span>
          </div>

          {stats?.topPages && stats.topPages.length > 0 ? (
            <div className="space-y-4">
              {stats.topPages.map((item, idx) => (
                <div key={idx} className="space-y-2 p-3 bg-[#FAF8F3] rounded-2xl border border-[#E6DDCB]">
                  <div className="flex items-center justify-between text-xs font-bold text-[#0D1B2A]">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="w-5 h-5 rounded-md bg-[#0D1B2A] text-[#C79B3A] text-[10px] font-mono flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono text-[#C79B3A]">
                      <span>{item.count} ნახვა</span>
                      <span className="text-[#666666] text-[11px]">({item.percentage}%)</span>
                    </div>
                  </div>

                  <div className="w-full h-2.5 bg-[#E6DDCB] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#C79B3A] rounded-full transition-all duration-500" 
                      style={{ width: `${item.percentage}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-[#666666]">
              ნახვები ჯერ არ არის დაფიქსირებული.
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Traffic Sources & Device Breakdown (5 Cols) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Traffic Sources */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E6DDCB] shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-[#E6DDCB] pb-4">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#C79B3A]" />
                <h3 className="font-serif font-bold text-lg text-[#0D1B2A]">
                  ტრაფიკის წყაროები
                </h3>
              </div>
            </div>

            {stats?.trafficSources && stats.trafficSources.length > 0 ? (
              <div className="space-y-3">
                {stats.trafficSources.map((src, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#0D1B2A]">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: src.color }} />
                        <span>{src.label}</span>
                      </span>
                      <span className="font-mono text-[#666666]">
                        {src.count} ({src.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#FAF8F3] rounded-full overflow-hidden border border-[#E6DDCB]/50">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ width: `${src.percentage}%`, backgroundColor: src.color }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-[#666666]">
                წყაროები ჯერ არ არის.
              </div>
            )}
          </div>

          {/* Device Distribution */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E6DDCB] shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-[#E6DDCB] pb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#C79B3A]" />
                <h3 className="font-serif font-bold text-lg text-[#0D1B2A]">
                  მოწყობილობები
                </h3>
              </div>
            </div>

            {stats?.deviceDistribution && stats.deviceDistribution.length > 0 ? (
              <div className="space-y-4">
                <div className="w-full h-3 bg-[#FAF8F3] rounded-full overflow-hidden flex border border-[#E6DDCB]">
                  {stats.deviceDistribution.map((d, i) => (
                    <div
                      key={i}
                      style={{ width: `${d.percentage}%`, backgroundColor: d.color }}
                      className="h-full transition-all duration-500"
                      title={`${d.label}: ${d.percentage}%`}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-semibold pt-1">
                  {stats.deviceDistribution.map((d, i) => (
                    <div key={i} className="p-2.5 bg-[#FAF8F3] rounded-xl border border-[#E6DDCB] flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <div className="truncate">
                        <div className="truncate text-[#0D1B2A]">{d.label}</div>
                        <div className="text-[11px] font-mono text-[#C79B3A]">{d.percentage}% ({d.count})</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-[#666666]">
                მონაცემები ჯერ არ არის.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
