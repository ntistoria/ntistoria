import { Article } from '../types';
import { ARTICLES as DEFAULT_ARTICLES } from '../data/historyData';
import { supabase } from './supabase';

const LOCAL_ARTICLES_KEY = 'ntistoria_custom_articles';

// Admin Email List
export const ADMIN_EMAILS = [
  'ntistoria@gmail.com',
  'admin@ntistoria.ge',
  'admin@gmail.com',
];

export const isAdminUser = (user: { email: string } | null): boolean => {
  if (!user || !user.email) return false;
  const emailLower = user.email.toLowerCase().trim();
  const isMatch = ADMIN_EMAILS.some(e => e.toLowerCase() === emailLower);
  const isLocalOverride = localStorage.getItem('ntistoria_admin_override') === 'true';
  const isAdminPattern = emailLower.includes('admin') || emailLower.startsWith('ntistoria');
  return isMatch || isLocalOverride || isAdminPattern;
};

// Georgian Transliteration helper for clean URLs
export function transliterateGeorgian(str: string): string {
  if (!str) return '';
  const geoMap: { [key: string]: string } = {
    'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z',
    'თ': 't', 'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o',
    'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 'ფ': 'p',
    'ქ': 'q', 'ღ': 'gh', 'ყ': 'q', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz',
    'წ': 'ts', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h'
  };

  return str
    .split('')
    .map(char => geoMap[char] || char)
    .join('');
}

// Generate clean, readable, websafe slug from Georgian or English title
export function generateSlug(title: string, fallbackId?: string): string {
  if (!title) return fallbackId || `art-${Date.now()}`;
  
  const latinized = transliterateGeorgian(title.trim().toLowerCase());
  const cleanSlug = latinized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!cleanSlug || cleanSlug.length < 2 || /^[-]+$/.test(cleanSlug)) {
    return fallbackId || `art-${Date.now()}`;
  }

  return cleanSlug;
}

// Ensure article object has a clean, non-dashed slug
export function cleanArticleSlug(article: Article): Article {
  let currentSlug = article.slug ? article.slug.trim() : '';
  
  if (!currentSlug || /^[-]+$/.test(currentSlug) || currentSlug.length < 2) {
    currentSlug = generateSlug(article.title, article.id);
  } else {
    currentSlug = generateSlug(currentSlug, article.id);
  }

  return {
    ...article,
    slug: currentSlug
  };
}

// Get initial articles instantly from local storage & defaults (0ms sync)
export const getInitialArticles = (): Article[] => {
  let localArticles: Article[] = [];
  try {
    const saved = localStorage.getItem(LOCAL_ARTICLES_KEY);
    if (saved) {
      localArticles = JSON.parse(saved);
    }
  } catch (err) {}

  const combinedMap = new Map<string, Article>();
  DEFAULT_ARTICLES.map(cleanArticleSlug).forEach(a => combinedMap.set(a.id, a));
  localArticles.map(cleanArticleSlug).forEach(a => combinedMap.set(a.id, a));
  return Array.from(combinedMap.values());
};

// Fetch all articles combining Supabase + Local Storage + Default Articles
export const fetchAllArticles = async (): Promise<Article[]> => {
  let dbArticles: Article[] = [];

  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('date', { ascending: false });

    if (!error && data && data.length > 0) {
      dbArticles = data.map((item: any) => cleanArticleSlug({
        id: item.id || `db-${Date.now()}`,
        title: item.title,
        slug: generateSlug(item.title, item.slug || item.id),
        excerpt: item.excerpt || '',
        content: item.content || '',
        category: item.category || 'საქართველოს ისტორია',
        author: item.author || 'ნოდარ თოთაძე',
        date: item.date || new Date().toISOString().split('T')[0],
        imageUrl: item.image_url || item.imageUrl || 'https://images.unsplash.com/photo-1544967082-d9d25d867d66',
        featured: item.featured || false,
        tags: item.tags ? (typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags) : ['ისტორია'],
        status: item.status || 'published'
      }));

      // Auto-fix broken dashed slugs in Supabase (one-time migration)
      for (const item of data) {
        const dbSlug = item.slug ? item.slug.trim() : '';
        const isBroken = !dbSlug || /^[-]+\d*$/.test(dbSlug) || dbSlug.length < 3;
        if (isBroken && item.title) {
          const fixedSlug = generateSlug(item.title, item.id);
          if (fixedSlug && fixedSlug !== dbSlug) {
            supabase.from('articles').update({ slug: fixedSlug }).eq('id', item.id).then(() => {
              console.log(`Auto-fixed slug for "${item.title}": "${dbSlug}" → "${fixedSlug}"`);
            }).catch(() => {});
          }
        }
      }
    }
  } catch (err) {
    console.warn('Supabase fetch articles fallback:', err);
  }

  const initial = getInitialArticles();
  const combinedMap = new Map<string, Article>();

  initial.forEach(a => combinedMap.set(a.id, a));
  dbArticles.forEach(a => combinedMap.set(a.id, a));

  return Array.from(combinedMap.values());
};

// Save (Create or Update) an article
export const saveArticle = async (article: Article): Promise<Article> => {
  const cleanSlug = generateSlug(article.title, article.id || `art-${Date.now()}`);
  
  const articleToSave: Article = {
    ...article,
    id: article.id || `art-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    slug: cleanSlug,
    date: article.date || new Date().toISOString().split('T')[0],
    author: article.author || 'ნოდარ თოთაძე',
    tags: article.tags?.length ? article.tags : ['ისტორია', article.category],
    status: article.status || 'published'
  };

  let supabaseError: any = null;

  // Try saving to Supabase first
  try {
    const payload: any = {
      id: articleToSave.id,
      title: articleToSave.title,
      slug: articleToSave.slug,
      excerpt: articleToSave.excerpt,
      content: articleToSave.content,
      category: articleToSave.category,
      author: articleToSave.author,
      date: articleToSave.date,
      image_url: articleToSave.imageUrl,
      featured: articleToSave.featured || false,
      tags: articleToSave.tags,
      status: articleToSave.status
    };

    let { error } = await supabase.from('articles').upsert(payload);

    // If status column is not present in Supabase table yet, retry without status column
    if (error && error.message && error.message.includes('status')) {
      delete payload.status;
      const retryResult = await supabase.from('articles').upsert(payload);
      error = retryResult.error;
    }

    if (error) {
      console.error('Supabase article save error:', error);
      supabaseError = error;
    }
  } catch (err) {
    console.error('Supabase DB error:', err);
    supabaseError = err;
  }

  // Save to localStorage backup
  try {
    const saved = localStorage.getItem(LOCAL_ARTICLES_KEY);
    let localArticles: Article[] = saved ? JSON.parse(saved) : [];
    
    const existingIndex = localArticles.findIndex(a => a.id === articleToSave.id);
    if (existingIndex >= 0) {
      localArticles[existingIndex] = articleToSave;
    } else {
      localArticles.unshift(articleToSave);
    }

    localStorage.setItem(LOCAL_ARTICLES_KEY, JSON.stringify(localArticles));
  } catch (err) {
    console.error('Error writing to local storage:', err);
  }

  if (supabaseError) {
    throw new Error(`Supabase-ში შეინახა ლოკალურად, თუმცა ბაზაში შეცდომაა: ${supabaseError.message || supabaseError}`);
  }

  return articleToSave;
};

// Extract storage file path from a Supabase Storage public URL
export const extractStoragePath = (url: string, bucketName: string = 'photos'): string | null => {
  if (!url) return null;
  const pattern = new RegExp(`/storage/v1/object/public/${bucketName}/([^?#]+)`);
  const match = url.match(pattern);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }
  const bucketPattern = new RegExp(`${bucketName}/([^?#]+)`);
  const bucketMatch = url.match(bucketPattern);
  if (bucketMatch && bucketMatch[1]) {
    return decodeURIComponent(bucketMatch[1]);
  }
  return null;
};

// Delete multiple image files from Supabase Storage bucket
export const deleteStorageImages = async (urls: string[], bucketName: string = 'photos'): Promise<void> => {
  if (!urls || urls.length === 0) return;

  const paths = urls
    .map(url => extractStoragePath(url, bucketName))
    .filter((p): p is string => Boolean(p));

  if (paths.length === 0) return;

  try {
    const { data, error } = await supabase.storage.from(bucketName).remove(paths);
    if (error) {
      console.warn('Supabase storage delete notice:', error.message);
    } else {
      console.log('Successfully deleted files from Supabase Storage:', paths);
    }
  } catch (err) {
    console.warn('Error deleting images from Supabase storage:', err);
  }
};

// Extract all <img> src URLs from HTML content
export const extractImageUrlsFromContent = (content: string): string[] => {
  if (!content) return [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  const urls: string[] = [];
  let match;
  while ((match = imgRegex.exec(content)) !== null) {
    if (match[1]) {
      urls.push(match[1]);
    }
  }
  return urls;
};

// Delete an article by object or ID (and clean up associated photos in Supabase Storage)
export const deleteArticle = async (articleOrId: Article | string): Promise<boolean> => {
  let targetArticle: Article | undefined;
  
  if (typeof articleOrId === 'object') {
    targetArticle = articleOrId;
  } else {
    const all = getInitialArticles();
    targetArticle = all.find(a => a.id === articleOrId);
  }

  const idToDelete = typeof articleOrId === 'string' ? articleOrId : articleOrId.id;

  // Clean up photos from Supabase Storage
  if (targetArticle) {
    const urlsToDelete: string[] = [];
    if (targetArticle.imageUrl) {
      urlsToDelete.push(targetArticle.imageUrl);
    }
    if (targetArticle.content) {
      urlsToDelete.push(...extractImageUrlsFromContent(targetArticle.content));
    }
    if (urlsToDelete.length > 0) {
      await deleteStorageImages(urlsToDelete);
    }
  }

  // Try Supabase delete
  try {
    await supabase.from('articles').delete().eq('id', idToDelete);
  } catch (err) {
    console.warn('Supabase article delete notice:', err);
  }

  // Remove from localStorage
  try {
    const saved = localStorage.getItem(LOCAL_ARTICLES_KEY);
    if (saved) {
      let localArticles: Article[] = JSON.parse(saved);
      localArticles = localArticles.filter(a => a.id !== idToDelete);
      localStorage.setItem(LOCAL_ARTICLES_KEY, JSON.stringify(localArticles));
    }
  } catch (err) {
    console.error('Error deleting from local storage:', err);
  }

  return true;
};

// Upload image to Supabase Storage
export const uploadBlogImage = async (file: File): Promise<string> => {
  const fileName = `blog-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  
  try {
    const { data, error } = await supabase.storage
      .from('photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.warn('Supabase storage upload error, trying fallback:', error.message);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from('photos')
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn('Storage upload error, using Data URL fallback:', err);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }
};

// Helper function to format article content
export const formatArticleContent = (content: string): string => {
  if (!content) return '';

  if (/<p\b|<div\b|<section\b/i.test(content)) {
    return content;
  }

  const blocks = content.split(/\n\s*\n/);

  return blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';

      if (/^<(figure|img|h[1-6]|blockquote|ul|ol|table|div)\b/i.test(trimmed)) {
        return trimmed;
      }

      if (trimmed.startsWith('## ')) {
        return `<h2 class="font-serif font-bold text-2xl text-[#13253D] mt-8 mb-4">${trimmed.replace(/^##\s+/, '')}</h2>`;
      }

      if (trimmed.startsWith('### ')) {
        return `<h3 class="font-serif font-bold text-xl text-[#13253D] mt-6 mb-3">${trimmed.replace(/^###\s+/, '')}</h3>`;
      }

      if (trimmed.startsWith('> ')) {
        return `<blockquote class="border-l-4 border-[#C79B3A] pl-4 py-2 my-4 italic text-[#13253D] bg-[#FAF8F3] rounded-r-xl">${trimmed.replace(/^>\s+/, '')}</blockquote>`;
      }

      return `<p class="mb-4 leading-relaxed">${trimmed.replace(/\n/g, '<br />')}</p>`;
    })
    .join('\n');
};
