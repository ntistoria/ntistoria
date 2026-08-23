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
  tableName: string;
  title: string;
  subtitle: string;
  timeLimitMinutes: number;
  badge: string;
  isIndependent?: boolean; // Chronology is independent of chapters
}

export const TEST_CATEGORIES: TestCategoryMeta[] = [
  {
    key: 'mcq',
    tableName: 'multiple_choice_questions',
    title: 'არჩევითპასუხიანი კითხვები (N1-35)',
    subtitle: 'ეროვნული გამოცდების პირველი ნაწილი: 35 არჩევითპასუხიანი კითხვა',
    timeLimitMinutes: 0,
    badge: 'N1-35'
  },
  {
    key: 'map',
    tableName: 'maps_questions',
    title: 'ისტორიული რუკა (N36)',
    subtitle: 'კარტოგრაფიული დავალება, საზღვრებისა და მარშრუტების ანალიზი',
    timeLimitMinutes: 0,
    badge: 'N36'
  },
  {
    key: 'analogies',
    tableName: 'analogy_questions',
    title: 'ანალოგიები (N37)',
    subtitle: 'ისტორიული მოვლენების მიზეზ-შედეგობრივი შედარება და წყვილები',
    timeLimitMinutes: 0,
    badge: 'N37'
  },
  {
    key: 'source',
    tableName: 'source_questions',
    title: 'ისტორიული წყარო (N38)',
    subtitle: 'პირველწყაროს ტექსტუალური ანალიზი და კრიტიკული შეფასება',
    timeLimitMinutes: 0,
    badge: 'N38'
  },
  {
    key: 'chronology',
    tableName: 'chronology_questions',
    title: 'ქრონოლოგია',
    subtitle: 'ისტორიული თარიღებისა და მოვლენების თანმიმდევრობით დალაგება',
    timeLimitMinutes: 0,
    badge: 'სხვა',
    isIndependent: true
  },
  {
    key: 'illustrations',
    tableName: 'illustration_questions',
    title: 'ილუსტრაციები',
    subtitle: 'ვიზუალური წყაროების, არტეფაქტებისა და ფოტოების ანალიზი',
    timeLimitMinutes: 0,
    badge: 'სხვა'
  }
];

// Full 11 Program Chapters for NAEC Exam Curriculum
export const FALLBACK_PROGRAMS: ProgramChapter[] = [
  {
    id: 'ch-1',
    chapterNumber: 1,
    title: 'თავი 1: ანტიკური ხანის საქართველო — კოლხეთი და იბერია',
    description: 'ფარნავაზ I-ის რეფორმები, ქართლის გაერთიანება და ქრისტიანობის მიღება (ძვ.წ. VI - ახ.წ. IV სს.)',
    subprograms: [
      { id: 'sub-1-1', title: '1.1 კოლხეთისა და იბერიის სამეფოების წარმოშობა' },
      { id: 'sub-1-2', title: '1.2 ფარნავაზ I-ის სახელმწიფოებრივი და რელიგიური რეფორმები' },
      { id: 'sub-1-3', title: '1.3 ქრისტიანობის სახელმწიფო რელიგიად გამოცხადება მირიანის დროს' }
    ]
  },
  {
    id: 'ch-2',
    chapterNumber: 2,
    title: 'თავი 2: საქართველო V-X საუკუნეებში (გორგასლიდან ბაგრატ III-მდე)',
    description: 'ვახტანგ გორგასალი, არაბობა, ერისმთავრობა და ბაგრატ III-ის მიერ საქართველოს გაერთიანება',
    subprograms: [
      { id: 'sub-2-1', title: '2.1 ვახტანგ გორგასალი და ბრძოლა ირანის აგრესიის წინააღმდეგ' },
      { id: 'sub-2-2', title: '2.2 არაბთა ბატონობა საქართველოში და თბილისის ამირო' },
      { id: 'sub-2-3', title: '2.3 ბაგრატ III — ერთიანი ფეოდალური მონარქიის შექმნა (1008 წ.)' }
    ]
  },
  {
    id: 'ch-3',
    chapterNumber: 3,
    title: 'თავი 3: საქართველოს ოქროს ხანა (XI - XIII სს.)',
    description: 'დავით IV აღმაშენებლის რეფორმები, დიდგორის ბრძოლა და თამარ მეფის ეპოქა',
    subprograms: [
      { id: 'sub-3-1', title: '3.1 დავით IV აღმაშენებელი და 1121 წლის დიდგორის ომი' },
      { id: 'sub-3-2', title: '3.2 თბილისის გათავისუფლება და გელათის აკადემიის დაარსება' },
      { id: 'sub-3-3', title: '3.3 თამარ მეფის ეპოქის პოლიტიკური და კულტურული ზენიტი' }
    ]
  },
  {
    id: 'ch-4',
    chapterNumber: 4,
    title: 'თავი 4: მონღოლობა და ბრძოლა ერთიანობისთვის (XIII - XIV სს.)',
    description: 'ჯალალ ედ-დინისა და მონღოლთა შემოსევები, ცოტნე დადიანი, გიორგი ბრწყინვალე',
    subprograms: [
      { id: 'sub-4-1', title: '4.1 მონღოლთა ბატონობა საქართველოში და დუმანებად დაყოფა' },
      { id: 'sub-4-2', title: '4.2 გიორგი V ბრწყინვალე — ქვეყნის გაერთიანება და რეფორმები' }
    ]
  },
  {
    id: 'ch-5',
    chapterNumber: 5,
    title: 'თავი 5: გვიანი შუა საუკუნეები — დაშლა და საგარეო აგრესია (XV - XVII სს.)',
    description: 'სამეფო-სამთავროებად დაშლა, ოსმალეთისა და ირანის აგრესია, გიორგი სააკაძე',
    subprograms: [
      { id: 'sub-5-1', title: '5.1 1490 წლის საქართველოს დაშლის ოფიციალური ცნობა' },
      { id: 'sub-5-2', title: '5.2 1625 წლის მარტყოფისა და მარაბდის ბრძოლები' }
    ]
  },
  {
    id: 'ch-6',
    chapterNumber: 6,
    title: 'თავი 6: XVIII საუკუნის საქართველო — ერეკლე II და ტრაქტატი',
    description: 'ქართლ-კახეთის გაერთიანება, ასპინძის ბრძოლა, 1783 წლის გეორგიევსკის ტრაქტატი',
    subprograms: [
      { id: 'sub-6-1', title: '6.1 ერეკლე II-ის შინაური რეფორმები და ასპინძის ომი' },
      { id: 'sub-6-2', title: '6.2 1783 წლის გეორგიევსკის ტრაქტატი და კრწანისის ომი' }
    ]
  },
  {
    id: 'ch-7',
    chapterNumber: 7,
    title: 'თავი 7: XIX საუკუნე — რუსული მმართველობა და ეროვნული გათავისუფლება',
    description: '1801 წლის ანექსია, 1832 წლის შეთქმულება, თერგდალეულები და ილია ჭავჭავაძე',
    subprograms: [
      { id: 'sub-7-1', title: '7.1 ქართლ-კახეთის ანექსია რუსეთის იმპერიის მიერ (1801 წ.)' },
      { id: 'sub-7-2', title: '7.2 ილია ჭავჭავაძე და თერგდალეულების ეროვნული მოძრაობა' }
    ]
  },
  {
    id: 'ch-8',
    chapterNumber: 8,
    title: 'თავი 8: საქართველოს პირველი დემოკრატიული რესპუბლიკა (1918-1921)',
    description: '1918 წლის 26 მაისის დამოუკიდებლობის გამოცხადება, კონსტიტუცია და საგარეო აღიარება',
    subprograms: [
      { id: 'sub-8-1', title: '8.1 1918 წლის 26 მაისი — დამოუკიდებლობის აქტი' },
      { id: 'sub-8-2', title: '8.2 1921 წლის კონსტიტუცია და დემოკრატიული ინსტიტუტები' }
    ]
  },
  {
    id: 'ch-9',
    chapterNumber: 9,
    title: 'თავი 9: საბჭოთა ოკუპაცია და XX საუკუნის ეროვნული მოძრაობები',
    description: '1921 წლის წითელი არმიის შემოჭრა, 1924 წლის ჯანყი, რეპრესიები და 1989 წლის 9 აპრილი',
    subprograms: [
      { id: 'sub-9-1', title: '9.1 1921 წლის მარო მაყაშვილი და კოჯორ-ტაბახმელას ომი' },
      { id: 'sub-9-2', title: '9.2 1989 წლის 9 აპრილი და ეროვნულ-განმათავისუფლებელი მოძრაობა' }
    ]
  },
  {
    id: 'ch-10',
    chapterNumber: 10,
    title: 'თავი 10: დამოუკიდებლობის აღდგენა და თანამედროვე საქართველო',
    description: '1991 წლის 9 აპრილის დამოუკიდებლობის აღდგენის აქტი, ზვიად გამსახურდია და თანამედროვეობა',
    subprograms: [
      { id: 'sub-10-1', title: '10.1 1991 წლის 9 აპრილი — დამოუკიდებლობის აღდგენა' }
    ]
  },
  {
    id: 'ch-11',
    chapterNumber: 11,
    title: 'თავი 11: მსოფლიო ისტორიის გარდამტეხი მოვლენები',
    description: 'ანტიკური საბერძნეთი, რომის იმპერია, დიდი გეოგრაფიული აღმოჩენები და II მსოფლიო ომი',
    subprograms: [
      { id: 'sub-11-1', title: '11.1 ანტიკური საბერძნეთი და რომის რესპუბლიკა' },
      { id: 'sub-11-2', title: '11.2 XX საუკუნის მსოფლიო ომები და გეოპოლიტიკა' }
    ]
  }
];

// Rich Questions Dataset
export const FALLBACK_QUESTIONS: Record<string, (QuizQuestion & { chapterId: string })[]> = {
  mcq: [
    {
      id: 'mcq-1-1',
      chapterId: 'ch-1',
      prompt: 'რომელ საუკუნეში გაერთიანდა ქართლის სამეფო ფარნავაზ I-ის მეთაურობით?',
      options: ['ძვ.წ. V საუკუნეში', 'ძვ.წ. III საუკუნეში', 'ახ.წ. I საუკუნეში', 'ძვ.წ. VIII საუკუნეში'],
      correctAnswerIndex: 1,
      explanation: 'ფარნავაზ I-მა ძვ.წ. III საუკუნეში გააერთიანა ქართლი, დაყო იგი საერისთავოებად და დააწესა სახელმწიფო ენა.'
    },
    {
      id: 'mcq-1-2',
      chapterId: 'ch-1',
      prompt: 'ვისი ქადაგებით გამოცხადდა ქრისტიანობა სახელმწიფო რელიგიად ქართლში 326 წელს?',
      options: ['წმინდა გიორგის', 'წმინდა ნინოს', 'წმინდა აბო თბილელის', 'წმინდა შუშანიკის'],
      correctAnswerIndex: 1,
      explanation: 'წმინდა ნინოს ქადაგებით მეფე მირიანმა და დედოფალმა ნანამ ქრისტიანობა სახელმწიფო რელიგიად გამოაცხადეს.'
    },
    {
      id: 'mcq-2-1',
      chapterId: 'ch-3',
      prompt: 'რომელ წელს მოხდა დიდგორის ბრძოლა, რომელიც ცნობილია როგორც „ძლევაჲ საკვირველი“?',
      options: ['1089 წელს', '1121 წლის 12 აგვისტოს', '1122 წელს', '1184 წელს'],
      correctAnswerIndex: 1,
      explanation: '1121 წლის 12 აგვისტოს დავით IV აღმაშენებელმა სასტიკად დაამარცხა თურქ-სელჩუკთა 300 000-იანი არმია.'
    },
    {
      id: 'mcq-3-1',
      chapterId: 'ch-6',
      prompt: 'რომელ წელს დაიდო გეორგიევსკის ტრაქტატი ქართლ-კახეთსა და რუსეთის იმპერიას შორის?',
      options: ['1769 წელს', '1783 წელს', '1795 წელს', '1801 წელს'],
      correctAnswerIndex: 1,
      explanation: '1783 წელს ერეკლე II-მ და ეკატერინე II-ის წარმომადგენლებმა მოაწერეს ხელი გეორგიევსკის ტრაქტატს.'
    },
    {
      id: 'mcq-4-1',
      chapterId: 'ch-8',
      prompt: 'როდის გამოცხადდა საქართველოს დემოკრატიული რესპუბლიკის დამოუკიდებლობა?',
      options: ['1917 წლის 7 ნოემბერს', '1918 წლის 26 მაისს', '1921 წლის 25 თებერვალს', '1991 წლის 9 აპრილს'],
      correctAnswerIndex: 1,
      explanation: '1918 წლის 26 მაისს ეროვნულმა საბჭომ ნოე ჟორდანიას მეთაურობით გამოაცხადა საქართველოს დამოუკიდებლობა.'
    }
  ],

  map: [
    {
      id: 'map-1-1',
      chapterId: 'ch-3',
      mapImage: 'https://vqkpacwswksgvhuczrbw.supabase.co/storage/v1/object/public/photos/map1.png',
      prompt: 'რუკაზე ასახული სამხედრო მარშრუტით, რომელ ბრძოლას მიესადაგება დიდგორის ხეობის ჩაკეტვა?',
      options: ['1121 წლის დიდგორის ბრძოლას', '1202 წლის ბასიანის ბრძოლას', '1195 წლის შამქორის ბრძოლას', '1300 წლის მონღოლთა შემოსევას'],
      correctAnswerIndex: 0,
      explanation: 'დიდგორის ვიწრო ხეობაში დავით IV-ემ ტაქტიკურად ჩაკეტა მტრის 300 000-იანი კოალიცია.'
    },
    {
      id: 'map-1-2',
      chapterId: 'ch-1',
      mapImage: 'https://vqkpacwswksgvhuczrbw.supabase.co/storage/v1/object/public/photos/map2.png',
      prompt: 'რუკაზე აღნიშნული საზღვრებით, რომელი სამეფო ჩამოყალიბდა დასავლეთ საქართველოში ძვ.წ. VI საუკუნეში?',
      options: ['იბერიის სამეფო', 'კოლხეთის სამეფო', 'ეგრისის სამეფო', 'თრიალეთის კულტურა'],
      correctAnswerIndex: 1,
      explanation: 'ძვ.წ. VI საუკუნეში შავი ზღვის აღმოსავლეთ სანაპიროზე ჩამოყალიბდა ეკონომიკურად ძლიერი კოლხეთის სამეფო.'
    }
  ],

  analogies: [
    {
      id: 'an-1-1',
      chapterId: 'ch-3',
      prompt: 'დავით IV აღმაშენებელი : დიდგორი = ერეკლე II : ?',
      options: ['მარაბდა', 'კრწანისი', 'ასპინძა', 'ბასიანი'],
      correctAnswerIndex: 2,
      explanation: 'დავით აღმაშენებლის უდიდესი გამარჯვება იყო დიდგორი (1121), ხოლო ერეკლე II-ის — ასპინძა (1770).'
    },
    {
      id: 'an-1-2',
      chapterId: 'ch-1',
      prompt: 'ფარნავაზ I : ქართლის გაერთიანება = ბაგრატ III : ?',
      options: ['ქრისტიანობის მიღება', 'ერთიანი ფეოდალური საქართველოს შექმნა (1008 წ.)', 'თბილისის გათავისუფლება', 'ანბანის შექმნა'],
      correctAnswerIndex: 1,
      explanation: 'ფარნავაზმა პირველად გააერთიანა ქართლი, ხოლო ბაგრატ III-მ 1008 წელს შექმნა ერთიანი ფეოდალური საქართველო.'
    }
  ],

  source: [
    {
      id: 'src-1-1',
      chapterId: 'ch-3',
      sourceContext: '„ამას დღესა შინა ჴელითა მაღლითა და მკლავითა დაპყრობილითა აცხოვნა უფალმან ერი თჳსი, და მოსცა ძლევაჲ საკვირველი...“',
      prompt: 'რომელ ისტორიულ მოვლენას აღწერს მოყვანილი პირველწყარო?',
      options: ['1121 წლის დიდგორის ბრძოლას', '326 წლის ქრისტიანობის მიღებას', '1202 წლის ბასიანის ომს', '1783 წლის ტრაქტატს'],
      correctAnswerIndex: 0,
      explanation: '„ცხოვრება მეფეთ-მეფისა დავითისი“ დიდგორის ომს მოიხსენიებს როგორც „ძლევაჲ საკვირველი“.'
    },
    {
      id: 'src-1-2',
      chapterId: 'ch-6',
      sourceContext: '„საქართველოს მეფე უარს ამბობს ყოველგვარ დამოკიდებულებაზე ირანთან ან სხვა სახელმწიფოსთან და ცნობს მხოლოდ რუსეთის მფარველობას...“',
      prompt: 'რომელი დიპლომატიური დოკუმენტის პირველი მუხლია ციტირებული ტექსტში?',
      options: ['გეორგიევსკის ტრაქტატის (1783 წ.)', 'ამასიის ზავის (1555 წ.)', 'სტამბოლის ხელშეკრულების', 'პარიზის მშვიდობის'],
      correctAnswerIndex: 0,
      explanation: 'ეს არის 1783 წლის გეორგიევსკის ტრაქტატის I მუხლის შინაარსი.'
    }
  ],

  chronology: [
    {
      id: 'chr-1-1',
      chapterId: 'independent',
      prompt: 'დაალაგეთ ქრონოლოგიურად: 1. დიდგორის ბრძოლა, 2. ქრისტიანობის მიღება ქართლში, 3. გეორგიევსკის ტრაქტატი',
      options: ['2, 1, 3', '1, 2, 3', '3, 2, 1', '2, 3, 1'],
      correctAnswerIndex: 0,
      explanation: 'ქრისტიანობის მიღება (326 წ.) -> დიდგორის ბრძოლა (1121 წ.) -> გეორგიევსკის ტრაქტატი (1783 წ.).'
    },
    {
      id: 'chr-1-2',
      chapterId: 'independent',
      prompt: 'დაალაგეთ ქრონოლოგიურად: 1. საქართველოს დამოუკიდებლობის გამოცხადება, 2. ილია ჭავჭავაძის მკვლელობა, 3. წითელი არმიის შემოჭრა',
      options: ['2, 1, 3', '1, 2, 3', '3, 1, 2', '2, 3, 1'],
      correctAnswerIndex: 0,
      explanation: 'ილია ჭავჭავაძის მკვლელობა (1907 წ.) -> დამოუკიდებლობა (1918 წ.) -> წითელი არმიის ოკუპაცია (1921 წ.).'
    }
  ],

  illustrations: [
    {
      id: 'ill-1-1',
      chapterId: 'ch-1',
      mapImage: 'https://vqkpacwswksgvhuczrbw.supabase.co/storage/v1/object/public/photos/poto.png',
      prompt: 'რომელი ეპოქის არტეფაქტია ვანის არქეოლოგიურ გათხრებში აღმოჩენილი კოლხური ოქროს სამკაულები?',
      options: ['ანტიკური ხანა (ძვ.წ. V-IV სს.)', 'შუა საუკუნეები', 'ბრინჯაოს ხანა', 'ახალი დრო'],
      correctAnswerIndex: 0,
      explanation: 'ვანის ოქრომრავალი არტეფაქტები მიეკუთვნება ანტიკური კოლხეთის აყვავების ხანას.'
    }
  ]
};

/**
 * Fetch Program Chapters from history_exam schema or public or fallback
 */
export const fetchProgramsAndSubprograms = async (): Promise<ProgramChapter[]> => {
  try {
    // 1. Try history_exam.exam_programs
    let { data: progData, error: progError } = await supabase
      .schema('history_exam')
      .from('exam_programs')
      .select('*')
      .order('chapter_number', { ascending: true });

    // 2. Fallback to public.exam_programs or public.program
    if (progError || !progData || progData.length === 0) {
      const res = await supabase.from('exam_programs').select('*').order('chapter_number', { ascending: true });
      progData = res.data;
      progError = res.error;
    }

    if (!progError && progData && progData.length > 0) {
      // Fetch subprograms
      let subData: any[] = [];
      try {
        const { data: sData1 } = await supabase.schema('history_exam').from('exam_subprograms').select('*');
        subData = sData1 || [];
      } catch (e) {
        const { data: sData2 } = await supabase.from('exam_subprograms').select('*');
        subData = sData2 || [];
      }

      return progData.map((p: any) => ({
        id: p.id || `ch-${p.chapter_number || p.id}`,
        chapterNumber: p.chapter_number || p.order || 1,
        title: p.title || `თავი ${p.chapter_number || 1}`,
        description: p.description || '',
        subprograms: subData
          .filter((s: any) => s.program_id === p.id || s.chapter_id === p.id)
          .map((s: any) => ({
            id: s.id,
            title: s.title || s.name || ''
          }))
      }));
    }
  } catch (err) {
    console.warn('Supabase fetch programs notice:', err);
  }

  return FALLBACK_PROGRAMS;
};

/**
 * Fetch Total Question Count for a Category
 */
export const fetchCategoryQuestionsCount = async (categoryKey: string): Promise<number> => {
  const catMeta = TEST_CATEGORIES.find(c => c.key === categoryKey);
  const tableName = catMeta?.tableName || categoryKey;

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
  } catch (err) {
    console.warn(`Count query notice for ${tableName}:`, err);
  }

  const fallbacks = FALLBACK_QUESTIONS[categoryKey] || [];
  return fallbacks.length;
};

/**
 * Fetch Test Questions for a given category from Supabase (history_exam & public schemas)
 */
export const fetchQuestionsForCategory = async (categoryKey: string): Promise<(QuizQuestion & { chapterId: string })[]> => {
  const catMeta = TEST_CATEGORIES.find(c => c.key === categoryKey);
  const tableName = catMeta?.tableName || categoryKey;

  try {
    let rawQuestions: any[] = [];

    // Query questions table
    const { data: hQuestions, error: hErr } = await supabase
      .schema('history_exam')
      .from(tableName)
      .select('*');

    if (!hErr && hQuestions && hQuestions.length > 0) {
      rawQuestions = hQuestions;
    } else {
      const { data: pQuestions, error: pErr } = await supabase.from(tableName).select('*');
      if (!pErr && pQuestions) rawQuestions = pQuestions;
    }

    if (rawQuestions.length > 0) {
      // Handle joined table data (e.g. maps, sources, illustrations)
      let mapsMap: Record<string, string> = {};
      let sourcesMap: Record<string, string> = {};

      if (categoryKey === 'map') {
        try {
          const { data: mapsData } = await supabase.schema('history_exam').from('maps').select('*');
          (mapsData || []).forEach((m: any) => {
            mapsMap[m.id] = m.map_url || m.image_url || m.url;
          });
        } catch (e) {
          const { data: mapsData } = await supabase.from('maps').select('*');
          (mapsData || []).forEach((m: any) => {
            mapsMap[m.id] = m.map_url || m.image_url || m.url;
          });
        }
      }

      if (categoryKey === 'source') {
        try {
          const { data: sourcesData } = await supabase.schema('history_exam').from('sources').select('*');
          (sourcesData || []).forEach((s: any) => {
            sourcesMap[s.id] = s.text || s.content || s.title;
          });
        } catch (e) {
          const { data: sourcesData } = await supabase.from('sources').select('*');
          (sourcesData || []).forEach((s: any) => {
            sourcesMap[s.id] = s.text || s.content || s.title;
          });
        }
      }

      return rawQuestions.map((item: any, idx: number) => ({
        id: item.id || `${categoryKey}-${idx}`,
        chapterId: item.chapter_id || item.program_id || item.chapterId || `ch-${(idx % 11) + 1}`,
        prompt: item.prompt || item.question || item.title || 'კითხვა',
        options: Array.isArray(item.options) 
          ? item.options 
          : typeof item.options === 'string' 
            ? JSON.parse(item.options) 
            : [item.option_a || 'ა', item.option_b || 'ბ', item.option_c || 'გ', item.option_d || 'დ'],
        correctAnswerIndex: typeof item.correct_answer_index === 'number' 
          ? item.correct_answer_index 
          : typeof item.correct_option === 'number' ? item.correct_option : 0,
        explanation: item.explanation || item.description || 'განმარტება',
        sourceContext: item.source_context || item.sourceContext || (item.source_id ? sourcesMap[item.source_id] : undefined),
        mapImage: item.map_image || item.map_url || item.image_url || (item.map_id ? mapsMap[item.map_id] : undefined)
      }));
    }
  } catch (err) {
    console.warn(`Supabase fetch notice for "${tableName}":`, err);
  }

  return FALLBACK_QUESTIONS[categoryKey] || FALLBACK_QUESTIONS.mcq;
};

/**
 * Build a full HistoryTest object for a category & selected chapter
 */
export const buildHistoryTest = async (
  categoryKey: string, 
  chapterId?: string
): Promise<HistoryTest> => {
  const catMeta = TEST_CATEGORIES.find(c => c.key === categoryKey) || TEST_CATEGORIES[0];
  const allQuestions = await fetchQuestionsForCategory(categoryKey);

  let filteredQuestions = allQuestions;
  if (chapterId && chapterId !== 'all') {
    filteredQuestions = allQuestions.filter(q => q.chapterId === chapterId);
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
