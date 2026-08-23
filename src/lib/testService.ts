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
    tableNames: ['chronology', 'chronology_questions', 'ქრონოლოგია'],
    title: 'ქრონოლოგია',
    subtitle: 'ისტორიული თარიღებისა და მოვლენების თანმიმდევრობით დალაგება',
    timeLimitMinutes: 0,
    badge: 'სხვა',
    isIndependent: true
  },
  {
    key: 'illustrations',
    tableNames: ['illustrations_questions', 'illustration_questions', 'illustrations', 'ilustrations', 'ილუსტრაციები'],
    title: 'ილუსტრაციები',
    subtitle: 'ვიზუალური წყაროების, არტეფაქტებისა და ფოტოების ანალიზი',
    timeLimitMinutes: 0,
    badge: 'სხვა'
  }
];

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
 * Fetch Program Chapters from Supabase tables (exam_programs & sub_programs)
 */
export const fetchProgramsAndSubprograms = async (): Promise<ProgramChapter[]> => {
  const possibleProgramTables = ['exam_programs', 'program', 'programs'];
  const possibleSubprogramTables = ['sub_programs', 'exam_subprograms', 'subprogram', 'subprograms'];

  for (const pTable of possibleProgramTables) {
    try {
      const res = await supabase.from(pTable).select('*');
      const progData = res.data;
      const progErr = res.error;

      if (!progErr && progData && progData.length > 0) {
        progData.sort((a: any, b: any) => 
          (a.program_number || a.chapter_number || a.order || 1) - 
          (b.program_number || b.chapter_number || b.order || 1)
        );

        let subData: any[] = [];
        for (const sTable of possibleSubprogramTables) {
          const { data: s2 } = await supabase.from(sTable).select('*');
          if (s2 && s2.length > 0) {
            subData = s2;
            break;
          }
        }

        return progData.map((p: any) => {
          const num = Number(p.program_number || p.chapter_number || p.order || 1);
          const pId = `ch-${num}`;
          return {
            id: pId,
            chapterNumber: num,
            title: p.program_name || p.title || p.name || `თავი ${num}`,
            description: p.description || p.details || '',
            subprograms: subData
              .filter((s: any) => Number(s.program_number) === num || String(s.program_id) === String(p.id))
              .map((s: any) => ({
                id: String(s.sub_program_number || s.id),
                title: s.sub_name || s.title || s.name || ''
              }))
          };
        });
      }
    } catch (e) {}
  }

  return DEFAULT_PROGRAMS;
};

/**
 * Fetch Total Question Count for a Category directly from Supabase DB (public schema)
 */
export const fetchCategoryQuestionsCount = async (categoryKey: string): Promise<number> => {
  const catMeta = TEST_CATEGORIES.find(c => c.key === categoryKey);
  const tablesToQuery = catMeta?.tableNames || [categoryKey];

  for (const tableName of tablesToQuery) {
    try {
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

      // 1. Try embedded join queries for parent tables (maps, analogy, source, illustrations)
      if (categoryKey === 'map') {
        const { data: mQData, error: mQErr } = await supabase
          .from(tableName)
          .select('*, maps!inner(*)');
        if (!mQErr && mQData && mQData.length > 0) {
          rawQuestions = mQData;
        }
      } else if (categoryKey === 'analogies') {
        const { data: aQData, error: aQErr } = await supabase
          .from(tableName)
          .select('*, analogy!inner(*)');
        if (!aQErr && aQData && aQData.length > 0) {
          rawQuestions = aQData;
        }
      } else if (categoryKey === 'source') {
        const { data: sQData, error: sQErr } = await supabase
          .from(tableName)
          .select('*, source!inner(*)');
        if (!sQErr && sQData && sQData.length > 0) {
          rawQuestions = sQData;
        }
      } else if (categoryKey === 'illustrations') {
        const { data: iQData, error: iQErr } = await supabase
          .from(tableName)
          .select('*, illustrations!inner(*)');
        if (!iQErr && iQData && iQData.length > 0) {
          rawQuestions = iQData;
        }
      }

      // Fallback to direct select if embedded join was empty or not applicable
      if (rawQuestions.length === 0) {
        const { data: pQuestions, error: pErr } = await supabase.from(tableName).select('*');
        if (!pErr && pQuestions && pQuestions.length > 0) {
          rawQuestions = pQuestions;
        }
      }

      if (rawQuestions.length > 0) {
        // Fetch parent lookup tables if not embedded
        let mapsMap: Record<number, { map_url: string; program_number: number }> = {};
        let analogyMap: Record<number, { analogy: string; program_number: number }> = {};
        let sourceMap: Record<number, { source: string; program_number: number }> = {};
        let illustrationMap: Record<number, { illustration_url: string; program_number: number }> = {};

        if (categoryKey === 'map' && !rawQuestions[0].maps) {
          const { data: mData } = await supabase.from('maps').select('*');
          if (mData) {
            mData.forEach((m: any) => {
              mapsMap[m.map_number || m.id] = {
                map_url: m.map_url || m.image_url || m.url,
                program_number: Number(m.program_number || 1)
              };
            });
          }
        }

        if (categoryKey === 'analogies' && !rawQuestions[0].analogy) {
          const { data: aData } = await supabase.from('analogy').select('*');
          if (aData) {
            aData.forEach((a: any) => {
              analogyMap[a.analogy_number || a.id] = {
                analogy: a.analogy || a.text,
                program_number: Number(a.program_number || 1)
              };
            });
          }
        }

        if (categoryKey === 'source' && !rawQuestions[0].source) {
          const { data: sData } = await supabase.from('source').select('*');
          if (sData) {
            sData.forEach((s: any) => {
              sourceMap[s.source_number || s.id] = {
                source: s.source || s.text,
                program_number: Number(s.program_number || 1)
              };
            });
          }
        }

        if (categoryKey === 'illustrations' && !rawQuestions[0].illustrations) {
          const { data: iData } = await supabase.from('illustrations').select('*');
          if (iData) {
            iData.forEach((i: any) => {
              illustrationMap[i.illustration_number || i.id] = {
                illustration_url: i.illustration_url || i.image_url || i.url,
                program_number: Number(i.program_number || 1)
              };
            });
          }
        }

        return rawQuestions.map((item: any, idx: number) => {
          // Options mapping
          let opts: string[] = [];
          if (Array.isArray(item.options)) {
            opts = item.options;
          } else if (typeof item.options === 'string') {
            try { opts = JSON.parse(item.options); } catch (e) { opts = [item.options]; }
          } else if (item.answer_1 || item.answer_2) {
            opts = [
              item.answer_1 || item.option_a || 'ა',
              item.answer_2 || item.option_b || 'ბ',
              item.answer_3 || item.option_c || 'გ',
              item.answer_4 || item.option_d || 'დ'
            ].filter(Boolean);
          } else if (item.answer || item.correct_answer) {
            opts = [item.answer || item.correct_answer];
          } else {
            opts = ['ა', 'ბ', 'გ', 'დ'];
          }

          // Program / Chapter Number mapping
          let pNum: number = Number(
            item.program_number ||
            item.maps?.program_number ||
            item.analogy?.program_number ||
            item.source?.program_number ||
            item.illustrations?.program_number ||
            mapsMap[item.map_number]?.program_number ||
            analogyMap[item.analogy_number]?.program_number ||
            sourceMap[item.source_number]?.program_number ||
            illustrationMap[item.illustration_number]?.program_number ||
            ((idx % 11) + 1)
          );

          const chapterId = `ch-${pNum}`;

          // Correct Answer Index mapping (1-based integer from DB -> 0-based index for FE)
          let correctIdx = 0;
          if (typeof item.correct_answer === 'number') {
            correctIdx = item.correct_answer > 0 ? item.correct_answer - 1 : 0;
          } else if (typeof item.correct_answer_index === 'number') {
            correctIdx = item.correct_answer_index;
          } else if (typeof item.correct_option === 'number') {
            correctIdx = item.correct_option - 1;
          }

          // Image mapping
          const mapImg = item.map_image ||
            item.map_url ||
            item.maps?.map_url ||
            item.illustrations?.illustration_url ||
            mapsMap[item.map_number]?.map_url ||
            illustrationMap[item.illustration_number]?.illustration_url ||
            undefined;

          // Source / Context text mapping
          const srcContext = item.source_context ||
            item.source_text ||
            item.analogy?.analogy ||
            item.source?.source ||
            analogyMap[item.analogy_number]?.analogy ||
            sourceMap[item.source_number]?.source ||
            undefined;

          // Explanation
          let expl = item.explanation || item.description || '';
          if (!expl && item.answer) {
            expl = `სწორი პასუხი: ${item.answer}`;
          } else if (!expl && typeof item.correct_answer === 'string') {
            expl = `სწორი პასუხი: ${item.correct_answer}`;
          }

          return {
            id: String(item.id || `${categoryKey}-${idx}`),
            chapterId,
            prompt: item.question || item.prompt || item.title || 'კითხვა',
            options: opts,
            correctAnswerIndex: correctIdx,
            explanation: expl,
            sourceContext: srcContext,
            mapImage: mapImg
          };
        });
      }
    } catch (err) {
      console.warn(`Error fetching questions for ${categoryKey}:`, err);
    }
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
