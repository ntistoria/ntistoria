export type NavTab = 'home' | 'blog' | 'tests' | 'videos' | 'quizzes' | 'contact' | 'admin' | 'universities' | 'colleges' | 'programs';

export interface University {
  id: number;
  name: string;
  code: string;
  address: string;
  website: string;
  email: string;
  logo_url: string;
  status: string; // 'სახელმწიფო' | 'კერძო'
  type: string;   // 'უნივერსიტეტი' | 'კოლეჯი'
  location: string; // "latitude, longitude"
  lat?: number;
  lng?: number;
  city?: string;
  program_count?: number;
}

export interface Specialty {
  id: number;
  name: string;
  institution_code: string;
  spec_code: string;
  program_type: string; // 'ბაკალავრიატი' | 'ქართულ ენაში მომზადება' | 'პროფესიული' etc.
  quota: number;
  tuition_fee: number;
  faculty: string;
  language: string;
}

export interface ProgramCatalogItem extends Specialty {
  institution_name?: string;
  institution_logo?: string;
  institution_type?: string;
  institution_location?: string;
  institution_city?: string;
}

export type HistoricalCategory = 
  | 'საქართველოს ისტორია'
  | 'ძველი მსოფლიო'
  | 'შუა საუკუნეები'
  | 'ახალი და უახლესი ისტორია'
  | 'ეროვნული გამოცდები'
  | 'სხვა ტესტები';

export type DifficultyLevel = 'მარტივი' | 'საშუალო' | 'რთული' | 'საგამოცდო';

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: HistoricalCategory;
  author: string;
  date: string;
  readTime?: string;
  imageUrl: string;
  featured?: boolean;
  tags: string[];
  status?: 'published' | 'draft';
  primarySources?: {
    title: string;
    text: string;
    authorOrPeriod: string;
  }[];
  quote?: {
    text: string;
    author: string;
  };
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  sourceContext?: string;
  mapImage?: string;
  questionType?: 'mcq' | 'chronology' | 'open_text';
  correctAnswerText?: string;
  chronologyItems?: string[];
  correctSequence?: number[];
  itemNumber?: number;
  parentItemNumber?: number;
  subProgramNumber?: number;
}

export interface HistoryTest {
  id: string;
  title: string;
  category: HistoricalCategory;
  difficulty: DifficultyLevel;
  timeLimitMinutes: number;
  questionCount: number;
  description: string;
  questions: QuizQuestion[];
}

export interface VideoLesson {
  id: string;
  title: string;
  category: HistoricalCategory;
  duration: string;
  youtubeId: string;
  thumbnailUrl: string;
  instructor: string;
  description: string;
  keyTopics: string[];
  materialsCount: number;
  views: number;
  publishedDate: string;
  notes?: string;
}

export interface HistoricalEpoch {
  id: string;
  period: string;
  title: string;
  subtitle: string;
  description: string;
  keyEvents: { year: string; title: string; desc: string }[];
  imageUrl: string;
}

export interface TestResult {
  testId: string;
  testTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpentSeconds: number;
  date: string;
  userAnswers: { questionIndex: number; selectedIndex: number; isCorrect: boolean }[];
}
