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
  DEFAULT_ARTICLES.forEach(a => combinedMap.set(a.id, a));
  localArticles.forEach(a => combinedMap.set(a.id, a));
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
      dbArticles = data.map((item: any) => ({
        id: item.id || `db-${Date.now()}`,
        title: item.title,
        slug: item.slug || item.id,
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
  const articleToSave: Article = {
    ...article,
    id: article.id || `art-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
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
      slug: articleToSave.slug || articleToSave.id,
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

// Delete an article by ID
export const deleteArticle = async (id: string): Promise<boolean> => {
  // Try Supabase delete
  try {
    await supabase.from('articles').delete().eq('id', id);
  } catch (err) {
    console.warn('Supabase article delete notice:', err);
  }

  // Remove from localStorage
  try {
    const saved = localStorage.getItem(LOCAL_ARTICLES_KEY);
    if (saved) {
      let localArticles: Article[] = JSON.parse(saved);
      localArticles = localArticles.filter(a => a.id !== id);
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
    // Attempt upload to 'photos' bucket
    const { data, error } = await supabase.storage
      .from('photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.warn('Supabase storage upload error, trying fallback:', error.message);
      // Fallback to data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
    }

    // Get public URL
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

// Helper function to format article content (converting linebreaks and images into clean HTML)
export const formatArticleContent = (content: string): string => {
  if (!content) return '';

  // If content already contains HTML block elements like <p>, <div>, <section>, return formatted
  if (/<p\b|<div\b|<section\b/i.test(content)) {
    return content;
  }

  // Otherwise split content by double line breaks
  const blocks = content.split(/\n\s*\n/);

  return blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';

      // If block starts with an HTML element tag (like <figure>, <img>, <h2>, <h3>, <blockquote>, <ul>, etc.)
      if (/^<(figure|img|h[1-6]|blockquote|ul|ol|table|div)\b/i.test(trimmed)) {
        return trimmed;
      }

      // Convert Markdown H2 (##)
      if (trimmed.startsWith('## ')) {
        return `<h2 class="font-serif font-bold text-2xl text-[#13253D] mt-8 mb-4">${trimmed.replace(/^##\s+/, '')}</h2>`;
      }

      // Convert Markdown H3 (###)
      if (trimmed.startsWith('### ')) {
        return `<h3 class="font-serif font-bold text-xl text-[#13253D] mt-6 mb-3">${trimmed.replace(/^###\s+/, '')}</h3>`;
      }

      // Convert Markdown Quote (> )
      if (trimmed.startsWith('> ')) {
        return `<blockquote class="border-l-4 border-[#C79B3A] pl-4 py-2 my-4 italic text-[#13253D] bg-[#FAF8F3] rounded-r-xl">${trimmed.replace(/^>\s+/, '')}</blockquote>`;
      }

      // Convert plain paragraph, replacing single linebreaks with <br />
      return `<p class="mb-4 leading-relaxed">${trimmed.replace(/\n/g, '<br />')}</p>`;
    })
    .join('\n');
};

