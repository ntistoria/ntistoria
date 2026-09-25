import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://enjnwxpzafroxapksdlt.supabase.co';
const supabaseKey = 'sb_publishable_dpO82-UPWGqkk2Z5eJ2SAA_-119eWfN';

const supabase = createClient(supabaseUrl, supabaseKey);

export const diauehiQuizData = {
  title: 'დიაოხი და კოლხა',
  description: 'ბრინჯაოს ხანის კოლაფსი, მუშქები, ხალიბები, დიაოხის სამეფო და კოლხას გაერთიანება',
  status: 'published',
  is_active: true,
  questions: [
    {
      text: '1. რომელ საუკუნეში დაიწყო „ბრინჯაოს ხანის კოლაფსი“, რამაც გამოიწვია მოსახლეობის უკონტროლო მიგრაცია და ხეთების იმპერიის განადგურება?',
      answers: [
        { text: 'ძვ.წ. XIII-XII საუკუნეებში', is_correct: true },
        { text: 'ძვ.წ. XV საუკუნეში', is_correct: false },
        { text: 'ძვ.წ. IX საუკუნეში', is_correct: false },
        { text: 'ძვ.წ. VI საუკუნეში', is_correct: false }
      ]
    },
    {
      text: '2. ბრონჯაოს ხანის კოლაფსის შემდეგ (დაახლ. ძვ.წ. 1200 წ.), რომელი ჯგუფი მოგვევლინა მესხური ქართველური ტომების პირდაპირ წინაპრებად?',
      answers: [
        { text: 'ხალიბები', is_correct: false },
        { text: 'ქაშქები', is_correct: false },
        { text: 'მუშქები', is_correct: true },
        { text: 'კიმერიელები', is_correct: false }
      ]
    },
    {
      text: '3. ხეთური წყაროების თანახმად, ქაშქების ტომებს შორის რომელი ბელადი მართავდა ხალხს მეფესავით ერთპიროვნულად, განსხვავებით ქაშქასთვის ჩვეული მმართველობისგან?',
      answers: [
        { text: 'სიენი', is_correct: false },
        { text: 'უტუპურსი', is_correct: false },
        { text: 'ასია', is_correct: false },
        { text: 'ფიხუნია', is_correct: true }
      ]
    },
    {
      text: '4. რა იყო სამხრეთ საქართველოში მდებარე მეგალითური „ციკლოპური“ ნაგებობების (მაგალითად, აბულის ციხის) მთავარი თავდაცვითი დანიშნულება?',
      answers: [
        { text: 'ბერძენი კოლონისტების საზღვაო თავდასხმებისგან დაცვა', is_correct: false },
        { text: 'ასურეთისა და ურარტუს იმპერიების პერმანენტული შემოსევებისგან თავდაცვა', is_correct: true },
        { text: 'კიმერიელების მომთაბარე რეიდებისგან თავდაცვა', is_correct: false },
        { text: 'შიდატომობრივი სამოქალაქო დაპირისპირებების აღკვეთა', is_correct: false }
      ]
    },
    {
      text: '5. შავი ზღვის სამხრეთ-დასავლეთ მთიანეთში მცხოვრები რომელი ქართველური ტომი ითვლებოდა რკინის წარმოების ტექნოლოგიისა და დამუშავების უბადლო ოსტატად?',
      answers: [
        { text: 'ქაშქები', is_correct: false },
        { text: 'მუშქები', is_correct: false },
        { text: 'ხალიბები', is_correct: true },
        { text: 'კიმერიელები', is_correct: false }
      ]
    },
    {
      text: '6. ერზრუმთან ახლოს აღმოჩენილი იაზილითაშის წარწერა რომელი ისტორიული მოვლენის შესახებ იძლევა უმნიშვნელოვანეს ცნობებს?',
      answers: [
        { text: 'კოლხას განადგურება სკვითების შემოსევის შედეგად', is_correct: false },
        { text: 'ხეთების იმპერიის საბოლოო დაცემა', is_correct: false },
        { text: 'ტიგლათფალასარ I-ის ლაშქრობა ნაირის ქვეყნებში', is_correct: false },
        { text: 'ურარტუს მეფე მენუას მიერ დიაოხის დაპყრობა და მეფე უტუპურსის დამორჩილება', is_correct: true }
      ]
    },
    {
      text: '7. რომელი ქალაქი წარმოადგენდა დიაოხის სამეფო ქალაქს, რომელსაც ისტორიკოსები სასირ-თორთუმთან აიგივებენ?',
      answers: [
        { text: 'ზუა (ზუანი)', is_correct: false },
        { text: 'ილდამუშა', is_correct: false },
        { text: 'უთუხა', is_correct: false },
        { text: 'შაშილუ', is_correct: true }
      ]
    },
    {
      text: '8. ძვ.წ. 1112 წელს ასურეთის მეფე ტიგლათფალასარ I-ის წინააღმდეგ ბრძოლაში დიაენის მეფე სიენს ნაირის ქვეყნების რამდენი მეფის ეტლები და ჯარი ეხმარებოდა?',
      answers: [
        { text: '23 მეფის', is_correct: true },
        { text: '12 მეფის', is_correct: false },
        { text: '41 მეფის', is_correct: false },
        { text: '60 მეფის', is_correct: false }
      ]
    },
    {
      text: '9. ძვ.წ. IX საუკუნეში (დაახლოებით ძვ.წ. 845 წელს) დიაენის რომელმა მეფემ გადაუხადა ხარკი ასურეთის მეფე სალმანასარ III-ს, რის შემდეგაც სალმანასარმა თავისი გამოსახულება ამ მეფის ქალაქის ცენტრში დადგა?',
      answers: [
        { text: 'სიენმა', is_correct: false },
        { text: 'აიეტმა', is_correct: false },
        { text: 'უტუპურსმა', is_correct: false },
        { text: 'ასიამ', is_correct: true }
      ]
    },
    {
      text: '10. ურარტუს მეფე მენუას იაზილითაშის წარწერის თანახმად, დიაოხის რომელმა მეფემ ცნო ურარტუს უზენაესობა და ჩაუვარდა ფეხებში მენუას ხარკის გადახდის პირობით?',
      answers: [
        { text: 'უტუპურსმა (უტუფურში)', is_correct: true },
        { text: 'სიენმა', is_correct: false },
        { text: 'ფიხუნიამ', is_correct: false },
        { text: 'სარდური II-მ', is_correct: false }
      ]
    },
    {
      text: '11. ძვ.წ. VIII საუკუნის შუა წლებში დიაოხის საბოლოო განადგურების შემდეგ, დიაოხის რომელ მხარეს დაუკავშირდა ისტორიული პროვინცია კლარჯეთის სახელწოდება?',
      answers: [
        { text: 'ზაბახას', is_correct: false },
        { text: 'ვიტერუხს', is_correct: false },
        { text: 'ქათარზას', is_correct: true },
        { text: 'შაშილუს', is_correct: false }
      ]
    },
    {
      text: '12. რა საბოლოო ბედი ეწია დიაოხის სამეფოს ძვ.წ. VIII საუკუნის შუა წლებში?',
      answers: [
        { text: 'იგი ასურეთმა დაიპყრო და თავის პროვინციად აქცია', is_correct: false },
        { text: 'იგი გაინაწილეს და შეიერთეს მეზობელმა სახელმწიფომ — ურარტუმ და კოლხამ', is_correct: true },
        { text: 'იგი სკვითების შემოსევამ სრულიად აღგავა პირისაგან მიწისა', is_correct: false },
        { text: 'იგი ნებაყოფლობით შეერთდა ხეთების სამეფოს', is_correct: false }
      ]
    },
    {
      text: '13. ძვ.წ. XI საუკუნის ასურულ ტექსტებში კოლხეთის ტერიტორიის აღსანიშნავად რომელი ტოპონიმი მოიხსენიება პირველად?',
      answers: [
        { text: 'კილხა', is_correct: true },
        { text: 'კუტაია', is_correct: false },
        { text: 'კოლხიდა', is_correct: false },
        { text: 'კულხა', is_correct: false }
      ]
    },
    {
      text: '14. ძვ.წ. IX-VIII საუკუნეების კოლხას სამეფოში, განვითარებული სახელმწიფოებრივი სტრუქტურის დასატურად, ვინ მართავდა ქვეყნის პროვინციებს?',
      answers: [
        { text: 'უხუცესთა საბჭო', is_correct: false },
        { text: 'მეფისნაცვლები', is_correct: true },
        { text: 'ქურუმები', is_correct: false },
        { text: 'სახალხო კრება', is_correct: false }
      ]
    },
    {
      text: '15. კოლხას (კულხას) რომელი სამეფო ქალაქი დაიპყრო და გადაწვა ურარტუს მეფე სარდური II-მ ძვ.წ. VIII საუკუნის 40-იან წლებში?',
      answers: [
        { text: 'ზუა', is_correct: false },
        { text: 'შაშილუ', is_correct: false },
        { text: 'ილდამუშა', is_correct: true },
        { text: 'არტანუჯი', is_correct: false }
      ]
    },
    {
      text: '16. დიაოხის რომელ მეფეს დააკისრა ურარტუს მეფე არგიშთი I-მა ყოველწლიური უზარმაზარი ხარკი (41 მინა ოქრო, 37 მინა ვერცხლი, 10,000 მინა სპილენძი)?',
      answers: [
        { text: 'სიენს', is_correct: false },
        { text: 'ფიხუნიას', is_correct: false },
        { text: 'ასიას', is_correct: false },
        { text: 'უტუპურსს', is_correct: true }
      ]
    },
    {
      text: '17. ურარტუსთან ომებით დასუსტებული კოლხეთის სამეფო ძვ.წ. VIII საუკუნის ბოლოსა და VII საუკუნის I ნახევარში ჩრდილოეთ კავკასიიდან შემოჭრილმა რომელმა მომთაბარე ტომებმა დაარბიეს და გაანადგურეს საბოლოოდ?',
      answers: [
        { text: 'ხეთებმა და ასურელებმა', is_correct: false },
        { text: 'კიმერიელებმა და სკვითებმა', is_correct: true },
        { text: 'მიდიელებმა და სპარსელებმა', is_correct: false },
        { text: 'რომაელებმა და ბერძნებმა', is_correct: false }
      ]
    },
    {
      text: '18. ურარტული კულტურული და ენობრივი მემკვიდრეობის მიხედვით, ქართულ სამეურნეო სიმღერებში („ოროველა“, „კალოსპირული“) შემორჩენილი ღვთაება „არალეს“ სახელთან დაკავშირებული ფრაზა „ივრი არალე“ ურარტული ენიდან თარგმანში ნიშნავს:',
      answers: [
        { text: '„მეუფეო არალე“', is_correct: true },
        { text: '„დიდო არალე“', is_correct: false },
        { text: '„ძლიერო არალე“', is_correct: false },
        { text: '„მშვენიერო არალე“', is_correct: false }
      ]
    },
    {
      text: '19. რა არის ქართული სიტყვის — „ყირამალა“ (მიწაზე გორაობა/ყირამალა) ეტიმოლოგიური წარმოშობა?',
      answers: [
        { text: 'ასურული სიტყვა „ქირუ“ (ბაღი)', is_correct: false },
        { text: 'ურარტული სიტყვა „ყირა“, რაც ნიშნავს „მიწას“ / „მიწისპირს“', is_correct: true },
        { text: 'ხეთური სიტყვა „ყირას“ (ქვა)', is_correct: false },
        { text: 'ბერძნული სიტყვა „ქირონ“ (ხელი)', is_correct: false }
      ]
    },
    {
      text: '20. რატომ ჰქონდა ძვ.წ. 1200 წლის „ბრინჯაოს ხანის კოლაფსს“ შედარებით ნაკლებად დამაანგრეველი გავლენა სამხრეთ კავკასიასა და ქართველურ ტომებზე, ანატოლიასა და ხმელთაშუაზღვისპირეთთან შედარებით?',
      answers: [
        { text: 'კავკასიელებს უკვე ჰქონდათ ცეცხლსასროლი იარაღი', is_correct: false },
        { text: 'ასურეთმა სამხედრო დახმარება გაუწია დიაოხს', is_correct: false },
        { text: 'ხეთების იმპერიამ დაიცვა კავკასია', is_correct: false },
        { text: 'რეგიონი გეოგრაფიულად უფრო იზოლირებული იყო „ზღვის ხალხების“ უშუალო შემოსევებისგან', is_correct: true }
      ]
    }
  ]
};

async function upload() {
  console.log('Inserting Diauehi and Colchis quiz...');

  // Check if quiz already exists to prevent duplicate insertion
  const { data: existingQuizzes } = await supabase
    .from('quizzes')
    .select('id')
    .eq('title', diauehiQuizData.title);

  if (existingQuizzes && existingQuizzes.length > 0) {
    console.log(`Quiz "${diauehiQuizData.title}" already exists in Supabase. Updating questions...`);
    // Delete existing questions & answers for this quiz ID
    for (const eq of existingQuizzes) {
      await supabase.from('quizzes').delete().eq('id', eq.id);
    }
  }

  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .insert([{
      title: diauehiQuizData.title,
      description: diauehiQuizData.description,
      status: diauehiQuizData.status,
      is_active: diauehiQuizData.is_active
    }])
    .select()
    .single();

  if (quizError) {
    console.error('Error inserting quiz:', quizError);
    process.exit(1);
  }

  console.log(`Quiz inserted successfully with ID: ${quiz.id}`);

  for (let i = 0; i < diauehiQuizData.questions.length; i++) {
    const qData = diauehiQuizData.questions[i];
    const { data: question, error: qError } = await supabase
      .from('quiz_questions')
      .insert([{
        quiz_id: quiz.id,
        question_text: qData.text,
        question_order: i + 1
      }])
      .select()
      .single();

    if (qError) {
      console.error(`Error inserting question ${i + 1}:`, qError);
      process.exit(1);
    }

    const answersPayload = qData.answers.map((ans, idx) => ({
      question_id: question.id,
      answer_text: ans.text,
      is_correct: ans.is_correct,
      answer_order: idx + 1
    }));

    const { error: aError } = await supabase
      .from('quiz_answers')
      .insert(answersPayload);

    if (aError) {
      console.error(`Error inserting answers for question ${i + 1}:`, aError);
      process.exit(1);
    }

    console.log(`Question ${i + 1}/20 inserted.`);
  }

  console.log('SUCCESS_DIAUEHI_QUIZ_UPLOADED');
}

upload();
