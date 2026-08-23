export type NavTab = 'home' | 'blog' | 'tests' | 'videos' | 'quizzes' | 'contact' | 'admin';

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
