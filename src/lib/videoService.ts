import { supabase } from './supabase';
import { VideoItem } from '../types';

export const DEFAULT_VIDEOS: VideoItem[] = [
  {
    id: 'vid-didgori-1121',
    title: 'დავით IV აღმაშენებელი და დიდგორის ომის სამხედრო ტაქტიკა',
    description: 'ვიდეოლექციაში დეტალურად განხილულია დავით აღმაშენებლის რეფორმები, ყივჩაღთა ჩამოსახლება, მონასპას შექმნა და დიდგორის ბრძოლის ეტაპობრივი რესტავრაცია.',
    youtube_url: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
    tags: ['საქართველოს ისტორია', 'სააბიტურიენტო', 'ეროვნული გამოცდები'],
    created_at: new Date('2025-08-15').toISOString()
  },
  {
    id: 'vid-naec-map-analysis',
    title: 'ისტორიული რუკის კითხვისა და ანალიზის ტექნიკა საგამოცდოდ',
    description: 'როგორ ამოვიცნოთ რუკაზე საზღვრების ცვლილებები, ჯარების გადაადგილების ისრები და ისტორიული ქალაქები. პრაქტიკული სავარჯიშოები გასული წლების ეროვნული გამოცდების რუკებზე.',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    tags: ['ეროვნული გამოცდები', 'რუკები', 'სააბიტურიენტო'],
    created_at: new Date('2025-09-02').toISOString()
  },
  {
    id: 'vid-georgievsk-1783',
    title: 'გეორგიევსკის ტრაქტატი (1783) და კრწანისის ბრძოლა (1795)',
    description: 'ერეკლე II-ის პოლიტიკური არჩევანი, ტრაქტატის მუხლების იურიდიული შეფასება, აღა-მაჰმად-ხანის ულტიმატუმი და 300 არაგველის თავდადება.',
    youtube_url: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ',
    tags: ['ახალი და უახლესი ისტორია', 'საქართველოს ისტორია', 'სააბიტურიენტო'],
    created_at: new Date('2025-10-20').toISOString()
  },
  {
    id: 'vid-rome-republic',
    title: 'რომის რესპუბლიკიდან იმპერიამდე: იულიუს კეისარი და ოქტავიანე',
    description: 'ტრიუმვირატები, სამოქალაქო ომები რომში, რუბიკონის გადავლახვა, იდუსის მარტი და პაქს რომანას (რომაული მშვიდობის) დასაბამი.',
    youtube_url: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
    tags: ['ძველი მსოფლიო', 'მსოფლიო ისტორია'],
    created_at: new Date('2025-11-10').toISOString()
  }
];

/**
 * Extracts 11-character YouTube video ID from various YouTube URL formats.
 */
export function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = trimmed.match(regExp);
  if (match && match[1] && match[1].length === 11) {
    return match[1];
  }
  return null;
}

/**
 * Checks if the provided URL string is a valid YouTube URL.
 */
export function isValidYoutubeUrl(url: string): boolean {
  return extractYoutubeId(url) !== null;
}

/**
 * Formats YouTube embed URL for iframe player.
 */
export function getYoutubeEmbedUrl(urlOrId: string): string {
  const id = extractYoutubeId(urlOrId) || urlOrId;
  return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
}

/**
 * Returns YouTube video high quality thumbnail image URL.
 */
export function getYoutubeThumbnailUrl(urlOrId: string): string {
  const id = extractYoutubeId(urlOrId) || urlOrId;
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

/**
 * Fetch all videos from Supabase videos table.
 * Falls back gracefully to default seed list if table is empty or unpopulated.
 */
export async function fetchAllVideos(): Promise<VideoItem[]> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch videos warning/error:', error.message);
      return DEFAULT_VIDEOS;
    }

    if (data && data.length > 0) {
      return data.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description || '',
        youtube_url: item.youtube_url,
        tags: Array.isArray(item.tags) ? item.tags : [],
        created_at: item.created_at
      }));
    }

    return DEFAULT_VIDEOS;
  } catch (err) {
    console.error('Error fetching videos from Supabase:', err);
    return DEFAULT_VIDEOS;
  }
}

/**
 * Create or save a video item in Supabase videos table.
 */
export async function saveVideo(videoData: {
  id?: string;
  title: string;
  description?: string;
  youtube_url: string;
  tags: string[];
}): Promise<VideoItem> {
  const payload = {
    title: videoData.title.trim(),
    description: videoData.description?.trim() || null,
    youtube_url: videoData.youtube_url.trim(),
    tags: videoData.tags.map(t => t.trim()).filter(Boolean)
  };

  if (videoData.id && !videoData.id.startsWith('vid-')) {
    const { data, error } = await supabase
      .from('videos')
      .update(payload)
      .eq('id', videoData.id)
      .select()
      .single();

    if (error) {
      throw new Error(`ვიდეოს განახლება ვერ მოხერხდა: ${error.message}`);
    }

    return data;
  } else {
    const { data, error } = await supabase
      .from('videos')
      .insert([payload])
      .select()
      .single();

    if (error) {
      throw new Error(`ახალი ვიდეოს დამატება ვერ მოხერხდა: ${error.message}`);
    }

    return data;
  }
}

/**
 * Delete a video item by ID from Supabase videos table.
 */
export async function deleteVideo(id: string): Promise<boolean> {
  if (id.startsWith('vid-')) {
    // Mock local item deletion handled caller-side
    return true;
  }

  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`ვიდეოს წაშლა ვერ მოხერხდა: ${error.message}`);
  }

  return true;
}
