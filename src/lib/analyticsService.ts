import { supabase } from './supabase';

export interface PageViewRecord {
  id?: string;
  page_path: string;
  referrer: string;
  device_type: 'mobile' | 'desktop' | 'tablet';
  created_at: string;
}

export interface AnalyticsStats {
  todayViews: number;
  last7DaysViews: number;
  totalViews: number;
  topPages: { path: string; label: string; count: number; percentage: number }[];
  trafficSources: { source: string; label: string; count: number; percentage: number; color: string }[];
  deviceDistribution: { device: string; label: string; count: number; percentage: number; color: string }[];
}

const LOCAL_ANALYTICS_KEY = 'ntistoria_analytics_page_views';

/**
 * Detect Device Type (Mobile / Desktop / Tablet)
 */
export const getDeviceType = (): 'mobile' | 'desktop' | 'tablet' => {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  const ua = navigator.userAgent || '';

  if (/Mobi|Android|iPhone/i.test(ua) || width < 768) {
    return 'mobile';
  } else if (/iPad|Tablet/i.test(ua) || (width >= 768 && width <= 1024)) {
    return 'tablet';
  }
  return 'desktop';
};

/**
 * Categorize Referrer Source (Google, Facebook, Instagram, TikTok, YouTube, Direct, Other)
 */
export const categorizeReferrer = (ref: string): string => {
  if (!ref || ref.trim() === '') return 'Direct / პირდაპირი';
  const lower = ref.toLowerCase();

  if (lower.includes('google')) return 'Google Search';
  if (lower.includes('facebook') || lower.includes('fb.com')) return 'Facebook';
  if (lower.includes('instagram')) return 'Instagram';
  if (lower.includes('tiktok')) return 'TikTok';
  if (lower.includes('youtube') || lower.includes('youtu.be')) return 'YouTube';
  if (lower.includes('viber')) return 'Viber';
  if (lower.includes('t.me') || lower.includes('telegram')) return 'Telegram';
  if (lower.includes(window.location.hostname)) return 'Direct / პირდაპირი';

  try {
    const url = new URL(ref);
    return url.hostname.replace('www.', '');
  } catch (e) {
    return 'სხვა წყაროები';
  }
};

/**
 * Non-blocking Asynchronous Page View Tracking
 */
export const trackPageView = (pagePath: string) => {
  if (typeof window === 'undefined') return;

  const referrer = document.referrer || '';
  const device_type = getDeviceType();
  const created_at = new Date().toISOString();

  const record: PageViewRecord = {
    page_path: pagePath,
    referrer,
    device_type,
    created_at
  };

  // 1. Save to Local Storage fallback
  try {
    const existingRaw = localStorage.getItem(LOCAL_ANALYTICS_KEY);
    let existing: PageViewRecord[] = existingRaw ? JSON.parse(existingRaw) : [];
    // Keep max 500 records locally
    if (existing.length > 500) {
      existing = existing.slice(-500);
    }
    existing.push(record);
    localStorage.setItem(LOCAL_ANALYTICS_KEY, JSON.stringify(existing));
  } catch (e) {
    console.warn('Analytics local storage notice:', e);
  }

  // 2. Asynchronously send to Supabase analytics_page_views (non-blocking)
  (async () => {
    try {
      await supabase
        .from('analytics_page_views')
        .insert([
          {
            page_path: pagePath,
            referrer,
            device_type,
            created_at
          }
        ]);
    } catch (err) {
      // Ignore if table not yet created in Supabase SQL editor
    }
  })();
};

/**
 * Helper to map page path to Georgian display label
 */
export const getPageLabel = (path: string): string => {
  if (path === '/' || path === '/home' || path === 'home') return 'მთავარი გვერდი';
  if (path.includes('tab=tests') || path === 'tests') return 'ისტორიის ტესტები';
  if (path.includes('tab=blog') || path === 'blog') return 'ისტორიული ბლოგი';
  if (path.includes('tab=videos') || path === 'videos') return 'ვიდეო გაკვეთილები';
  if (path.includes('tab=quizzes') || path === 'quizzes') return 'ქვიზები';
  if (path.includes('tab=contact') || path === 'contact') return 'კონტაქტი & FAQ';
  if (path.includes('article=')) {
    const slug = path.split('article=')[1] || '';
    return `სტატია: ${decodeURIComponent(slug.replace(/_/g, ' '))}`;
  }
  return path;
};

/**
 * Fetch Analytics Stats from Supabase & LocalStorage
 */
export const fetchAnalyticsStats = async (): Promise<AnalyticsStats> => {
  let allRecords: PageViewRecord[] = [];

  // Try fetching from Supabase first
  try {
    const { data, error } = await supabase
      .from('analytics_page_views')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (!error && data && data.length > 0) {
      allRecords = data as PageViewRecord[];
    }
  } catch (err) {
    console.warn('Analytics Supabase fetch notice:', err);
  }

  // Merge with local records if Supabase has fewer
  try {
    const localRaw = localStorage.getItem(LOCAL_ANALYTICS_KEY);
    if (localRaw) {
      const localRecords: PageViewRecord[] = JSON.parse(localRaw);
      if (allRecords.length === 0) {
        allRecords = localRecords;
      }
    }
  } catch (e) {}

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

  let todayViews = 0;
  let last7DaysViews = 0;
  const totalViews = allRecords.length;

  const pageCounts: Record<string, number> = {};
  const sourceCounts: Record<string, number> = {};
  const deviceCounts: Record<string, number> = { mobile: 0, desktop: 0, tablet: 0 };

  allRecords.forEach((rec) => {
    const recTime = new Date(rec.created_at).getTime();

    if (recTime >= todayStart) {
      todayViews++;
    }
    if (recTime >= sevenDaysAgo) {
      last7DaysViews++;
    }

    // Page counts
    const pathKey = rec.page_path || '/';
    pageCounts[pathKey] = (pageCounts[pathKey] || 0) + 1;

    // Traffic Sources
    const src = categorizeReferrer(rec.referrer);
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;

    // Device counts
    const dev = rec.device_type || 'desktop';
    deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
  });

  // Calculate Top Pages
  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([path, count]) => ({
      path,
      label: getPageLabel(path),
      count,
      percentage: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0
    }));

  // Colors for Sources
  const sourceColorMap: Record<string, string> = {
    'Google Search': '#4285F4',
    'Facebook': '#1877F2',
    'Instagram': '#E4405F',
    'TikTok': '#000000',
    'YouTube': '#FF0000',
    'Direct / პირდაპირი': '#C79B3A',
    'Viber': '#7360F2',
    'Telegram': '#24A1DE'
  };

  const trafficSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([src, count]) => ({
      source: src,
      label: src,
      count,
      percentage: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0,
      color: sourceColorMap[src] || '#6B7280'
    }));

  // Device Distribution
  const deviceLabels: Record<string, { label: string; color: string }> = {
    mobile: { label: 'მობილური (Mobile)', color: '#3B82F6' },
    desktop: { label: 'კომპიუტერი (Desktop)', color: '#C79B3A' },
    tablet: { label: 'ტაბლეტი (Tablet)', color: '#10B981' }
  };

  const deviceDistribution = Object.entries(deviceCounts)
    .map(([dev, count]) => ({
      device: dev,
      label: deviceLabels[dev]?.label || dev,
      count,
      percentage: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0,
      color: deviceLabels[dev]?.color || '#6B7280'
    }))
    .filter(d => d.count > 0);

  return {
    todayViews,
    last7DaysViews,
    totalViews,
    topPages,
    trafficSources,
    deviceDistribution
  };
};
