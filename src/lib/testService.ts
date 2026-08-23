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
}

export const TEST_CATEGORIES: TestCategoryMeta[] = [
  {
    key: 'mcq',
    tableName: 'არჩევითპასუხიანი',
    title: 'არჩევითპასუხიანი კითხვები (N1-35)',
    subtitle: 'ეროვნული გამოცდების პირველი ნაწილი: 35 არჩევითპასუხიანი კითხვა',
    timeLimitMinutes: 45,
    badge: 'N1-35'
  },
  {
    key: 'map',
    tableName: 'რუკა',
    title: 'ისტორიული რუკა (N36)',
    subtitle: 'კარტოგრაფიული დავალება, საზღვრებისა და მარშრუტების ანალიზი',
    timeLimitMinutes: 20,
    badge: 'N36'
  },
  {
    key: 'analogies',
    tableName: 'ანალოგიები',
    title: 'ანალოგიები (N37)',
    subtitle: 'ისტორიული მოვლენების მიზეზ-შედეგობრივი შედარება და წყვილები',
    timeLimitMinutes: 15,
    badge: 'N37'
  },
  {
    key: 'source',
    tableName: 'წყარო',
    title: 'ისტორიული წყარო (N38)',
    subtitle: 'პირველწყაროს ტექსტუალური ანალიზი და კრიტიკული შეფასება',
    timeLimitMinutes: 30,
    badge: 'N38'
  },
  {
    key: 'chronology',
    tableName: 'ქრონოლოგია',
    title: 'ქრონოლოგია',
    subtitle: 'ისტორიული თარიღებისა და მოვლენების თანმიმდევრობით დალაგება',
    timeLimitMinutes: 20,
    badge: 'სხვა'
  },
  {
    key: 'illustrations',
    tableName: 'ილუსტრაციები',
    title: 'ილუსტრაციები',
    subtitle: 'ვიზუალური წყაროების, არტეფაქტებისა და ფოტოების ანალიზი',
    timeLimitMinutes: 20,
    badge: 'სხვა'
  }
];

// Fallback Program Chapters (1-5)
export const FALLBACK_PROGRAMS: ProgramChapter[] = [
  {
    id: 'ch-1',
    chapterNumber: 1,
    title: 'თავი 1: ანტიკური ხანის საქართველო — კოლხეთი და იბერია',
    description: 'ფარნავაზ I-ის რეფორმები, ქართლის გაერთიანება და ქრისტიანობის მიღება (ძვ.წ. VI - ახ.წ. IV სს.)',
    subprograms: [
      { id: 'sub-1-1', title: '1.1 კოლხეთისა და იბერიის სამეფოების წარმოშობა' },
      { id: 'sub-1-2', title: '1.2 ფარნავაზ I-ის სახელმწიფოებრივი და რელიგიური რეფორმები' },
      { id: 'sub-1-3', title: '1.3 ქრისტიანობის სახელმწიფო რელიგიად გამოცხადება' }
    ]
  },
  {
    id: 'ch-2',
    chapterNumber: 2,
    title: 'თავი 2: საქართველოს ოქროს ხანა (XI - XIII სს.)',
    description: 'დავით IV აღმაშენებლის რეფორმები, დიდგორის ბრძოლა და თამარ მეფის ეპოქა',
    subprograms: [
      { id: 'sub-2-1', title: '2.1 ბაგრატ III და საქართველოს გაერთიანების დასაწყისი' },
      { id: 'sub-2-2', title: '2.2 დავით IV აღმაშენებელი და 1121 წლის დიდგორის ომი' },
      { id: 'sub-2-3', title: '2.3 თამარ მეფის ეპოქის პოლიტიკური და კულტურული ზენიტი' }
    ]
  },
  {
    id: 'ch-3',
    chapterNumber: 3,
    title: 'თავი 3: გვიანი შუა საუკუნეები — ბრძოლა დამოუკიდებლობისთვის (XV - XVIII სს.)',
    description: 'სამეფო-სამთავროებად დაშლა, მარტყოფ-მარაბდა, ერეკლე II და გეორგიევსკის ტრაქტატი',
    subprograms: [
      { id: 'sub-3-1', title: '3.1 საქართველოს დაშლა ქართლის, კახეთისა და იმერეთის სამეფოებად' },
      { id: 'sub-3-2', title: '3.2 1625 წლის ჯანყი და გიორგი სააკაძე' },
      { id: 'sub-3-3', title: '3.3 ერეკლე II-ის საგარეო პოლიტიკა და 1783 წლის ტრაქტატი' }
    ]
  },
  {
    id: 'ch-4',
    chapterNumber: 4,
    title: 'თავი 4: XIX-XX საუკუნეების ეროვნულ-განმათავისუფლებელი მოძრაობა',
    description: 'თერგდალეულები, ილია ჭავჭავაძე, 1918 წლის 26 მაისი და პირველი რესპუბლიკა',
    subprograms: [
      { id: 'sub-4-1', title: '4.1 ილია ჭავჭავაძე და თერგდალეულების მოძრაობა' },
      { id: 'sub-4-2', title: '4.2 1918 წლის 26 მაისი — დამოუკიდებლობის გამოცხადება' },
      { id: 'sub-4-3', title: '4.3 1921 წლის საბჭოთა ოკუპაცია და მარო მაყაშვილის გმირობა' }
    ]
  },
  {
    id: 'ch-5',
    chapterNumber: 5,
    title: 'თავი 5: მსოფლიო ისტორიის გარდამტეხი ეტაპები',
    description: 'ძველი საბერძნეთი, რომის იმპერია, ჯვაროსნული ლაშქრობები და II მსოფლიო ომი',
    subprograms: [
      { id: 'sub-5-1', title: '5.1 ანტიკური საბერძნეთი და რომის რესპუბლიკა' },
      { id: 'sub-5-2', title: '5.2 შუა საუკუნეების ევროპა და ჯვაროსნული ომები' },
      { id: 'sub-5-3', title: '5.3 XX საუკუნის გლობალური კონფლიქტები' }
    ]
  }
];

// Rich Fallback Questions grouped by Category and Chapter
export const FALLBACK_QUESTIONS: Record<string, (QuizQuestion & { chapterId: string })[]> = {
  mcq: [
    // Chapter 1
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
      id: 'mcq-1-3',
      chapterId: 'ch-1',
      prompt: 'რომელმა მეფემ გადაიტანა ქართლის დედაქალაქი მცხეთიდან თბილისში?',
      options: ['ფარნავაზ I-მა', 'მირიან III-მ', 'ვახტანგ გორგასალმა', 'დაჩი გორგასლის ძემ'],
      correctAnswerIndex: 2,
      explanation: 'ვახტანგ გორგასალმა დაიწყო თბილისის მშენებლობა, ხოლო დედაქალაქის გადატანა მისმა ძემ, დაჩიმ დაასრულა.'
    },

    // Chapter 2
    {
      id: 'mcq-2-1',
      chapterId: 'ch-2',
      prompt: 'რომელ წელს მოხდა დიდგორის ბრძოლა, რომელიც ცნობილია როგორც „ძლევაჲ საკვირველი“?',
      options: ['1089 წელს', '1121 წლის 12 აგვისტოს', '1122 წელს', '1184 წელს'],
      correctAnswerIndex: 1,
      explanation: '1121 წლის 12 აგვისტოს დავით IV აღმაშენებელმა სასტიკად დაამარცხა თურქ-სელჩუკთა 300 000-იანი არმია.'
    },
    {
      id: 'mcq-2-2',
      chapterId: 'ch-2',
      prompt: 'რომელი საგანმანათლებლო ცენტრი დააარსა დავით IV აღმაშენებელმა 1106 წელს?',
      options: ['იყალთოს აკადემია', 'გელათის აკადემია', 'გრემის სემინარია', 'სვეტიცხოვლის სკოლა'],
      correctAnswerIndex: 1,
      explanation: 'გელათის აკადემია გახდა „სხვა ათინა და მეორე იერუსალიმი“ და XII საუკუნის უმნიშვნელოვანესი კულტურული ცენტრი.'
    },
    {
      id: 'mcq-2-3',
      chapterId: 'ch-2',
      prompt: 'ვინ ხელმძღვანელობდა საქართველოს ოქროს ხანის ზენიტში (1184-1213 წწ.)?',
      options: ['დავით IV აღმაშენებელი', 'დემეტრე I', 'თამარ მეფე', 'გიორგი III'],
      correctAnswerIndex: 2,
      explanation: 'თამარ მეფის ეპოქაში საქართველომ მიაღწია პოლიტიკურ, სამხედრო და კულტურულ მწვერვალს.'
    },

    // Chapter 3
    {
      id: 'mcq-3-1',
      chapterId: 'ch-3',
      prompt: 'რომელ წელს დაიდო გეორგიევსკის ტრაქტატი ქართლ-კახეთსა და რუსეთის იმპერიას შორის?',
      options: ['1769 წელს', '1783 წელს', '1795 წელს', '1801 წელს'],
      correctAnswerIndex: 1,
      explanation: '1783 წელს ერეკლე II-მ და ეკატერინე II-ის წარმომადგენლებმა მოაწერეს ხელი გეორგიევსკის ტრაქტატს.'
    },
    {
      id: 'mcq-3-2',
      chapterId: 'ch-3',
      prompt: 'რომელი ბრძოლა მოხდა 1625 წელს გიორგი სააკაძის მეთაურობით ირანელთა წინააღმდეგ?',
      options: ['ასპინძის ბრძოლა', 'მარტყოფის ბრძოლა', 'კრწანისის ბრძოლა', 'ხრესილის ბრძოლა'],
      correctAnswerIndex: 1,
      explanation: '1625 წლის 25 მარტს მარტყოფის ველზე ქართველებმა მოულოდნელი იერიშით გაანადგურეს ირანელთა ჯარი.'
    },

    // Chapter 4
    {
      id: 'mcq-4-1',
      chapterId: 'ch-4',
      prompt: 'როდის გამოცხადდა საქართველოს დემოკრატიული რესპუბლიკის დამოუკიდებლობა?',
      options: ['1917 წლის 7 ნოემბერს', '1918 წლის 26 მაისს', '1921 წლის 25 თებერვალს', '1991 წლის 9 აპრილს'],
      correctAnswerIndex: 1,
      explanation: '1918 წლის 26 მაისს ეროვნულმა საბჭომ ნოე ჟორდანიას მეთაურობით გამოაცხადა საქართველოს დამოუკიდებლობა.'
    },
    {
      id: 'mcq-4-2',
      chapterId: 'ch-4',
      prompt: 'ვინ იდგა თერგდალეულთა ეროვნულ-განმათავისუფლებელი მოძრაობის სათავეში XIX საუკუნეში?',
      options: ['აკაკი წერეთელი', 'ილია ჭავჭავაძე', 'ვაჟა-ფშაველა', 'ნიკო ნიკოლაძე'],
      correctAnswerIndex: 1,
      explanation: 'ილია ჭავჭავაძე იყო თერგდალეულთა სულიერი წინამძღოლი და „მამული, ენა, სარწმუნოების“ იდეის ავტორი.'
    },

    // Chapter 5
    {
      id: 'mcq-5-1',
      chapterId: 'ch-5',
      prompt: 'რომელ ბრძოლაში დამარცხდა ნაპოლეონ ბონაპარტი საბოლოოდ 1815 წელს?',
      options: ['აუსტერლიცის ბრძოლაში', 'ვატერლოოს ბრძოლაში', 'ბოროდინოს ბრძოლაში', 'ლაიფციგის ბრძოლაში'],
      correctAnswerIndex: 1,
      explanation: '1815 წლის ვატერლოოს ბრძოლამ საბოლოოდ წერტილი დაუსვა ნაპოლეონის მმართველობას.'
    }
  ],

  map: [
    {
      id: 'map-1-1',
      chapterId: 'ch-2',
      prompt: 'რუკაზე ასახული სამხედრო მარშრუტით, რომელ ბრძოლას მიესადაგება დიდგორის ხეობის ჩაკეტვა?',
      options: ['1121 წლის დიდგორის ბრძოლას', '1202 წლის ბასიანის ბრძოლას', '1195 წლის შამქორის ბრძოლას', '1300 წლის მონღოლთა შემოსევას'],
      correctAnswerIndex: 0,
      explanation: 'დიდგორის ვიწრო ხეობაში დავით IV-ემ ტაქტიკურად ჩაკეტა მტრის 300 000-იანი კოალიცია.'
    },
    {
      id: 'map-1-2',
      chapterId: 'ch-1',
      prompt: 'რუკაზე აღნიშნული საზღვრებით, რომელი სამეფო ჩამოყალიბდა დასავლეთ საქართველოში ძვ.წ. VI საუკუნეში?',
      options: ['იბერიის სამეფო', 'კოლხეთის სამეფო', 'ეგრისის სამეფო', 'თრიალეთის კულტურა'],
      correctAnswerIndex: 1,
      explanation: 'ძვ.წ. VI საუკუნეში შავი ზღვის აღმოსავლეთ სანაპიროზე ჩამოყალიბდა ეკონომიკურად ძლიერი კოლხეთის სამეფო.'
    },
    {
      id: 'map-1-3',
      chapterId: 'ch-3',
      prompt: 'რუკაზე გამოსახული ირანისა და ოსმალეთის გავლენის სფეროებით, რომელი ხელშეკრულებით დაინაწილეს საქართველო 1555 წელს?',
      options: ['ამასიის ზავით', 'სტამბოლის ზავით', 'გასრ-ი-შირინის ზავით', 'რიზის ზავით'],
      correctAnswerIndex: 0,
      explanation: '1555 წლის ამასიის ზავით ირანმა და ოსმალეთმა საქართველო ორ გავლენის ზონად გაინაწილეს.'
    }
  ],

  analogies: [
    {
      id: 'an-1-1',
      chapterId: 'ch-2',
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
    },
    {
      id: 'an-1-3',
      chapterId: 'ch-4',
      prompt: 'ილია ჭავჭავაძე : „ივერია“ = ნოე ჟორდანია : ?',
      options: ['საქართველოს პირველი რესპუბლიკის მთავრობა', 'თერგდალეულთა კავშირი', 'ქართველთა შორის წერა-კითხვის გამავრცელებელი საზოგადოება', 'მშვიდობის საბჭო'],
      correctAnswerIndex: 0,
      explanation: 'ილია ჭავჭავაძე ხელმძღვანელობდა გაზეთ „ივერიას“, ხოლო ნოე ჟორდანია — 1918-1921 წლების რესპუბლიკის მთავრობას.'
    }
  ],

  source: [
    {
      id: 'src-1-1',
      chapterId: 'ch-2',
      sourceContext: '„ამას დღესა შინა ჴელითა მაღლითა და მკლავითა დაპყრობილითა აცხოვნა უფალმან ერი თჳსი, და მოსცა ძლევაჲ საკვირველი...“',
      prompt: 'რომელ ისტორიულ მოვლენას აღწერს მოყვანილი პირველწყარო?',
      options: ['1121 წლის დიდგორის ბრძოლას', '326 წლის ქრისტიანობის მიღებას', '1202 წლის ბასიანის ომს', '1783 წლის ტრაქტატს'],
      correctAnswerIndex: 0,
      explanation: '„ცხოვრება მეფეთ-მეფისა დავითისი“ დიდგორის ომს მოიხსენიებს როგორც „ძლევაჲ საკვირველი“.'
    },
    {
      id: 'src-1-2',
      chapterId: 'ch-3',
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
      chapterId: 'ch-1',
      prompt: 'დაალაგეთ ქრონოლოგიურად: 1. დიდგორის ბრძოლა, 2. ქრისტიანობის მიღება ქართლში, 3. გეორგიევსკის ტრაქტატი',
      options: ['2, 1, 3', '1, 2, 3', '3, 2, 1', '2, 3, 1'],
      correctAnswerIndex: 0,
      explanation: 'ქრისტიანობის მიღება (326 წ.) -> დიდგორის ბრძოლა (1121 წ.) -> გეორგიევსკის ტრაქტატი (1783 წ.).'
    },
    {
      id: 'chr-1-2',
      chapterId: 'ch-4',
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
      prompt: 'რომელი ეპოქის არტეფაქტია ვანის არქეოლოგიურ გათხრებში აღმოჩენილი კოლხური ოქროს სამკაულები?',
      options: ['ანტიკური ხანა (ძვ.წ. V-IV სს.)', 'შუა საუკუნეები', 'ბრინჯაოს ხანა', 'ახალი დრო'],
      correctAnswerIndex: 0,
      explanation: 'ვანის ოქრომრავალი არტეფაქტები მიეკუთვნება ანტიკური კოლხეთის აყვავების ხანას.'
    },
    {
      id: 'ill-1-2',
      chapterId: 'ch-2',
      prompt: 'რომელ ტაძარშია შემონახული დავით IV აღმაშენებლისა და თამარ მეფის ცნობილი ფრესკები?',
      options: ['გელათის მონასტერში და ვარძიაში', 'სვეტიცხოველში', 'ალავერდში', 'ბაგრატის ტაძარში'],
      correctAnswerIndex: 0,
      explanation: 'გელათში გამოსახულია დავით აღმაშენებელი ეკლესიის მოდელით ხელში, ხოლო ვარძიასა და ბეთანიაში — თამარ მეფე.'
    }
  ]
};

/**
 * Fetch Program Chapters from Supabase or Fallback
 */
export const fetchProgramsAndSubprograms = async (): Promise<ProgramChapter[]> => {
  try {
    const { data: progData, error: progError } = await supabase
      .from('program')
      .select('*')
      .order('chapter_number', { ascending: true });

    if (!progError && progData && progData.length > 0) {
      const { data: subData } = await supabase.from('subprogram').select('*');

      return progData.map((p: any) => ({
        id: p.id || `ch-${p.chapter_number || p.id}`,
        chapterNumber: p.chapter_number || p.order || 1,
        title: p.title || `თავი ${p.chapter_number || 1}`,
        description: p.description || '',
        subprograms: (subData || [])
          .filter((s: any) => s.program_id === p.id || s.chapter_id === p.id)
          .map((s: any) => ({
            id: s.id,
            title: s.title || s.name || ''
          }))
      }));
    }
  } catch (err) {
    console.warn('Supabase fetch programs notice (using fallback programs):', err);
  }

  return FALLBACK_PROGRAMS;
};

/**
 * Fetch Test Questions for a given category from Supabase or Fallback
 */
export const fetchQuestionsForCategory = async (categoryKey: string): Promise<(QuizQuestion & { chapterId: string })[]> => {
  const catMeta = TEST_CATEGORIES.find(c => c.key === categoryKey);
  const tableName = catMeta?.tableName || categoryKey;

  try {
    const { data, error } = await supabase.from(tableName).select('*');

    if (!error && data && data.length > 0) {
      return data.map((item: any, idx: number) => ({
        id: item.id || `${categoryKey}-${idx}`,
        chapterId: item.chapter_id || item.chapterId || `ch-${(idx % 5) + 1}`,
        prompt: item.prompt || item.question || item.title || 'კითხვა',
        options: Array.isArray(item.options) 
          ? item.options 
          : typeof item.options === 'string' 
            ? JSON.parse(item.options) 
            : [item.option_a || 'ა', item.option_b || 'ბ', item.option_c || 'გ', item.option_d || 'დ'],
        correctAnswerIndex: typeof item.correct_answer_index === 'number' 
          ? item.correct_answer_index 
          : item.correct_option || 0,
        explanation: item.explanation || item.description || 'განმარტება',
        sourceContext: item.source_context || item.sourceContext,
        mapImage: item.map_image || item.mapImage
      }));
    }
  } catch (err) {
    console.warn(`Supabase fetch notice for "${tableName}" (using fallback questions):`, err);
  }

  return FALLBACK_QUESTIONS[categoryKey] || FALLBACK_QUESTIONS.mcq;
};

/**
 * Build a full HistoryTest object for a category & selected chapter (or all chapters)
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
    timeLimitMinutes: catMeta.timeLimitMinutes,
    questionCount: shuffled.length,
    description: selectedChapter ? selectedChapter.description : catMeta.subtitle,
    questions: shuffled
  };
};
