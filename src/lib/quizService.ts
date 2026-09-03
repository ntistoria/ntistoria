import { supabase } from './supabase';
import { QuizItem, QuizQuestionItem, QuizAnswerItem, QuizLeaderboardItem, QuizResultFeedback } from '../types';

// =========================================================
// DYNAMIC HISTORY FEEDBACK COMMENTS (REQUIREMENT 4)
// =========================================================
export function getQuizResultFeedback(percentage: number): QuizResultFeedback {
  if (percentage >= 90) {
    return {
      tier: 'herodotus',
      badge: '👑 ჰეროდოტე',
      title: 'ძალიან მაღალი შედეგი!',
      comment: '„შენ ჰეროდოტე ხარ! ეს თემა შესანიშნავად იცი.“',
      minPercentage: 90,
      maxPercentage: 100
    };
  } else if (percentage >= 70) {
    return {
      tier: 'high',
      badge: '📜 ისტორიკოსი',
      title: 'მაღალი შედეგი!',
      comment: '„შენ ძალიან კარგად ფლობ ამ საკითხს! ისტორია ნამდვილად შენი ძლიერი მხარეა.“',
      minPercentage: 70,
      maxPercentage: 89
    };
  } else if (percentage >= 40) {
    return {
      tier: 'medium',
      badge: '🛡️ მკვლევარი',
      title: 'საშუალო შედეგი',
      comment: '„კარგი შედეგია, მაგრამ ჯერ კიდევ არის საკითხები, რომელთა გამეორებაც ღირს.“',
      minPercentage: 40,
      maxPercentage: 69
    };
  } else {
    return {
      tier: 'low',
      badge: '⚔️ მოგზაური',
      title: 'დაბალი შედეგი',
      comment: '„ეს ქვიზი კიდევ ერთხელ სცადე და ნახავ, რამდენად სწრაფად გააუმჯობესებ შედეგს.“',
      minPercentage: 0,
      maxPercentage: 39
    };
  }
}

// =========================================================
// STORAGE IMAGE HELPER
// =========================================================
export function getQuizImageUrl(path: string | null | undefined, bucket: 'quiz-covers' | 'quiz-question-images'): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || path;
}

// Upload file to Supabase Storage with file type check
export async function uploadQuizImage(file: File, bucket: 'quiz-covers' | 'quiz-question-images'): Promise<string> {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type.toLowerCase())) {
    throw new Error('დაშვეულია მხოლოდ JPG, PNG და WEBP ფორმატის სურათები');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

  const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
    cacheControl: '3600',
    upsert: false
  });

  if (error) {
    console.error(`Error uploading image to ${bucket}:`, error);
    throw new Error(`სურათის ატვირთვა ვერ მოხერხდა: ${error.message}`);
  }

  return data.path;
}

// =========================================================
// MOCK FALLBACK DATA (For local demo if tables aren't populated yet)
// =========================================================
const FALLBACK_QUIZZES: QuizItem[] = [
  {
    id: 'quiz-didgori-101',
    title: 'დიდგორის ბრძოლა და დავით აღმაშენებელი',
    description: 'შეამოწმეთ ცოდნა 1121 წლის „ძლევაჲ საკვირველის“, დავით აღმაშენებლის რეფორმებისა და საქართველოს გაერთიანების შესახებ.',
    cover_image_path: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=800',
    status: 'published',
    is_active: true,
    created_at: new Date().toISOString(),
    question_count: 5
  },
  {
    id: 'quiz-kolkheti-102',
    title: 'ძველი კოლხეთი და ეგრისი',
    description: 'არ Argonauts-ის მითიდან ეგრისის დიდ ომამდე: არქეოლოგია, ოქრომრავალი კოლხეთი და ანტიკური ხანა.',
    cover_image_path: 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&q=80&w=800',
    status: 'published',
    is_active: true,
    created_at: new Date().toISOString(),
    question_count: 5
  },
  {
    id: 'quiz-golden-age-103',
    title: 'საქართველოს ოქროს ხანა (თამარ მეფე)',
    description: 'თამარ მეფის ეპოქა, შამქორისა და ბასიანის ბრძოლები, კულტურული აღორძინება და შოთა რუსთაველი.',
    cover_image_path: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800',
    status: 'published',
    is_active: true,
    created_at: new Date().toISOString(),
    question_count: 5
  }
];

const FALLBACK_QUESTIONS: Record<string, QuizQuestionItem[]> = {
  'quiz-didgori-101': [
    {
      id: 'q-d1',
      quiz_id: 'quiz-didgori-101',
      question_text: 'რომელ წელს მოხდა დიდგორის ისტორიული ბრძოლა?',
      question_order: 1,
      answers: [
        { id: 'a-d1-1', answer_text: '1121 წლის 12 აგვისტოს', is_correct: true, answer_order: 1 },
        { id: 'a-d1-2', answer_text: '1122 წლის 15 მაისს', is_correct: false, answer_order: 2 },
        { id: 'a-d1-3', answer_text: '1105 წლის 3 სექტემბერს', is_correct: false, answer_order: 3 },
        { id: 'a-d1-4', answer_text: '1118 წლის 10 ოქტომბერს', is_correct: false, answer_order: 4 }
      ]
    },
    {
      id: 'q-d2',
      quiz_id: 'quiz-didgori-101',
      question_text: 'ვინ მეთაურობდა თურქ-სელჩუკთა კოალიციურ ლაშქარს დიდგორის ბრძოლაში?',
      question_order: 2,
      answers: [
        { id: 'a-d2-1', answer_text: 'ილ-ღაზი', is_correct: true, answer_order: 1 },
        { id: 'a-d2-2', answer_text: 'ალფ-არსლანი', is_correct: false, answer_order: 2 },
        { id: 'a-d2-3', answer_text: 'მელიქ-შაჰი', is_correct: false, answer_order: 3 },
        { id: 'a-d2-4', answer_text: 'ყზლ-არსლანი', is_correct: false, answer_order: 4 }
      ]
    },
    {
      id: 'q-d3',
      quiz_id: 'quiz-didgori-101',
      question_text: 'რომელი მნიშვნელოვანი რეფორმა ჩაატარა დავით IV-მ 1105 წელს ეკლესიისა და სახელმწიფოს ურთიერთობის მოსაწესრიგებლად?',
      question_order: 3,
      answers: [
        { id: 'a-d3-1', answer_text: 'რუის-ურბნისის საეკლესიო კრება', is_correct: true, answer_order: 1 },
        { id: 'a-d3-2', answer_text: 'მჭევრთა და ჭყონდიდელთა გაერთიანება', is_correct: false, answer_order: 2 },
        { id: 'a-d3-3', answer_text: 'ყივჩაყთა ჩამოსახლება', is_correct: false, answer_order: 3 },
        { id: 'a-d3-4', answer_text: 'მონასტრების დეკრეტი', is_correct: false, answer_order: 4 }
      ]
    },
    {
      id: 'q-d4',
      quiz_id: 'quiz-didgori-101',
      question_text: 'რომელი ქალაქი გაათავისუფლა დავით IV-მ დიდგორის ბრძოლის შემდგომ, 1122 წელს?',
      question_order: 4,
      answers: [
        { id: 'a-d4-1', answer_text: 'თბილისი', is_correct: true, answer_order: 1 },
        { id: 'a-d4-2', answer_text: 'ქუთაისი', is_correct: false, answer_order: 2 },
        { id: 'a-d4-3', answer_text: 'ანისი', is_correct: false, answer_order: 3 },
        { id: 'a-d4-4', answer_text: 'სამშვილდე', is_correct: false, answer_order: 4 }
      ]
    },
    {
      id: 'q-d5',
      quiz_id: 'quiz-didgori-101',
      question_text: 'რომელ უცხოურ სამხედრო ძალას მიმართა დავით აღმაშენებელმა მუდმივი ჯარის შესაქმნელად (1118-1120 წწ.)?',
      question_order: 5,
      answers: [
        { id: 'a-d5-1', answer_text: 'ყივჩაყებს', is_correct: true, answer_order: 1 },
        { id: 'a-d5-2', answer_text: 'ჯვაროსნებს', is_correct: false, answer_order: 2 },
        { id: 'a-d5-3', answer_text: 'ბიზანტიელებს', is_correct: false, answer_order: 3 },
        { id: 'a-d5-4', answer_text: 'ხაზარებს', is_correct: false, answer_order: 4 }
      ]
    }
  ],
  'quiz-kolkheti-102': [
    {
      id: 'q-k1',
      quiz_id: 'quiz-kolkheti-102',
      question_text: 'ბერძნული მითოლოგიის თანახმად, ვინ მართავდა კოლხეთს არგონავტების ლაშქრობის დროს?',
      question_order: 1,
      answers: [
        { id: 'a-k1-1', answer_text: 'მეფე აიეტი', is_correct: true, answer_order: 1 },
        { id: 'a-k1-2', answer_text: 'მეფე ფარნავაზი', is_correct: false, answer_order: 2 },
        { id: 'a-k1-3', answer_text: 'მეფე ხორენი', is_correct: false, answer_order: 3 },
        { id: 'a-k1-4', answer_text: 'მეფე კუჯი', is_correct: false, answer_order: 4 }
      ]
    },
    {
      id: 'q-k2',
      quiz_id: 'quiz-kolkheti-102',
      question_text: 'რომელი ვერცხლის მონეტა იჭრებოდა ძვ. წ. VI-III საუკუნეებში დასავლეთ საქართველოში?',
      question_order: 2,
      answers: [
        { id: 'a-k2-1', answer_text: 'კოლხური თეთრი', is_correct: true, answer_order: 1 },
        { id: 'a-k2-2', answer_text: 'დრახმა', is_correct: false, answer_order: 2 },
        { id: 'a-k2-3', answer_text: 'სტატერი', is_correct: false, answer_order: 3 },
        { id: 'a-k2-4', answer_text: 'დინარი', is_correct: false, answer_order: 4 }
      ]
    },
    {
      id: 'q-k3',
      quiz_id: 'quiz-kolkheti-102',
      question_text: 'რომელი ორი იმპერია ებრძოდა ერთმანეთს ეგრისის (დიდი ომის) ტერიტორიაზე VI საუკუნეში?',
      question_order: 3,
      answers: [
        { id: 'a-k3-1', answer_text: 'ბიზანტია და სასანიანთა ირანი', is_correct: true, answer_order: 1 },
        { id: 'a-k3-2', answer_text: 'რომი და კართაგენი', is_correct: false, answer_order: 2 },
        { id: 'a-k3-3', answer_text: 'არაბთა ხალიფატი და ხაზარები', is_correct: false, answer_order: 3 },
        { id: 'a-k3-4', answer_text: 'სელჩუკები და ჯვაროსნები', is_correct: false, answer_order: 4 }
      ]
    },
    {
      id: 'q-k4',
      quiz_id: 'quiz-kolkheti-102',
      question_text: 'რომელი ციხე-ქალაქი იყო ეგრისის სამეფოს დედაქალაქი?',
      question_order: 4,
      answers: [
        { id: 'a-k4-1', answer_text: 'არქეოპოლისი (ნოქალაქევი)', is_correct: true, answer_order: 1 },
        { id: 'a-k4-2', answer_text: 'ფაზისი (ფოთი)', is_correct: false, answer_order: 2 },
        { id: 'a-k4-3', answer_text: 'პოტიუსი', is_correct: false, answer_order: 3 },
        { id: 'a-k4-4', answer_text: 'ცხუმი (სოხუმი)', is_correct: false, answer_order: 4 }
      ]
    },
    {
      id: 'q-k5',
      quiz_id: 'quiz-kolkheti-102',
      question_text: 'რომელი ბერძნული კოლონია დაარსდა შავი ზღვის სანაპიროზე ძვ. წ. VI საუკუნეში?',
      question_order: 5,
      answers: [
        { id: 'a-k5-1', answer_text: 'ფაზისი, დიოსკურია და გიენოსი', is_correct: true, answer_order: 1 },
        { id: 'a-k5-2', answer_text: 'ათენი და სპარტა', is_correct: false, answer_order: 2 },
        { id: 'a-k5-3', answer_text: 'ბიზანტიონი და ნიკეა', is_correct: false, answer_order: 3 },
        { id: 'a-k5-4', answer_text: 'ტრაპეზუნტი და სინოპი', is_correct: false, answer_order: 4 }
      ]
    }
  ],
  'quiz-golden-age-103': [
    {
      id: 'q-g1',
      quiz_id: 'quiz-golden-age-103',
      question_text: 'რომელ წელს მოხდა შამქორის ცნობილი ბრძოლა თამარ მეფის ზეობისას?',
      question_order: 1,
      answers: [
        { id: 'a-g1-1', answer_text: '1195 წელს', is_correct: true, answer_order: 1 },
        { id: 'a-g1-2', answer_text: '1202 წელს', is_correct: false, answer_order: 2 },
        { id: 'a-g1-3', answer_text: '1184 წელს', is_correct: false, answer_order: 3 },
        { id: 'a-g1-4', answer_text: '1213 წელს', is_correct: false, answer_order: 4 }
      ]
    },
    {
      id: 'q-g2',
      quiz_id: 'quiz-golden-age-103',
      question_text: 'ვინ მეთაურობდა ქართველთა ჯარს ბასიანის ბრძოლაში (1202 წ.)?',
      question_order: 2,
      answers: [
        { id: 'a-g2-1', answer_text: 'დავით სოსლანი', is_correct: true, answer_order: 1 },
        { id: 'a-g2-2', answer_text: 'გიორგი III', is_correct: false, answer_order: 2 },
        { id: 'a-g2-3', answer_text: 'იოანე მხარგვიძელი', is_correct: false, answer_order: 3 },
        { id: 'a-g2-4', answer_text: 'შალვა ახალციხელი', is_correct: false, answer_order: 4 }
      ]
    },
    {
      id: 'q-g3',
      quiz_id: 'quiz-golden-age-103',
      question_text: 'რომელი იმპერიის დაარსებაში მიიღო მონაწილეობა საქართველომ 1204 წელს?',
      question_order: 3,
      answers: [
        { id: 'a-g3-1', answer_text: 'ტრაპიზონის იმპერიის', is_correct: true, answer_order: 1 },
        { id: 'a-g3-2', answer_text: 'ლათინთა იმპერიის', is_correct: false, answer_order: 2 },
        { id: 'a-g3-3', answer_text: 'სასანიანთა იმპერიის', is_correct: false, answer_order: 3 },
        { id: 'a-g3-4', answer_text: 'ოსმალეთის იმპერიის', is_correct: false, answer_order: 4 }
      ]
    },
    {
      id: 'q-g4',
      quiz_id: 'quiz-golden-age-103',
      question_text: 'რომელი პოემა მიუძღვნა შოთა რუსთაველმა თამარ მეფეს?',
      question_order: 4,
      answers: [
        { id: 'a-g4-1', answer_text: '„ვეფხისტყაოსანი“', is_correct: true, answer_order: 1 },
        { id: 'a-g4-2', answer_text: '„აბდულმესიანი“', is_correct: false, answer_order: 2 },
        { id: 'a-g4-3', answer_text: '„თამარიანი“', is_correct: false, answer_order: 3 },
        { id: 'a-g4-4', answer_text: '„ქართლის ცხოვრება“', is_correct: false, answer_order: 4 }
      ]
    },
    {
      id: 'q-g5',
      quiz_id: 'quiz-golden-age-103',
      question_text: 'რა ეწოდებოდა თამარ მეფის დროინდელ სახელმწიფო დარბაზს (სათათბირო ორგანოს)?',
      question_order: 5,
      answers: [
        { id: 'a-g5-1', answer_text: 'ყარაულჯის/ისანი დარბაზი (ისნის კარავის იდეა)', is_correct: true, answer_order: 1 },
        { id: 'a-g5-2', answer_text: 'სენატი', is_correct: false, answer_order: 2 },
        { id: 'a-g5-3', answer_text: 'დივანი', is_correct: false, answer_order: 3 },
        { id: 'a-g5-4', answer_text: 'დუმა', is_correct: false, answer_order: 4 }
      ]
    }
  ]
};

const FALLBACK_LEADERBOARD: Record<string, QuizLeaderboardItem[]> = {
  'quiz-didgori-101': [
    { id: 'lb-1', quiz_id: 'quiz-didgori-101', guest_name: 'გიორგი ბერიძე', correct_answers: 5, total_questions: 5, percentage: 100, created_at: '2026-09-01T12:00:00Z' },
    { id: 'lb-2', quiz_id: 'quiz-didgori-101', guest_name: 'ნინო კაპანაძე', correct_answers: 4, total_questions: 5, percentage: 80, created_at: '2026-09-02T14:30:00Z' },
    { id: 'lb-3', quiz_id: 'quiz-didgori-101', guest_name: 'დავით ჯაფარიძე', correct_answers: 4, total_questions: 5, percentage: 80, created_at: '2026-09-03T09:15:00Z' },
    { id: 'lb-4', quiz_id: 'quiz-didgori-101', guest_name: 'ანა მგელაძე', correct_answers: 3, total_questions: 5, percentage: 60, created_at: '2026-09-03T18:40:00Z' }
  ]
};

// Local storage helpers for custom attempts made in offline/fallback mode
const LOCAL_ATTEMPTS_KEY = 'ntistoria_quiz_attempts_local';

function getLocalAttempts(quizId: string): QuizLeaderboardItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_ATTEMPTS_KEY);
    if (!raw) return [];
    const list: QuizLeaderboardItem[] = JSON.parse(raw);
    return list.filter(a => a.quiz_id === quizId);
  } catch (e) {
    return [];
  }
}

function saveLocalAttempt(attempt: QuizLeaderboardItem) {
  try {
    const raw = localStorage.getItem(LOCAL_ATTEMPTS_KEY);
    const list: QuizLeaderboardItem[] = raw ? JSON.parse(raw) : [];
    list.push(attempt);
    localStorage.setItem(LOCAL_ATTEMPTS_KEY, JSON.stringify(list));
  } catch (e) {}
}

// =========================================================
// PUBLIC API METHODS
// =========================================================

// Fetch all published quizzes
export async function fetchPublishedQuizzes(): Promise<QuizItem[]> {
  try {
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select('id, title, description, cover_image_path, status, is_active, created_at')
      .eq('status', 'published')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error || !quizzes || quizzes.length === 0) {
      console.info('Using published fallback quizzes...');
      return FALLBACK_QUIZZES;
    }

    // Get question counts for each quiz
    const result: QuizItem[] = [];
    for (const q of quizzes) {
      const { count } = await supabase
        .from('quiz_questions')
        .select('id', { count: 'exact', head: true })
        .eq('quiz_id', q.id);

      result.push({
        ...q,
        question_count: count || 0
      });
    }

    return result;
  } catch (err) {
    console.error('Error fetching published quizzes:', err);
    return FALLBACK_QUIZZES;
  }
}

// Fetch questions for a specific quiz (without exposing is_correct to client)
export async function fetchQuizQuestionsForPlay(quizId: string): Promise<{ quiz: QuizItem; questions: QuizQuestionItem[] } | null> {
  try {
    // 1. Fetch Quiz Info
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    if (quizError || !quizData) {
      const fallback = FALLBACK_QUIZZES.find(q => q.id === quizId);
      if (fallback) {
        const questions = FALLBACK_QUESTIONS[quizId] || [];
        return { quiz: fallback, questions };
      }
      return null;
    }

    // 2. Fetch Questions
    const { data: questionsData, error: qError } = await supabase
      .from('quiz_questions')
      .select('id, quiz_id, question_text, image_path, question_order')
      .eq('quiz_id', quizId)
      .order('question_order', { ascending: true });

    if (qError || !questionsData || questionsData.length === 0) {
      const questions = FALLBACK_QUESTIONS[quizId] || [];
      return { quiz: quizData, questions };
    }

    // 3. Fetch Answers for each question (Omitting is_correct for play security)
    const formattedQuestions: QuizQuestionItem[] = [];
    for (const q of questionsData) {
      const { data: answersData } = await supabase
        .from('quiz_answers')
        .select('id, question_id, answer_text, answer_order')
        .eq('question_id', q.id)
        .order('answer_order', { ascending: true });

      formattedQuestions.push({
        ...q,
        answers: (answersData || []).map(a => ({ ...a, is_correct: undefined }))
      });
    }

    return {
      quiz: quizData,
      questions: formattedQuestions
    };
  } catch (err) {
    console.error('Error fetching quiz for play:', err);
    const fallback = FALLBACK_QUIZZES.find(q => q.id === quizId);
    if (fallback) {
      const questions = FALLBACK_QUESTIONS[quizId] || [];
      return { quiz: fallback, questions };
    }
    return null;
  }
}

// Submit Quiz Attempt (Server-side evaluation via RPC with client fallback)
export async function submitQuizAttempt(
  quizId: string,
  userId: string | null,
  guestName: string | null,
  userAnswers: { question_id: string; answer_id: string }[]
): Promise<{
  attempt_id: string;
  correct_answers: number;
  total_questions: number;
  percentage: number;
}> {
  const cleanGuest = guestName ? guestName.trim() : null;

  try {
    // Try RPC submit
    const { data, error } = await supabase.rpc('submit_quiz_attempt', {
      p_quiz_id: quizId,
      p_user_id: userId || null,
      p_guest_name: cleanGuest,
      p_user_answers: userAnswers
    });

    if (!error && data) {
      return {
        attempt_id: data.attempt_id,
        correct_answers: data.correct_answers,
        total_questions: data.total_questions,
        percentage: Number(data.percentage)
      };
    }

    console.warn('RPC submit failed or not present, executing client-side fallback grading:', error);
  } catch (e) {
    console.warn('RPC submit exception, doing fallback grading:', e);
  }

  // Fallback grading logic
  let total = 0;
  let correct = 0;

  // Check fallback questions memory or query Supabase
  const fallbackQList = FALLBACK_QUESTIONS[quizId];
  if (fallbackQList && fallbackQList.length > 0) {
    total = fallbackQList.length;
    for (const uAns of userAnswers) {
      const q = fallbackQList.find(item => item.id === uAns.question_id);
      if (q) {
        const selectedOpt = q.answers.find(a => a.id === uAns.answer_id);
        if (selectedOpt && selectedOpt.is_correct) {
          correct++;
        }
      }
    }
  } else {
    // Fetch answers with is_correct from Supabase to grade
    const qIds = userAnswers.map(u => u.question_id);
    const { data: qData } = await supabase
      .from('quiz_questions')
      .select('id')
      .eq('quiz_id', quizId);

    total = qData?.length || userAnswers.length || 1;

    for (const uAns of userAnswers) {
      const { data: aData } = await supabase
        .from('quiz_answers')
        .select('is_correct')
        .eq('id', uAns.answer_id)
        .single();

      if (aData?.is_correct) {
        correct++;
      }
    }
  }

  const percentage = Math.round((correct / (total || 1)) * 100);
  const newId = `att-${Date.now()}`;

  // Insert attempt directly to database if RPC wasn't available
  try {
    await supabase.from('quiz_attempts').insert({
      quiz_id: quizId,
      user_id: userId || null,
      guest_name: cleanGuest,
      correct_answers: correct,
      total_questions: total,
      percentage: percentage
    });
  } catch (e) {
    console.warn('Failed to insert attempt to Supabase, saving to localStorage:', e);
    saveLocalAttempt({
      id: newId,
      quiz_id: quizId,
      user_id: userId,
      guest_name: cleanGuest || 'სტუმარი',
      correct_answers: correct,
      total_questions: total,
      percentage: percentage,
      created_at: new Date().toISOString()
    });
  }

  return {
    attempt_id: newId,
    correct_answers: correct,
    total_questions: total,
    percentage: percentage
  };
}

// Fetch Leaderboard for a specific quiz (Best score per user/guest)
export async function fetchQuizLeaderboard(quizId: string): Promise<QuizLeaderboardItem[]> {
  try {
    // 1. Try View `quiz_leaderboard_best`
    const { data: viewData, error: viewError } = await supabase
      .from('quiz_leaderboard_best')
      .select('*')
      .eq('quiz_id', quizId)
      .limit(50);

    if (!viewError && viewData && viewData.length > 0) {
      return viewData;
    }

    // 2. Fallback query on `quiz_attempts`
    const { data: attemptsData, error: attemptsError } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('quiz_id', quizId)
      .order('correct_answers', { ascending: false })
      .order('percentage', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(100);

    if (!attemptsError && attemptsData && attemptsData.length > 0) {
      // Deduplicate to keep best score per guest/user
      const map = new Map<string, QuizLeaderboardItem>();
      for (const item of attemptsData) {
        const key = item.user_id ? `u_${item.user_id}` : `g_${(item.guest_name || '').toLowerCase().trim()}`;
        if (!map.has(key)) {
          map.set(key, item);
        }
      }
      return Array.from(map.values()).sort((a, b) => {
        if (b.correct_answers !== a.correct_answers) return b.correct_answers - a.correct_answers;
        if (b.percentage !== a.percentage) return b.percentage - a.percentage;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    }
  } catch (err) {
    console.error('Error fetching leaderboard from DB:', err);
  }

  // Combine fallback + local attempts
  const fb = FALLBACK_LEADERBOARD[quizId] || [];
  const local = getLocalAttempts(quizId);
  const combined = [...local, ...fb];

  // Deduplicate
  const map = new Map<string, QuizLeaderboardItem>();
  for (const item of combined) {
    const key = item.user_id ? `u_${item.user_id}` : `g_${(item.guest_name || '').toLowerCase().trim()}`;
    if (!map.has(key)) {
      map.set(key, item);
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.correct_answers !== a.correct_answers) return b.correct_answers - a.correct_answers;
    if (b.percentage !== a.percentage) return b.percentage - a.percentage;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

// =========================================================
// ADMIN API METHODS
// =========================================================

// Fetch all quizzes for Admin (Including drafts)
export async function fetchAllQuizzesAdmin(): Promise<QuizItem[]> {
  try {
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !quizzes) {
      return FALLBACK_QUIZZES;
    }

    const result: QuizItem[] = [];
    for (const q of quizzes) {
      const { count } = await supabase
        .from('quiz_questions')
        .select('id', { count: 'exact', head: true })
        .eq('quiz_id', q.id);

      result.push({
        ...q,
        question_count: count || 0
      });
    }

    return result;
  } catch (err) {
    console.error('Error fetching admin quizzes:', err);
    return FALLBACK_QUIZZES;
  }
}

// Create or update Quiz (Admin)
export async function saveQuizAdmin(quizData: Partial<QuizItem>): Promise<QuizItem> {
  const payload = {
    title: quizData.title?.trim(),
    description: quizData.description?.trim() || null,
    cover_image_path: quizData.cover_image_path || null,
    status: quizData.status || 'draft',
    is_active: quizData.is_active !== undefined ? quizData.is_active : true,
    updated_at: new Date().toISOString()
  };

  if (quizData.id && !quizData.id.startsWith('quiz-')) {
    const { data, error } = await supabase
      .from('quizzes')
      .update(payload)
      .eq('id', quizData.id)
      .select()
      .single();

    if (error) throw new Error(`ქვიზის განახლება ვერ მოხერხდა: ${error.message}`);
    return data;
  } else {
    const { data, error } = await supabase
      .from('quizzes')
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(`ქვიზის შექმნა ვერ მოხერხდა: ${error.message}`);
    return data;
  }
}

// Delete Quiz (Admin - Cascade deletes questions, answers, attempts)
export async function deleteQuizAdmin(quizId: string): Promise<void> {
  const { error } = await supabase
    .from('quizzes')
    .delete()
    .eq('id', quizId);

  if (error) {
    throw new Error(`ქვიზის წაშლა ვერ მოხერხდა: ${error.message}`);
  }
}

// Fetch Questions for Admin (Includes is_correct)
export async function fetchQuizQuestionsAdmin(quizId: string): Promise<QuizQuestionItem[]> {
  try {
    const { data: questionsData, error: qError } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('question_order', { ascending: true });

    if (qError || !questionsData) {
      return FALLBACK_QUESTIONS[quizId] || [];
    }

    const result: QuizQuestionItem[] = [];
    for (const q of questionsData) {
      const { data: answersData } = await supabase
        .from('quiz_answers')
        .select('*')
        .eq('question_id', q.id)
        .order('answer_order', { ascending: true });

      result.push({
        ...q,
        answers: answersData || []
      });
    }

    return result;
  } catch (err) {
    console.error('Error fetching admin quiz questions:', err);
    return FALLBACK_QUESTIONS[quizId] || [];
  }
}

// Save Question with its Answers (Admin)
export async function saveQuestionAdmin(
  quizId: string,
  question: Partial<QuizQuestionItem>,
  answers: { id?: string; answer_text: string; is_correct: boolean; answer_order: number }[]
): Promise<QuizQuestionItem> {
  if (answers.length < 4) {
    throw new Error('კითხვას უნდა ჰქონდეს მინიმუმ 4 სავარაუდო პასუხი');
  }

  const hasCorrect = answers.some(a => a.is_correct);
  if (!hasCorrect) {
    throw new Error('გთხოვთ მონიშნოთ 1 სწორი პასუხი');
  }

  const qPayload = {
    quiz_id: quizId,
    question_text: question.question_text?.trim(),
    image_path: question.image_path || null,
    question_order: question.question_order || 1,
    updated_at: new Date().toISOString()
  };

  let savedQId = question.id;

  if (savedQId && !savedQId.startsWith('q-')) {
    const { error } = await supabase
      .from('quiz_questions')
      .update(qPayload)
      .eq('id', savedQId);

    if (error) throw new Error(`კითხვის განახლება ვერ მოხერხდა: ${error.message}`);
  } else {
    const { data, error } = await supabase
      .from('quiz_questions')
      .insert(qPayload)
      .select()
      .single();

    if (error) throw new Error(`კითხვის შექმნა ვერ მოხერხდა: ${error.message}`);
    savedQId = data.id;
  }

  // Delete existing answers if updating and re-insert cleanly
  if (question.id && !question.id.startsWith('q-')) {
    await supabase
      .from('quiz_answers')
      .delete()
      .eq('question_id', savedQId);
  }

  // Insert answers
  const answersPayload = answers.map((ans, idx) => ({
    question_id: savedQId,
    answer_text: ans.answer_text.trim(),
    is_correct: ans.is_correct,
    answer_order: ans.answer_order || idx + 1
  }));

  const { data: savedAnswers, error: ansError } = await supabase
    .from('quiz_answers')
    .insert(answersPayload)
    .select();

  if (ansError) throw new Error(`პასუხების შენახვა ვერ მოხერხდა: ${ansError.message}`);

  return {
    id: savedQId!,
    quiz_id: quizId,
    question_text: qPayload.question_text!,
    image_path: qPayload.image_path,
    question_order: qPayload.question_order,
    answers: savedAnswers || []
  };
}

// Delete Question (Admin)
export async function deleteQuestionAdmin(questionId: string): Promise<void> {
  const { error } = await supabase
    .from('quiz_questions')
    .delete()
    .eq('id', questionId);

  if (error) {
    throw new Error(`კითხვის წაშლა ვერ მოხერხდა: ${error.message}`);
  }
}
