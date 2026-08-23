import { QuizQuestion, HistoryTest, HistoricalCategory } from '../types';
import { supabase } from './supabase';

export interface ProgramChapter {
  id: string;
  chapterNumber: number;
  title: string;
  description: string;
  subprograms: {
    id: string;
    title: string;
  }[];
}

export interface TestCategoryMeta {
  key: string;
  tableNames: string[];
  title: string;
  subtitle: string;
  timeLimitMinutes: number;
  badge: string;
  isIndependent?: boolean;
}

export const TEST_CATEGORIES: TestCategoryMeta[] = [
  {
    key: 'mcq',
    tableNames: ['multiple_choice_questions', 'არჩევითპასუხიანი', 'mcq_questions'],
    title: 'არჩევითპასუხიანი კითხვები (N1-35)',
    subtitle: 'ეროვნული გამოცდების პირველი ნაწილი: არჩევითპასუხიანი კითხვები',
    timeLimitMinutes: 0,
    badge: 'N1-35'
  },
  {
    key: 'map',
    tableNames: ['maps_questions', 'map_questions', 'რუკა', 'maps'],
    title: 'ისტორიული რუკა (N36)',
    subtitle: 'კარტოგრაფიული დავალება, საზღვრებისა და მარშრუტების ანალიზი',
    timeLimitMinutes: 0,
    badge: 'N36'
  },
  {
    key: 'analogies',
    tableNames: ['analogy_questions', 'analogies', 'ანალოგიები'],
    title: 'ანალოგიები (N37)',
    subtitle: 'ისტორიული მოვლენების მიზეზ-შედეგობრივი შედარება და წყვილები',
    timeLimitMinutes: 0,
    badge: 'N37'
  },
  {
    key: 'source',
    tableNames: ['source_questions', 'sources', 'წყარო'],
    title: 'ისტორიული წყარო (N38)',
    subtitle: 'პირველწყაროს ტექსტუალური ანალიზი და კრიტიკული შეფასება',
    timeLimitMinutes: 0,
    badge: 'N38'
  },
  {
    key: 'chronology',
    tableNames: ['chronology_questions', 'chronology', 'ქრონოლოგია'],
    title: 'ქრონოლოგია',
    subtitle: 'ისტორიული თარიღებისა და მოვლენების თანმიმდევრობით დალაგება',
    timeLimitMinutes: 0,
    badge: 'სხვა',
    isIndependent: true
  },
  {
    key: 'illustrations',
    tableNames: ['illustration_questions', 'illustrations', 'ilustrations', 'ილუსტრაციები'],
    title: 'ილუსტრაციები',
    subtitle: 'ვიზუალური წყაროების, არტეფაქტებისა და ფოტოების ანალიზი',
    timeLimitMinutes: 0,
    badge: 'სხვა'
  }
];

// ZERO hardcoded dummy questions - all questions are strictly fetched from Supabase database tables
export const FALLBACK_QUESTIONS: Record<string, (QuizQuestion & { chapterId: string })[]> = {
  mcq: [],
  map: [],
  analogies: [],
  source: [],
  chronology: [],
  illustrations: []
};

// Default Program Structure fallback if database program table is loading
export const DEFAULT_PROGRAMS: ProgramChapter[] = [
  {
    id: 'ch-1',
    chapterNumber: 1,
    title: 'თავი 1: ანტიკური ხანის საქართველო — კოლხეთი და იბერია',
    description: 'ფარნავაზ I-ის რეფორმები, ქართლის გაერთიანება და ქრისტიანობის მიღება',
    subprograms: []
  },
  {
    id: 'ch-2',
    chapterNumber: 2,
    title: 'თავი 2: საქართველო V-X საუკუნეებში (გორგასლიდან ბაგრატ III-მდე)',
    description: 'ვახტანგ გორგასალი, არაბობა და ბაგრატ III-ის მიერ საქართველოს გაერთიანება',
    subprograms: []
  },
  {
    id: 'ch-3',
    chapterNumber: 3,
    title: 'თავი 3: საქართველოს ოქროს ხანა (XI - XIII სს.)',
    description: 'დავით IV აღმაშენებელი, დიდგორის ბრძოლა და თამარ მეფის ეპოქა',
    subprograms: []
  },
  {
    id: 'ch-4',
    chapterNumber: 4,
    title: 'თავი 4: მონღოლობა და ბრძოლა ერთიანობისთვის (XIII - XIV სს.)',
    description: 'მონღოლთა შემოსევები, ცოტნე დადიანი, გიორგი V ბრწყინვალე',
    subprograms: []
  },
  {
    id: 'ch-5',
    chapterNumber: 5,
    title: 'თავი 5: გვიანი შუა საუკუნეები — დაშლა და საგარეო აგრესია (XV - XVII სს.)',
    description: 'სამეფო-სამთავროებად დაშლა, ოსმალეთისა და ირანის აგრესია, გიორგი სააკაძე',
    subprograms: []
  },
  {
    id: 'ch-6',
    chapterNumber: 6,
    title: 'თავი 6: XVIII საუკუნის საქართველო — ერეკლე II და ტრაქტატი',
    description: 'ქართლ-კახეთის გაერთიანება, ასპინძის ბრძოლა, 1783 წლის გეორგიევსკის ტრაქტატი',
    subprograms: []
  },
  {
    id: 'ch-7',
    chapterNumber: 7,
    title: 'თავი 7: XIX საუკუნე — რუსული მმართველობა და ეროვნული გათავისუფლება',
    description: '1801 წლის ანექსია, 1832 წლის შეთქმულება, თერგდალეულები და ილია ჭავჭავაძე',
    subprograms: []
  },
  {
    id: 'ch-8',
    chapterNumber: 8,
    title: 'თავი 8: საქართველოს პირველი დემოკრატიული რესპუბლიკა (1918-1921)',
    description: '1918 წლის 26 მაისის დამოუკიდებლობის გამოცხადება და კონსტიტუცია',
    subprograms: []
  },
  {
    id: 'ch-9',
    chapterNumber: 9,
    title: 'თავი 9: საბჭოთა ოკუპაცია და XX საუკუნის ეროვნული მოძრაობები',
    description: '1921 წლის წითელი არმიის შემოჭრა, რეპრესიები და 1989 წლის 9 აპრილი',
    subprograms: []
  },
  {
    id: 'ch-10',
    chapterNumber: 10,
    title: 'თავი 10: დამოუკიდებლობის აღდგენა და თანამედროვე საქართველო',
    description: '1991 წლის 9 აპრილის დამოუკიდებლობის აღდგენის აქტი და თანამედროვეობა',
    subprograms: []
  },
  {
    id: 'ch-11',
    chapterNumber: 11,
    title: 'თავი 11: მსოფლიო ისტორიის გარდამტეხი მოვლენები',
    description: 'ანტიკური საბერძნეთი, რომის იმპერია, დიდი გეოგრაფიული აღმოჩენები და მსოფლიო ომები',
    subprograms: []
  }
];

/**
 * Fetch Program Chapters from Supabase tables (history_exam schema, public, or program)
 */
export const fetchProgramsAndSubprograms = async (): Promise<ProgramChapter[]> => {
  const possibleProgramTables = ['exam_programs', 'program', 'programs'];
  const possibleSubprogramTables = ['exam_subprograms', 'subprogram', 'subprograms'];

  for (const pTable of possibleProgramTables) {
    try {
      // 1. Try history_exam schema
      let { data: progData, error: progErr } = await supabase
        .schema('history_exam')
        .from(pTable)
        .select('*');

      if (progErr || !progData || progData.length === 0) {
        // 2. Try public schema
        const res = await supabase.from(pTable).select('*');
        progData = res.data;
        progErr = res.error;
      }

      if (!progErr && progData && progData.length > 0) {
        // Sort by chapter number
        progData.sort((a: any, b: any) => (a.chapter_number || a.order || 1) - (b.chapter_number || b.order || 1));

        let subData: any[] = [];
        for (const sTable of possibleSubprogramTables) {
          try {
            const { data: s1 } = await supabase.schema('history_exam').from(sTable).select('*');
            if (s1 && s1.length > 0) {
              subData = s1;
              break;
            }
          } catch (e) {}

          const { data: s2 } = await supabase.from(sTable).select('*');
          if (s2 && s2.length > 0) {
            subData = s2;
            break;
          }
        }

        return progData.map((p: any) => ({
          id: String(p.id || `ch-${p.chapter_number || 1}`),
          chapterNumber: Number(p.chapter_number || p.order || 1),
          title: p.title || p.name || `თავი ${p.chapter_number || 1}`,
          description: p.description || p.details || '',
          subprograms: subData
            .filter((s: any) => String(s.program_id) === String(p.id) || String(s.chapter_id) === String(p.id))
            .map((s: any) => ({
              id: String(s.id),
              title: s.title || s.name || ''
            }))
        }));
      }
    } catch (e) {}
  }

  return DEFAULT_PROGRAMS;
};

/**
 * Fetch Total Question Count for a Category directly from Supabase DB
 */
export const fetchCategoryQuestionsCount = async (categoryKey: string): Promise<number> => {
  const catMeta = TEST_CATEGORIES.find(c => c.key === categoryKey);
  const tablesToQuery = catMeta?.tableNames || [categoryKey];

  for (const tableName of tablesToQuery) {
    try {
      // 1. Try history_exam schema
      const { count: hCount, error: hErr } = await supabase
        .schema('history_exam')
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (!hErr && typeof hCount === 'number') {
        return hCount;
      }

      // 2. Try public schema
      const { count: pCount, error: pErr } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (!pErr && typeof pCount === 'number') {
        return pCount;
      }
    } catch (err) {}
  }

  return 0;
};

/**
 * Fetch Real Test Questions for a category directly from Supabase tables
 */
export const fetchQuestionsForCategory = async (categoryKey: string): Promise<(QuizQuestion & { chapterId: string })[]> => {
  const catMeta = TEST_CATEGORIES.find(c => c.key === categoryKey);
  const tablesToQuery = catMeta?.tableNames || [categoryKey];

  for (const tableName of tablesToQuery) {
    try {
      let rawQuestions: any[] = [];

      // 1. Try history_exam schema
      const { data: hQuestions, error: hErr } = await supabase
        .schema('history_exam')
        .from(tableName)
        .select('*');

      if (!hErr && hQuestions && hQuestions.length > 0) {
        rawQuestions = hQuestions;
      } else {
        // 2. Try public schema
        const { data: pQuestions, error: pErr } = await supabase.from(tableName).select('*');
        if (!pErr && pQuestions && pQuestions.length > 0) {
          rawQuestions = pQuestions;
        }
      }

      if (rawQuestions.length > 0) {
        // Joined data maps (e.g. maps, sources)
        let mapsMap: Record<string, string> = {};
        let sourcesMap: Record<string, string> = {};

        if (categoryKey === 'map') {
          const possibleMapTables = ['maps', 'map', 'რუკა'];
          for (const mTab of possibleMapTables) {
            try {
              const { data: mData } = await supabase.schema('history_exam').from(mTab).select('*');
              if (mData && mData.length > 0) {
                mData.forEach((m: any) => {
                  mapsMap[m.id] = m.map_url || m.image_url || m.url || m.link;
                });
                break;
              }
            } catch (e) {}

            const { data: mData2 } = await supabase.from(mTab).select('*');
            if (mData2 && mData2.length > 0) {
              mData2.forEach((m: any) => {
                mapsMap[m.id] = m.map_url || m.image_url || m.url || m.link;
              });
              break;
            }
          }
        }

        if (categoryKey === 'source') {
          const possibleSourceTables = ['sources', 'source', 'წყარო'];
          for (const sTab of possibleSourceTables) {
            try {
              const { data: sData } = await supabase.schema('history_exam').from(sTab).select('*');
              if (sData && sData.length > 0) {
                sData.forEach((s: any) => {
                  sourcesMap[s.id] = s.text || s.content || s.body || s.title;
                });
                break;
              }
            } catch (e) {}

            const { data: sData2 } = await supabase.from(sTab).select('*');
            if (sData2 && sData2.length > 0) {
              sData2.forEach((s: any) => {
                sourcesMap[s.id] = s.text || s.content || s.body || s.title;
              });
              break;
            }
          }
        }

        return rawQuestions.map((item: any, idx: number) => {
          let opts: string[] = [];
          if (Array.isArray(item.options)) {
            opts = item.options;
          } else if (typeof item.options === 'string') {
            try { opts = JSON.parse(item.options); } catch (e) { opts = [item.options]; }
          } else {
            opts = [
              item.option_a || item.option1 || 'ა',
              item.option_b || item.option2 || 'ბ',
              item.option_c || item.option3 || 'გ',
              item.option_d || item.option4 || 'დ'
            ];
          }

          const rawChapter = item.chapter_id || item.program_id || item.chapterId || `ch-${(idx % 11) + 1}`;

          return {
            id: String(item.id || `${categoryKey}-${idx}`),
            chapterId: String(rawChapter).startsWith('ch-') ? String(rawChapter) : `ch-${rawChapter}`,
            prompt: item.prompt || item.question || item.title || item.question_text || 'კითხვა',
            options: opts,
            correctAnswerIndex: typeof item.correct_answer_index === 'number' 
              ? item.correct_answer_index 
              : typeof item.correct_option === 'number' 
                ? item.correct_option 
                : typeof item.correct_answer === 'number' ? item.correct_answer : 0,
            explanation: item.explanation || item.description || item.answer_explanation || '',
            sourceContext: item.source_context || item.source_text || item.sourceContext || (item.source_id ? sourcesMap[item.source_id] : undefined),
            mapImage: item.map_image || item.map_url || item.image_url || item.url || (item.map_id ? mapsMap[item.map_id] : undefined)
          };
        });
      }
    } catch (err) {}
  }

  return [];
};

/**
 * Build a full HistoryTest object for a category & selected chapter from Supabase
 */
export const buildHistoryTest = async (
  categoryKey: string, 
  chapterId?: string
): Promise<HistoryTest> => {
  const catMeta = TEST_CATEGORIES.find(c => c.key === categoryKey) || TEST_CATEGORIES[0];
  const allQuestions = await fetchQuestionsForCategory(categoryKey);

  let filteredQuestions = allQuestions;
  if (chapterId && chapterId !== 'all') {
    filteredQuestions = allQuestions.filter(q => q.chapterId === chapterId || q.chapterId === `ch-${chapterId}`);
    if (filteredQuestions.length === 0) {
      filteredQuestions = allQuestions;
    }
  }

  const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);

  const programs = await fetchProgramsAndSubprograms();
  const selectedChapter = programs.find(p => p.id === chapterId);
  const testTitle = selectedChapter 
    ? `${catMeta.title} — ${selectedChapter.title}`
    : `${catMeta.title} (ყველა თავიდან)`;

  return {
    id: `${categoryKey}-${chapterId || 'all'}-${Date.now()}`,
    title: testTitle,
    category: 'ეროვნული გამოცდები' as HistoricalCategory,
    difficulty: 'საგამოცდო',
    timeLimitMinutes: 0,
    questionCount: shuffled.length,
    description: selectedChapter ? selectedChapter.description : catMeta.subtitle,
    questions: shuffled
  };
};
