import { supabase } from './supabase';
import { QuizItem, QuizQuestionItem, QuizAnswerItem, QuizAttempt, QuizLeaderboardItem, QuizResultFeedback } from '../types';

export const FALLBACK_QUIZZES: QuizItem[] = [
  {
    id: 'quiz-diauehi-kolkha',
    title: 'დიაოხი და კოლხა',
    description: 'ბრინჯაოს ხანის კოლაფსი, მუშქები, ხალიბები, დიაოხის სამეფო და კოლხას გაერთიანება',
    status: 'published',
    is_active: true,
    question_count: 20
  }
];

export const FALLBACK_QUESTIONS: Record<string, QuizQuestionItem[]> = {
  'quiz-diauehi-kolkha': [
    {
      id: 'q-dk-1',
      quiz_id: 'quiz-diauehi-kolkha',
      question_text: '1. რომელ საუკუნეში დაიწყო „ბრინჯაოს ხანის კოლაფსი“, რამაც გამოიწვია მოსახლეობის უკონტროლო მიგრაცია და ხეთების იმპერიის განადგურება?',
      question_order: 1,
      answers: [
        { id: 'a1-1', answer_text: 'ძვ.წ. XIII-XII საუკუნეებში', is_correct: true, answer_order: 1 },
        { id: 'a1-2', answer_text: 'ძვ.წ. XV საუკუნეში', is_correct: false, answer_order: 2 },
        { id: 'a1-3', answer_text: 'ძვ.წ. IX საუკუნეში', is_correct: false, answer_order: 3 },
        { id: 'a1-4', answer_text: 'ძვ.წ. VI საუკუნეში', is_correct: false, answer_order: 4 }
      ]
    },
    {
      id: 'q-dk-2',
      quiz_id: 'quiz-diauehi-kolkha',
      question_text: '2. ბრონჯაოს ხანის კოლაფსის შემდეგ (დაახლ. ძვ.წ. 1200 წ.), რომელი ჯგუფი მოგვევლინა მესხური ქართველური ტომების პირდაპირ წინაპრებად?',
      question_order: 2,
      answers: [
        { id: 'a2-1', answer_text: 'ხალიბები', is_correct: false, answer_order: 1 },
        { id: 'a2-2', answer_text: 'ქაშქები', is_correct: false, answer_order: 2 },
        { id: 'a2-3', answer_text: 'მუშქები', is_correct: true, answer_order: 3 },
        { id: 'a2-4', answer_text: 'კიმერიელები', is_correct: false, answer_order: 4 }
      ]
    },
    {
      id: 'q-dk-3',
      quiz_id: 'quiz-diauehi-kolkha',
      question_text: '3. ხეთური წყაროების თანახმად, ქაშქების ტომებს შორის რომელი ბელადი მართავდა ხალხს მეფესავით ერთპიროვნულად, განსხვავებით ქაშქასთვის ჩვეული მმართველობისგან?',
      question_order: 3,
      answers: [
        { id: 'a3-1', answer_text: 'სიენი', is_correct: false, answer_order: 1 },
        { id: 'a3-2', answer_text: 'უტუპურსი', is_correct: false, answer_order: 2 },
        { id: 'a3-3', answer_text: 'ასია', is_correct: false, answer_order: 3 },
        { id: 'a3-4', answer_text: 'ფიხუნია', is_correct: true, answer_order: 4 }
      ]
    },
    {
      id: 'q-dk-4',
      quiz_id: 'quiz-diauehi-kolkha',
      question_text: '4. რა იყო სამხრეთ საქართველოში მდებარე მეგალითური „ციკლოპური“ ნაგებობების (მაგალითად, აბულის ციხის) მთავარი თავდაცვითი დანიშნულება?',
      question_order: 4,
      answers: [
        { id: 'a4-1', answer_text: 'ბერძენი კოლონისტების საზღვაო თავდასხმებისგან დაცვა', is_correct: false, answer_order: 1 },
        { id: 'a4-2', answer_text: 'ასურეთისა და ურარტუს იმპერიების პერმანენტული შემოსევებისგან თავდაცვა', is_correct: true, answer_order: 2 },
        { id: 'a4-3', answer_text: 'კიმერიელების მომთაბარე რეიდებისგან თავდაცვა', is_correct: false, answer_order: 3 },
        { id: 'a4-4', answer_text: 'შიდატომობრივი სამოქალაქო დაპირისპირებების აღკვეთა', is_correct: false, answer_order: 4 }
      ]
    },
    {
      id: 'q-dk-5',
      quiz_id: 'quiz-diauehi-kolkha',
      question_text: '5. შავი ზღვის სამხრეთ-დასავლეთ მთიანეთში მცხოვრები რომელი ქართველური ტომი ითვლებოდა რკინის წარმოების ტექნოლოგიისა და დამუშავების უბადლო ოსტატად?',
      question_order: 5,
      answers: [
        { id: 'a5-1', answer_text: 'ქაშქები', is_correct: false, answer_order: 1 },
        { id: 'a5-2', answer_text: 'მუშქები', is_correct: false, answer_order: 2 },
        { id: 'a5-3', answer_text: 'ხალიბები', is_correct: true, answer_order: 3 },
        { id: 'a5-4', answer_text: 'კიმერიელები', is_correct: false, answer_order: 4 }
      ]
    },
    {
      id: 'q-dk-6',
      quiz_id: 'quiz-diauehi-kolkha',
      question_text: '6. ერზრუმთან ახლოს აღმოჩენილი იაზილითაშის წარწერა რომელი ისტორიული მოვლენის შესახებ იძლევა უმნიშვნელოვანეს ცნობებს?',
      question_order: 6,
      answers: [
        { id: 'a6-1', answer_text: 'კოლხას განადგურება სკვითების შემოსევის შედეგად', is_correct: false, answer_order: 1 },
        { id: 'a6-2', answer_text: 'ხეთების იმპერიის საბოლოო დაცემა', is_correct: false, answer_order: 2 },
        { id: 'a6-3', answer_text: 'ტიგლათფალასარ I-ის ლაშქრობა ნაირის ქვეყნებში', is_correct: false, answer_order: 3 },
        { id: 'a6-4', answer_text: 'ურარტუს მეფე მენუას მიერ დიაოხის დაპყრობა და მეფე უტუპურსის დამორჩილება', is_correct: true, answer_order: 4 }
      ]
    },
    {
      id: 'q-dk-7',
      quiz_id: 'quiz-diauehi-kolkha',
      question_text: '7. რომელი ქალაქი წარმოადგენდა დიაოხის სამეფო ქალაქს, რომელსაც ისტორიკოსები სასირ-თორთუმთან აიგივებენ?',
      question_order: 7,
      answers: [
        { id: 'a7-1', answer_text: 'ზუა (ზუანი)', is_correct: false, answer_order: 1 },
        { id: 'a7-2', answer_text: 'ილდამუშა', is_correct: false, answer_order: 2 },
        { id: 'a7-3', answer_text: 'უთუხა', is_correct: false, answer_order: 3 },
        { id: 'a7-4', answer_text: 'შაშილუ', is_correct: true, answer_order: 4 }
      ]
    },
    {
      id: 'q-dk-8',
      quiz_id: 'quiz-diauehi-kolkha',
      question_text: '8. ძვ.წ. 1112 წელს ასურეთის მეფე ტიგლათფალასარ I-ის წინააღმდეგ ბრძოლაში დიაენის მეფე სიენს ნაირის ქვეყნების რამდენი მეფის ეტლები და ჯარი ეხმარებოდა?',
      question_order: 8,
      answers: [
        { id: 'a8-1', answer_text: '23 მეფის', is_correct: true, answer_order: 1 },
        { id: 'a8-2', answer_text: '12 მეფის', is_correct: false, answer_order: 2 },
        { id: 'a8-3', answer_text: '41 მეფის', is_correct: false, answer_order: 3 },
        { id: 'a8-4', answer_text: '60 მეფის', is_correct: false, answer_order: 4 }
      ]
    },
    {
      id: 'q-dk-9',
      quiz_id: 'quiz-diauehi-kolkha',
      question_text: '9. ძვ.წ. IX საუკუნეში (დაახლოებით ძვ.წ. 845 წელს) დიაენის რომელმა მეფემ გადაუხადა ხარკი ასურეთის მეფე სალმანასარ III-ს, რის შემდეგაც სალმანასარმა თავისი გამოსახულება ამ მეფის ქალაქის ცენტრში დადგა?',
      question_order: 9,
      answers: [
        { id: 'a9-1', answer_text: 'სიენმა', is_correct: false, answer_order: 1 },
        { id: 'a9-2', answer_text: 'აიეტმა', is_correct: false, answer_order: 2 },
        { id: 'a9-3', answer_text: 'უტუპურსმა', is_correct: false, answer_order: 3 },
        { id: 'a9-4', answer_text: 'ასიამ', is_correct: true, answer_order: 4 }
      ]
    },
    {
      id: 'q-dk-10',
      quiz_id: 'quiz-diauehi-kolkha',
      question_text: '10. ურარტუს მეფე მენუას იაზილითაშის წარწერის თანახმად, დიაოხის რომელმა მეფემ ცნო ურარტუს უზენაესობა და ჩაუვარდა ფეხებში მენუას ხარკის გადახდის პირობით?',
      question_order: 10,
      answers: [
        { id: 'a10-1', answer_text: 'უტუპურსმა (უტუფურში)', is_correct: true, answer_order: 1 },
        { id: 'a10-2', answer_text: 'სიენმა', is_correct: false, answer_order: 2 },
        { id: 'a10-3', answer_text: 'ფიხუნიამ', is_correct: false, answer_order: 3 },
        { id: 'a10-4', answer_text: 'სარდური II-მ', is_correct: false, answer_order: 4 }
      ]
    },
    {
      id: 'q-dk-11',
      quiz_id: 'quiz-diauehi-kolkha',
      question_text: '11. ძვ.წ. VIII საუკუნის შუა წლებში დიაოხის საბოლოო განადგურების შემდეგ, დიაოხის რომელ მხარეს დაუკავშირდა ისტორიული პროვინცია კლარჯეთის სახელწოდება?',
      question_order: 11,
      answers: [
        { id: 'a11-1', answer_text: 'ზაბახას', is_correct: false, answer_order: 1 },
        { id: 'a11-2', answer_text: 'ვიტერუხს', is_correct: false, answer_order: 2 },
        { id: 'a11-3', answer_text: 'ქათარზას', is_correct: true, answer_order: 3 },
        { id: 'a11-4', answer_text: 'შაშილუს', is_correct: false, answer_order: 4 }
      ]
    },
    {
      id: 'q-dk-12',
      quiz_id: 'quiz-diauehi-kolkha',
      question_text: '12. რა საბოლოო ბედი ეწია დიაოხის სამეფოს ძვ.წ. VIII საუკუნის შუა წლებში?',
      question_order: 12,
      answers: [
        { id: 'a12-1', answer_text: 'იგი ასურეთმა დაიპყრო და თავის პროვინციად აქცია', is_correct: false, answer_order: 1 },
        { id: 'a12-2', answer_text: 'იგი გაინაწილეს და შეიერთეს მეზობელმა სახელმწიფომ — ურარტუმ და კოლხამ', is_correct: true, answer_order: 2 },
        { id: 'a12-3', answer_text: 'იგი სკვითების შემოსევამ სრულიად აღგავა პირისაგან მიწისა', is_correct: false, answer_order: 3 },
        { id: 'a12-4', answer_text: 'იგი ნებაყოფლობით შეერთდა ხეთების სამეფოს', is_correct: false, answer_order: 4 }
      ]
    },
    {
      id: 'q-dk-13',
      quiz_id: 'quiz-diauehi-kolkha',
      question_text: '13. ძვ.წ. XI საუკუნის ასურულ ტექსტებში კოლხეთის ტერიტორიის აღსანიშნავად რომელი ტოპონიმი მოიხსენიება პირველად?',
      question_order: 13,
      answers: [
        { id: 'a13-1', answer_text: 'კილხა', is_correct: true, answer_order: 1 },
        { id: 'a13-2', answer_text: 'კუტაია', is_correct: false, answer_order: 2 },
        { id: 'a13-3', answer_text: 'კოლხიდა', is_correct: false, answer_order: 3 },
        { id: 'a13-4', answer_text: 'კულხა', is_correct: false, answer_order: 4 }
      ]
    },
    {
      id: 'q-dk-14',
      quiz_id: 'quiz-diauehi-kolkha',
      question_text: '14. ძვ.წ. IX-VIII საუკუნეების კოლხას სამეფოში, განვითარებული სახელმწიფოებრივი სტრუქტურის დასატურად, ვინ მართავდა ქვეყნის პროვინციებს?',
      question_order: 14,
      answers: [
        { id: 'a14-1', answer_text: 'უხუცესთა საბჭო', is_correct: false, answer_order: 1 },
        { id: 'a14-2', answer_text: 'მეფისნაცვლები', is_correct: true, answer_order: 2 },
        { id: 'a14-3', answer_text: 'ქურუმები', is_correct: false, answer_order: 3 },
        { id: 'a14-4', answer_text: 'სახალხო კრება', is_correct: false, answer_order: 4 }
      ]
    },
    {
      id: 'q-dk-15',
      quiz_id: 'quiz-diauehi-kolkha',
      question_text: '15. კოლხას (კულხას) რომელი სამეფო ქალაქი დაიპყრო და გადაწვა ურარტუს მეფე სარდური II-მ ძვ.წ. VIII საუკუნის 40-იან წლებში?',
      question_order: 15,
      answers: [
        { id: 'a15-1', answer_text: 'ზუა', is_correct: false, answer_order: 1 },
        { id: 'a15-2', answer_text: 'შაშილუ', is_correct: false, answer_order: 2 },
        { id: 'a15-3', answer_text: 'ილდამუშა', is_correct: true, answer_order: 3 },
        { id: 'a15-4', answer_text: 'არტანუჯი', is_correct: false, answer_order: 4 }
      ]
    },
    {
      id: 'q-dk-16',
      quiz_id: 'quiz-diauehi-kolkha',
      question_text: '16. დიაოხის რომელ მეფეს დააკისრა ურარტუს მეფე არგიშთი I-მა ყოველწლიური უზარმაზარი ხარკი (41 მინა ოქრო, 37 მინა ვერცხლი, 10,000 მინა სპილენძი)?',
      question_order: 16,
      answers: [
        { id: 'a16-1', answer_text: 'სიენს', is_correct: false, answer_order: 1 },
        { id: 'a16-2', answer_text: 'ფიხუნიას', is_correct: false, answer_order: 2 },
        { id: 'a16-3', answer_text: 'ასიას', is_correct: false, answer_order: 3 },
        { id: 'a16-4', answer_text: 'უტუპურსს', is_correct: true, answer_order: 4 }
      ]
    },
    {
      id: 'q-dk-17',
      quiz_id: 'quiz-diauehi-kolkha',
      question_text: '17. ურარტუსთან ომებით დასუსტებული კოლხეთის სამეფო ძვ.წ. VIII საუკუნის ბოლოსა და VII საუკუნის I ნახევარში ჩრდილოეთ კავკასიიდან შემოჭრილმა რომელმა მომთაბარე ტომებმა დაარბიეს და გაანადგურეს საბოლოოდ?',
      question_order: 17,
      answers: [
        { id: 'a17-1', answer_text: 'ხეთებმა და ასურელებმა', is_correct: false, answer_order: 1 },
        { id: 'a17-2', answer_text: 'კიმერიელებმა და სკვითებმა', is_correct: true, answer_order: 2 },
        { id: 'a17-3', answer_text: 'მიდიელებმა და სპარსელებმა', is_correct: false, answer_order: 3 },
        { id: 'a17-4', answer_text: 'რომაელებმა და ბერძნებმა', is_correct: false, answer_order: 4 }
      ]
    },
    {
      id: 'q-dk-18',
      quiz_id: 'quiz-diauehi-kolkha',
      question_text: '18. ურარტული კულტურული და ენობრივი მემკვიდრეობის მიხედვით, ქართულ სამეურნეო სიმღერებში („ოროველა“, „კალოსპირული“) შემორჩენილი ღვთაება „არალეს“ სახელთან დაკავშირებული ფრაზა „ივრი არალე“ ურარტული ენიდან თარგმანში ნიშნავს:',
      question_order: 18,
      answers: [
        { id: 'a18-1', answer_text: '„მეუფეო არალე“', is_correct: true, answer_order: 1 },
        { id: 'a18-2', answer_text: '„დიდო არალე“', is_correct: false, answer_order: 2 },
        { id: 'a18-3', answer_text: '„ძლიერო არალე“', is_correct: false, answer_order: 3 },
        { id: 'a18-4', answer_text: '„მშვენიერო არალე“', is_correct: false, answer_order: 4 }
      ]
    },
    {
      id: 'q-dk-19',
      quiz_id: 'quiz-diauehi-kolkha',
      question_text: '19. რა არის ქართული სიტყვის — „ყირამალა“ (მიწაზე გორაობა/ყირამალა) ეტიმოლოგიური წარმოშობა?',
      question_order: 19,
      answers: [
        { id: 'a19-1', answer_text: 'ასურული სიტყვა „ქირუ“ (ბაღი)', is_correct: false, answer_order: 1 },
        { id: 'a19-2', answer_text: 'ურარტული სიტყვა „ყირა“, რაც ნიშნავს „მიწას“ / „მიწისპირს“', is_correct: true, answer_order: 2 },
        { id: 'a19-3', answer_text: 'ხეთური სიტყვა „ყირას“ (ქვა)', is_correct: false, answer_order: 3 },
        { id: 'a19-4', answer_text: 'ბერძნული სიტყვა „ქირონ“ (ხელი)', is_correct: false, answer_order: 4 }
      ]
    },
    {
      id: 'q-dk-20',
      quiz_id: 'quiz-diauehi-kolkha',
      question_text: '20. რატომ ჰქონდა ძვ.წ. 1200 წლის „ბრინჯაოს ხანის კოლაფსს“ შედარებით ნაკლებად დამაანგრეველი გავლენა სამხრეთ კავკასიასა და ქართველურ ტომებზე, ანატოლიასა და ხმელთაშუაზღვისპირეთთან შედარებით?',
      question_order: 20,
      answers: [
        { id: 'a20-1', answer_text: 'კავკასიელებს უკვე ჰქონდათ ცეცხლსასროლი იარაღი', is_correct: false, answer_order: 1 },
        { id: 'a20-2', answer_text: 'ასურეთმა სამხედრო დახმარება გაუწია დიაოხს', is_correct: false, answer_order: 2 },
        { id: 'a20-3', answer_text: 'ხეთების იმპერიამ დაიცვა კავკასია', is_correct: false, answer_order: 3 },
        { id: 'a20-4', answer_text: 'რეგიონი გეოგრაფიულად უფრო იზოლირებული იყო „ზღვის ხალხების“ უშუალო შემოსევებისგან', is_correct: true, answer_order: 4 }
      ]
    }
  ]
};

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
      if (error) console.error('Error loading quizzes:', error);
      return [];
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
    return [];
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
      return null;
    }

    // 2. Fetch Questions
    const { data: questionsData, error: qError } = await supabase
      .from('quiz_questions')
      .select('id, quiz_id, question_text, image_path, question_order')
      .eq('quiz_id', quizId)
      .order('question_order', { ascending: true });

    if (qError || !questionsData || questionsData.length === 0) {
      return { quiz: quizData, questions: [] };
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
    return null;
  }
}

// Delete previous quiz attempts for a specific quiz and user/guest (DB + Local)
export async function resetQuizAttempt(
  quizId: string,
  userId: string | null,
  guestName: string | null
): Promise<boolean> {
  const cleanGuest = guestName ? guestName.trim() : null;
  removeLocalAttemptsForQuiz(quizId, userId, cleanGuest);

  try {
    let query = supabase.from('quiz_attempts').delete().eq('quiz_id', quizId);
    if (userId) {
      query = query.eq('user_id', userId);
    } else if (cleanGuest) {
      query = query.eq('guest_name', cleanGuest);
    } else {
      return true;
    }
    await query;
    return true;
  } catch (err) {
    console.error('Error resetting quiz attempt in DB:', err);
    return false;
  }
}

// Submit Quiz Attempt (Server-side evaluation via RPC with client fallback)
export async function submitQuizAttempt(
  quizId: string,
  userId: string | null,
  guestName: string | null,
  userAnswers: { question_id: string; answer_id: string }[],
  tabSwitches: number = 0
): Promise<{
  attempt_id: string;
  correct_answers: number;
  total_questions: number;
  percentage: number;
  tab_switches?: number;
}> {
  const cleanGuest = guestName ? guestName.trim() : null;

  // Clear previous attempt for this quiz from DB & LocalStorage so DB does not get overloaded
  await resetQuizAttempt(quizId, userId || null, cleanGuest);

  try {
    // Try RPC submit
    const { data, error } = await supabase.rpc('submit_quiz_attempt', {
      p_quiz_id: quizId,
      p_user_id: userId || null,
      p_guest_name: cleanGuest,
      p_user_answers: userAnswers,
      p_tab_switches: tabSwitches
    });

    if (!error && data) {
      return {
        attempt_id: data.attempt_id,
        correct_answers: data.correct_answers,
        total_questions: data.total_questions,
        percentage: Number(data.percentage),
        tab_switches: tabSwitches
      };
    }

    console.warn('RPC submit failed or not present, executing client-side fallback grading:', error);
  } catch (e) {
    console.warn('RPC submit exception, doing fallback grading:', e);
  }

  // Fallback grading: fetch answers with is_correct from Supabase
  let total = 0;
  let correct = 0;

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
      percentage: percentage,
      user_answers: userAnswers,
      tab_switches: tabSwitches
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
      created_at: new Date().toISOString(),
      user_answers: userAnswers,
      tab_switches: tabSwitches
    });
  }

  return {
    attempt_id: newId,
    correct_answers: correct,
    total_questions: total,
    percentage: percentage,
    tab_switches: tabSwitches
  };
}

// Local attempts helpers
export function removeLocalAttemptsForQuiz(quizId: string, userId?: string | null, guestName?: string | null) {
  try {
    const existing = getLocalAttempts();
    const cleanGuest = guestName ? guestName.trim().toLowerCase() : null;
    const updated = existing.filter(a => {
      if (a.quiz_id !== quizId) return true;
      if (userId && a.user_id === userId) return false;
      if (cleanGuest && a.guest_name && a.guest_name.trim().toLowerCase() === cleanGuest) return false;
      if (!userId && !cleanGuest) return false;
      return true;
    });
    localStorage.setItem('nt_quiz_attempts', JSON.stringify(updated));
  } catch (e) {
    console.error('Error removing local attempts for quiz:', e);
  }
}

function saveLocalAttempt(attempt: QuizAttempt) {
  try {
    removeLocalAttemptsForQuiz(attempt.quiz_id, attempt.user_id, attempt.guest_name);
    const existing = getLocalAttempts();
    const updated = [attempt, ...existing];
    localStorage.setItem('nt_quiz_attempts', JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving local quiz attempt:', e);
  }
}

function getLocalAttempts(quizId?: string): QuizAttempt[] {
  try {
    const raw = localStorage.getItem('nt_quiz_attempts');
    if (!raw) return [];
    const parsed: QuizAttempt[] = JSON.parse(raw);
    if (quizId) {
      return parsed.filter(a => a.quiz_id === quizId);
    }
    return parsed;
  } catch (e) {
    return [];
  }
}

export function removeLocalAttempt(attemptId: string) {
  try {
    const existing = getLocalAttempts();
    const updated = existing.filter(a => a.id !== attemptId);
    localStorage.setItem('nt_quiz_attempts', JSON.stringify(updated));
  } catch (e) {
    console.error('Error removing local quiz attempt:', e);
  }
}

// Helper to deduplicate attempts keeping only the latest attempt per quiz
function getLatestAttemptsPerQuiz(attempts: QuizAttempt[]): QuizAttempt[] {
  const map = new Map<string, QuizAttempt>();
  for (const a of attempts) {
    if (!map.has(a.quiz_id)) {
      map.set(a.quiz_id, a);
    }
  }
  return Array.from(map.values());
}

// Fetch all attempts for a specific logged-in user or guest (stores only the latest result per quiz)
export async function fetchUserQuizAttempts(userId: string, guestName?: string): Promise<QuizAttempt[]> {
  try {
    let query = supabase
      .from('quiz_attempts')
      .select('id, quiz_id, user_id, guest_name, correct_answers, total_questions, percentage, created_at, user_answers, tab_switches')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (guestName) {
      query = query.eq('guest_name', guestName);
    } else {
      return getLatestAttemptsPerQuiz(getLocalAttempts());
    }

    const { data: attempts, error } = await query;

    let dbAttempts = attempts || [];

    if (error || dbAttempts.length === 0) {
      dbAttempts = getLocalAttempts();
    }

    if (dbAttempts.length === 0) return [];

    // Filter to keep ONLY the latest result per quiz
    const latestAttempts = getLatestAttemptsPerQuiz(dbAttempts);

    // Fetch quiz titles and cover images for each attempt
    const quizIds = [...new Set(latestAttempts.map(a => a.quiz_id))];
    const quizMap = new Map<string, { title: string; cover_image_path: string | null }>();

    if (quizIds.length > 0) {
      const { data: quizzes } = await supabase
        .from('quizzes')
        .select('id, title, cover_image_path')
        .in('id', quizIds);

      (quizzes || []).forEach(q => {
        quizMap.set(q.id, { title: q.title, cover_image_path: q.cover_image_path });
      });
    }

    return latestAttempts.map(a => {
      const qInfo = quizMap.get(a.quiz_id);
      return {
        ...a,
        quiz_title: qInfo?.title || a.quiz_title || 'ისტორიული ქვიზი',
        quiz_cover_image_path: qInfo?.cover_image_path || a.quiz_cover_image_path || null
      };
    });
  } catch (err) {
    console.error('Error fetching user quiz attempts:', err);
    return getLatestAttemptsPerQuiz(getLocalAttempts());
  }
}

// Delete Quiz Attempt
export async function deleteQuizAttempt(attemptId: string): Promise<boolean> {
  removeLocalAttempt(attemptId);
  try {
    const { error } = await supabase
      .from('quiz_attempts')
      .delete()
      .eq('id', attemptId);

    if (error) {
      console.error('Error deleting quiz attempt from DB:', error);
    }
    return true;
  } catch (err) {
    console.error('Error in deleteQuizAttempt:', err);
    return true;
  }
}

// Fetch Quiz Questions with correct answer flags for Detailed Review Modal
export async function fetchQuizQuestionsWithAnswers(quizId: string): Promise<QuizQuestionItem[]> {
  try {
    const { data: questionsData, error: qError } = await supabase
      .from('quiz_questions')
      .select('id, quiz_id, question_text, image_path, question_order')
      .eq('quiz_id', quizId)
      .order('question_order', { ascending: true });

    if (qError || !questionsData) return [];

    const result: QuizQuestionItem[] = [];
    for (const q of questionsData) {
      const { data: answersData } = await supabase
        .from('quiz_answers')
        .select('id, question_id, answer_text, is_correct, answer_order')
        .eq('question_id', q.id)
        .order('answer_order', { ascending: true });

      result.push({
        ...q,
        answers: answersData || []
      });
    }

    return result;
  } catch (err) {
    console.error('Error fetching questions with answers for review:', err);
    return [];
  }
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

  // Fallback: only local attempts (no fake leaderboard data)
  const local = getLocalAttempts(quizId);
  if (local.length === 0) return [];

  const map = new Map<string, QuizLeaderboardItem>();
  for (const item of local) {
    const key = item.user_id ? `u_${item.user_id}` : `g_${(item.guest_name || '').toLowerCase().trim()}`;
    if (!map.has(key)) map.set(key, item);
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
