import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://enjnwxpzafroxapksdlt.supabase.co';
const supabaseKey = 'sb_publishable_dpO82-UPWGqkk2Z5eJ2SAA_-119eWfN';

const supabase = createClient(supabaseUrl, supabaseKey);

const quizData = {
  title: 'ძველი აღმოსავლეთი (3)',
  description: 'ბაბილონი, ასურეთი, ხეთები, ურარტუ',
  status: 'published',
  is_active: true,
  questions: [
    {
      text: 'რომელმა ხალხებმა დაამხეს ურის III დინასტია ძვ.წ. II ათასწლეულის დასაწყისში, რის შედეგადაც საფუძველი ჩაეყარა ბაბილონის სამეფოს?',
      answers: [
        { text: 'ასურელებმა და ხეთებმა', is_correct: false },
        { text: 'ამორეველებმა (დასავლეთიდან) და ელამელებმა (აღმოსავლეთიდან)', is_correct: true },
        { text: 'სპარსელებმა და მიდიელებმა', is_correct: false },
        { text: 'სკვითებმა და კიმერიელებმა', is_correct: false }
      ]
    },
    {
      text: 'ძვ.წ. XVIII საუკუნეში სამხრეთ შუამდინარეთის გაერთიანებისას, რომელი სამეფო დაიმორჩილა ბაბილონის მეფე ხამურაბიმ?',
      answers: [
        { text: 'ურარტუს სამეფო', is_correct: false },
        { text: 'ლარსას სამეფო', is_correct: true },
        { text: 'მითანის სამეფო', is_correct: false },
        { text: 'იუდას სამეფო', is_correct: false }
      ]
    },
    {
      text: 'ასურეთის რომელმა მეფემ გაატარა ძვ.წ. VIII საუკუნეში ფართომასშტაბიანი რეფორმები (პროვინციების დაქუცმაცება, მუდმივი პროფესიული არმიის — „სამეფო რაზმის“ შექმნა და მასობრივი დეპორტაციის პოლიტიკა)?',
      answers: [
        { text: 'ტიგლათფილესერ III-მ', is_correct: true },
        { text: 'ასურბანიპალმა', is_correct: false },
        { text: 'სალმანასარ III-მ', is_correct: false },
        { text: 'ასურნასირპალ II-მ', is_correct: false }
      ]
    },
    {
      text: 'რომელი ორი ძალის სამხედრო კავშირმა მოუღო ბოლო ახალასურულ იმპერიას ძვ.წ. VII საუკუნის მიწურულს (ძვ.წ. 612 წელს ნინევიის დაცემა)?',
      answers: [
        { text: 'ხეთებისა და ეგვიპტის', is_correct: false },
        { text: 'მიდიისა და ახალბაბილონური სამეფოს', is_correct: true },
        { text: 'ურარტუსა და ფრიგიის', is_correct: false },
        { text: 'სპარსეთისა და ლიდიის', is_correct: false }
      ]
    },
    {
      text: 'ბაბილონის მეფე ხამურაბის (ძვ.წ. XVIII ს.) კანონთა კრებულის მიხედვით, როგორ იყოფოდა საზოგადოება?',
      answers: [
        { text: 'პატრიციებად და პლებეებად', is_correct: false },
        { text: 'ავილუმი (სრულუფლებიანი თავისუფალი მოქალაქე), მუშქენუმი (არასრულუფლებიანი თავისუფალი) და ვარდუმი (მონა)', is_correct: true },
        { text: 'ქურუმებად, მეომრებად და მონებად', is_correct: false },
        { text: 'მოქალაქეებად და უცხოელებად', is_correct: false }
      ]
    },
    {
      text: 'რა ერქვა ბაბილონში სამხედრო მიწათმფლობელობის ინსტიტუტს და რა მაქსიმალური ვადა იყო დაწესებული სავალო მონობისთვის ხამურაბის კანონებით?',
      answers: [
        { text: 'ქარუმი; 10 წელი', is_correct: false },
        { text: 'ილქუ; მაქსიმუმ 3 წელი იძულებითი შრომა კრედიტორის მეურნეობაში', is_correct: true },
        { text: 'პანკუსი; უვადო მონობა', is_correct: false },
        { text: 'ედუბა; 1 წელი', is_correct: false }
      ]
    },
    {
      text: 'რა რელიგიურ-პოლიტიკური ნაბიჯი გახდა ახალბაბილონური სამეფოს უკანასკნელი მეფის, ნაბონიდის დაცემის ერთ-ერთი მიზეზი?',
      answers: [
        { text: 'ქრისტიანობის სახელმწიფო რელიგიად გამოცხადება', is_correct: false },
        { text: 'მთვარის ღვთაება სინის განდიდება ბაბილონის მფარველი ღმერთის, მარდუქის ქურუმობის ინტერესთა საზიანოდ', is_correct: true },
        { text: 'ზიქურათების სრული დანგრევა', is_correct: false },
        { text: 'ხეთებთან ომის წამოწყება', is_correct: false }
      ]
    },
    {
      text: 'რომელმა მეფემ და როდის აიღო იერუსალიმი და განახორციელა იუდას სამეფოს მოსახლეობის მასობრივი დეპორტაცია („ბაბილონის ტყვეობა“)?',
      answers: [
        { text: 'ხამურაბიმ (ძვ.წ. XVIII ს.)', is_correct: false },
        { text: 'ნაბუქოდონოსორ II-მ (ძვ.წ. 586 წ.)', is_correct: true },
        { text: 'კიროს II დიდმა (ძვ.წ. 539 წ.)', is_correct: false },
        { text: 'სარგონ II-მ (ძვ.წ. 722 წ.)', is_correct: false }
      ]
    },
    {
      text: 'როდის და ვის მიერ იქნა დაპყრობილი ბაბილონი, რის შედეგადაც მან საბოლოოდ დაკარგა დამოუკიდებლობა (ხოლო იუდეველებს სამშობლოში დაბრუნების უფლება მიეცათ)?',
      answers: [
        { text: 'ძვ.წ. 1531 წელს ხეთების მეფე მურსილი I-ის მიერ', is_correct: false },
        { text: 'ძვ.წ. 539 წელს სპარსეთის (აქემენიანთა) მეფე კიროს II დიდის მიერ', is_correct: true },
        { text: 'ძვ.წ. 689 წელს ასურეთის მიერ', is_correct: false },
        { text: 'ძვ.წ. 331 წელს ალექსანდრე მაკედონელის მიერ', is_correct: false }
      ]
    },
    {
      text: 'ხეთების ადრეულმა მეფემ, ანიტამ (ძვ.წ. XVIII ს. დასაწყისი), ანატოლიის ქალაქების გაერთიანებისას რომელ ადგილობრივ ხალხს სძლია და დაანგრია მათი ციხე-ქალაქი ხათუსა?',
      answers: [
        { text: 'ხურიტებს', is_correct: false },
        { text: 'ხათებს (პროტოხეთებს)', is_correct: true },
        { text: 'ამორეველებს', is_correct: false },
        { text: 'ასურელებს', is_correct: false }
      ]
    },
    {
      text: 'ხეთების რომელმა მეფემ განახორციელა შორეული ლაშქრობა, ძვ.წ. 1531 წელს აიღო ბაბილონი და წერტილი დაუსვა ხამურაბის ამორეველთა დინასტიას?',
      answers: [
        { text: 'ხათუსილი I-მა', is_correct: false },
        { text: 'მურსილი I-მა', is_correct: true },
        { text: 'სუპილულიუმა I-მა', is_correct: false },
        { text: 'მუვათალმა', is_correct: false }
      ]
    },
    {
      text: 'შავიზღვისპირელი რომელი მთიელი ტომები (პონტოს რეგიონიდან) უტევდნენ განუწყვეტლივ ხეთების სამეფოს ჩრდილოეთიდან?',
      answers: [
        { text: 'ფელეშტები', is_correct: false },
        { text: 'ქასქები', is_correct: true },
        { text: 'გუტიები', is_correct: false },
        { text: 'ელამელები', is_correct: false }
      ]
    },
    {
      text: 'რა სამართლებრივი თავისებურებით გამოირჩეოდა ხეთური კანონები სხვა ძველაღმოსავლური კოდექსებისგან?',
      answers: [
        { text: 'მხოლოდ სიკვდილით დასჯის გამოყენებით', is_correct: false },
        { text: 'ტალიონის პრინციპის („თვალი თვალის წილ“) ნაცვლად ზიანის ფულადი/მატერიალური ანაზღაურების (კომპენსაციის) პრინციპით', is_correct: true },
        { text: 'კანონების სრული უარყოფით', is_correct: false },
        { text: 'მხოლოდ სასულიერო პირთა გასამართლებით', is_correct: false }
      ]
    },
    {
      text: 'დაასახელეთ ახალი ასურეთის სამეფოს მთავარი დედაქალაქი და ვინ იყო მისი უზენაესი ომისა და სახელმწიფოს მფარველი ღვთაება?',
      answers: [
        { text: 'ხათუსა; თეშუბი', is_correct: false },
        { text: 'ნინევია; აშური', is_correct: true },
        { text: 'ტუშპა; ხალდი', is_correct: false },
        { text: 'ბაბილონი; მარდუქი', is_correct: false }
      ]
    },
    {
      text: 'ასურეთის რომელმა მეფეებმა ილაშქრეს ქართული გაერთიანებებისა და მეზობელი სამეფოების წინააღმდეგ?',
      answers: [
        { text: 'ტიგლათფილესერ I-მა დაალაშქრა დაიაენი (დიაოხი) და დაატყვევა მეფე სიენი; ტიგლათფილესერ III-მ დაამარცხა სარდურ II; სარგონ II-მ 722 წელს გაანადგურა ისრაელის სამეფო', is_correct: true },
        { text: 'ხამურაბიმ დაამარცხა კოლხა', is_correct: false },
        { text: 'სარგონ დიდმა დაიპყრო ურარტუ', is_correct: false },
        { text: 'ასურეთის მეფეებს კავკასიაში არასდროს ულიაშქრიათ', is_correct: false }
      ]
    },
    {
      text: 'რა ეკონომიკურ-სამხედრო შედეგი მოჰყვა ასურეთის მეფე სარგონ II-ის მიერ ისრაელის სამეფოს განადგურებასა (ძვ.წ. 722 წ.) და მოსახლეობის დეპორტაციას?',
      answers: [
        { text: 'ასურეთის იმპერიის დაუყოვნებლივი დაშლა', is_correct: false },
        { text: 'დეპორტირებულებს შეჰქონდათ იაფი მუშახელი, ცოდნა და კულტურა, რამაც გააძლიერა იმპერია', is_correct: true },
        { text: 'ბაბილონის მიერ ასურეთის დაპყრობა', is_correct: false },
        { text: 'ეგვიპტის სრული განადგურება', is_correct: false }
      ]
    },
    {
      text: 'ასურეთის რომელმა მმართველმა შექმნა ნინევიაში თიხის ფირფიტების უზარმაზარი ბიბლიოთეკა, სადაც შემოინახა გილგამეშის ეპოსიც?',
      answers: [
        { text: 'ტიგლათფილესერ I-მა', is_correct: false },
        { text: 'ასურბანიპალმა', is_correct: true },
        { text: 'სარგონ II-მ', is_correct: false },
        { text: 'სინახერიბმა', is_correct: false }
      ]
    },
    {
      text: 'რა იყო ურარტუს სამეფოს მთავარი სატახტო ქალაქი ვანის ტბის პირას?',
      answers: [
        { text: 'არზაშკუნი', is_correct: false },
        { text: 'ტუშპა', is_correct: true },
        { text: 'ხათუსა', is_correct: false },
        { text: 'ერებუნი', is_correct: false }
      ]
    },
    {
      text: 'ურარტუს რომელმა ძლევამოსილმა მეფემ დააფუძნა ძვ.წ. 782 წელს სამხრეთ კავკასიაში მნიშვნელოვანი ფორპოსტი - ციხე-ქალაქი ერებუნი?',
      answers: [
        { text: 'მენიუამ', is_correct: false },
        { text: 'არგიშთი I-მა', is_correct: true },
        { text: 'რუსა I-მა', is_correct: false },
        { text: 'არამუმ', is_correct: false }
      ]
    },
    {
      text: 'ძვ.წ. 714 წელს ასურეთის მეფე სარგონ II-ის ლაშქრობის შედეგად, ურარტუს რომელი უმთავრესი საკულტო ცენტრი დაარბიეს ასურელებმა?',
      answers: [
        { text: 'ტუშპა', is_correct: false },
        { text: 'მუსასირი (ხალდის ტაძარი)', is_correct: true },
        { text: 'არზაშკუნი', is_correct: false },
        { text: 'ერებუნი', is_correct: false }
      ]
    },
    {
      text: 'ძვ.წ. VI საუკუნეში რომელი მომთაბარე ირანულენოვანი ტომების შემოსევებმა დააჩქარა ურარტუს სამეფოს საბოლოო დაცემა და გაქრობა?',
      answers: [
        { text: 'ჰიქსოსების', is_correct: false },
        { text: 'სკვითებისა და კიმერიელების', is_correct: true },
        { text: 'გუთიების', is_correct: false },
        { text: 'არამეელების', is_correct: false }
      ]
    },
    {
      text: 'ურარტუს რომელმა მეფემ დაამარცხა დიაოხის მეფე უტუფურსი და შეიერთა დიაოხის სამხრეთი მიწები (რაც ასახულია ვანის კლდის წარწერაში)?',
      answers: [
        { text: 'არგიშთი I-მა', is_correct: true },
        { text: 'მენიუამ', is_correct: false },
        { text: 'სარდურ II-მ', is_correct: false },
        { text: 'რუსა II-მ', is_correct: false }
      ]
    },
    {
      text: 'დიაოხის საბოლოო განადგურების შემდეგ, ძვ.წ. VIII საუკუნის შუა ხანებში, ურარტუს მეფე სარდურ II-ის ჩრდილოეთის ლაშქრობებისას ურარტუს უშუალო მეტოქე რომელი ქართული გაერთიანება გახდა?',
      answers: [
        { text: 'იბერია', is_correct: false },
        { text: 'კოლხა (კულხა)', is_correct: true },
        { text: 'სასპერები', is_correct: false },
        { text: 'ეგრისი', is_correct: false }
      ]
    }
  ]
};

async function upload() {
  console.log('Inserting quiz 3...');
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .insert([{
      title: quizData.title,
      description: quizData.description,
      status: quizData.status,
      is_active: quizData.is_active
    }])
    .select()
    .single();

  if (quizError) {
    console.error('Error inserting quiz:', quizError);
    process.exit(1);
  }

  console.log(`Quiz 3 inserted successfully with ID: ${quiz.id}`);

  for (let i = 0; i < quizData.questions.length; i++) {
    const qData = quizData.questions[i];
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

    console.log(`Question ${i + 1}/23 inserted with answers.`);
  }

  console.log('SUCCESS_ALL_UPLOADED');

  try {
    fs.unlinkSync(__filename);
  } catch (e) {}
}

upload();
