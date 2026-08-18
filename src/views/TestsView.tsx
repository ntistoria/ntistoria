import React from 'react';
import { HistoryTest } from '../types';
import { TESTS } from '../data/historyData';
import { BookOpen, MapPin, Layers, FileText, Clock, Image as ImageIcon, ArrowRight } from 'lucide-react';

interface TestsViewProps {
  onOpenTest: (test: HistoryTest) => void;
}

export const TestsView: React.FC<TestsViewProps> = ({ onOpenTest }) => {

  // Map each box to a test or custom test payload
  const nationalTestsData: { title: string; subtitle: string; testId: string; icon: React.ReactNode; defaultTest: HistoryTest }[] = [
    {
      title: 'არჩევითპასუხიანი (N1-35 კითხვა)',
      subtitle: 'NAEC სტანდარტის 35 არჩევითპასუხიანი კითხვა',
      testId: 'mcq-1-35',
      icon: <BookOpen className="w-6 h-6 text-[#C79B3A]" />,
      defaultTest: TESTS[0] || {
        id: 'mcq-1-35',
        title: 'არჩევითპასუხიანი (N1-35 კითხვა)',
        category: 'ეროვნული გამოცდები',
        difficulty: 'საგამოცდო',
        timeLimitMinutes: 45,
        questionCount: 35,
        description: 'ეროვნული გამოცდების პირველი ნაწილი: 35 არჩევითპასუხიანი კითხვა ისტორიის ყველა ეპოქიდან.',
        questions: TESTS[0]?.questions || []
      }
    },
    {
      title: 'ისტორიული რუკა (N36)',
      subtitle: 'კარტოგრაფიული დავალება და რუკის ანალიზი',
      testId: 'map-36',
      icon: <MapPin className="w-6 h-6 text-[#C79B3A]" />,
      defaultTest: {
        id: 'map-36',
        title: 'ისტორიული რუკა (N36)',
        category: 'ეროვნული გამოცდები',
        difficulty: 'საგამოცდო',
        timeLimitMinutes: 20,
        questionCount: 5,
        description: 'ისტორიული რუკის კრიტიკული ანალიზი, საზღვრებისა და ლაშქრობების მარშრუტების დადგენა.',
        questions: [
          {
            id: 'm1',
            prompt: 'რუკაზე გამოსახული ლაშქრობების მარშრუტით, რომელ საუკუნეს მიეკუთვნება აღნიშნული მოვლენა?',
            options: ['XI საუკუნე', 'XII საუკუნის I ნახევარი', 'XIII საუკუნე', 'XV საუკუნე'],
            correctAnswerIndex: 1,
            explanation: 'რუკაზე ასახულია დავით IV აღმაშენებლის 1121 წლის დიდგორის კამპანია.'
          }
        ]
      }
    },
    {
      title: 'ანალოგიები (N37)',
      subtitle: 'ისტორიული მოვლენების მიზეზ-შედეგობრივი შედარება',
      testId: 'analogies-37',
      icon: <Layers className="w-6 h-6 text-[#C79B3A]" />,
      defaultTest: {
        id: 'analogies-37',
        title: 'ანალოგიები (N37)',
        category: 'ეროვნული გამოცდები',
        difficulty: 'საგამოცდო',
        timeLimitMinutes: 15,
        questionCount: 5,
        description: 'ისტორიული ანალოგიებისა და ლოგიკური წყვილების დადგენა.',
        questions: [
          {
            id: 'an1',
            prompt: 'დავით IV : დიდგორი = ერეკლე II : ?',
            options: ['მარაბდა', 'კრწანისი', 'ასპინძა', 'ბასიანი'],
            correctAnswerIndex: 2,
            explanation: 'ერეკლე II-ის ერთ-ერთი უმნიშვნელოვანესი გამარჯვება იყო 1770 წლის ასპინძის ბრძოლა.'
          }
        ]
      }
    },
    {
      title: 'ისტორიული წყარო (N38)',
      subtitle: 'პირველწყაროს ტექსტუალური ანალიზი და შეკითხვები',
      testId: 'source-38',
      icon: <FileText className="w-6 h-6 text-[#C79B3A]" />,
      defaultTest: {
        id: 'source-38',
        title: 'ისტორიული წყარო (N38)',
        category: 'ეროვნული გამოცდები',
        difficulty: 'საგამოცდო',
        timeLimitMinutes: 30,
        questionCount: 5,
        description: 'პირველწყაროს დოკუმენტის სიღრმისეული ანალიზი და კრიტიკული შეფასება.',
        questions: [
          {
            id: 'src1',
            prompt: 'წყაროს ავტორი აღწერს: „და დაჯდა მეფედ ქართლსა შინა...“. ვინ არის მოხსენიებული ტექსტში?',
            options: ['ფარნავაზ I', 'ვახტანგ გორგასალი', 'დავით აღმაშენებელი', 'თამარ მეფე'],
            correctAnswerIndex: 0,
            explanation: 'ტექსტი ეხება ქართლის სამეფოს პირველ გაერთიანებას ფარნავაზ I-ის დროს.'
          }
        ]
      }
    }
  ];

  const otherTestsData: { title: string; subtitle: string; testId: string; icon: React.ReactNode; defaultTest: HistoryTest }[] = [
    {
      title: '1. ქრონოლოგია',
      subtitle: 'ისტორიული თარიღებისა და მოვლენების თანმიმდევრობა',
      testId: 'chronology',
      icon: <Clock className="w-6 h-6 text-[#C79B3A]" />,
      defaultTest: {
        id: 'chronology',
        title: 'ქრონოლოგიური ტესტები',
        category: 'სხვა ტესტები',
        difficulty: 'საშუალო',
        timeLimitMinutes: 20,
        questionCount: 10,
        description: 'ისტორიული მოვლენების სწორი ქრონოლოგიური თანმიმდევრობით დალაგება.',
        questions: [
          {
            id: 'chr1',
            prompt: 'დაალაგეთ ქრონოლოგიურად: 1. დიდგორის ბრძოლა, 2. ქრისტიანობის მიღება ქართლში, 3. გეორგიევსკის ტრაქტატი',
            options: ['2, 1, 3', '1, 2, 3', '3, 2, 1', '2, 3, 1'],
            correctAnswerIndex: 0,
            explanation: 'ქრისტიანობის მიღება (326 წ.), დიდგორი (1121 წ.), გეორგიევსკის ტრაქტატი (1783 წ.).'
          }
        ]
      }
    },
    {
      title: '2. ილუსტრაციები',
      subtitle: 'ვიზუალური წყაროების, არტეფაქტებისა და ფოტოების ანალიზი',
      testId: 'illustrations',
      icon: <ImageIcon className="w-6 h-6 text-[#C79B3A]" />,
      defaultTest: {
        id: 'illustrations',
        title: 'ილუსტრაციების ტესტები',
        category: 'სხვა ტესტები',
        difficulty: 'საშუალო',
        timeLimitMinutes: 20,
        questionCount: 10,
        description: 'ისტორიული არტეფაქტების, მონეტებისა და ილუსტრაციების ცნობა და ანალიზი.',
        questions: [
          {
            id: 'ill1',
            prompt: 'რომელი ეპოქის არტეფაქტია კოლხური ოქროს სამკაულები ვანიდან?',
            options: ['ანტიკური ხანა (ძვ.წ. V-IV სს.)', 'შუა საუკუნეები', 'ბრინჯაოს ხანა', 'ახალი დრო'],
            correctAnswerIndex: 0,
            explanation: 'ვანის არქეოლოგიური გათხრები მიეკუთვნება ანტიკური კოლხეთის ხანას.'
          }
        ]
      }
    }
  ];

  return (
    <div className="max-w-[1180px] mx-auto space-y-16 pb-20 pt-6 px-4 sm:px-6">
      
      {/* Editorial Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[#C79B3A]">
          თვითშეფასებისთვის
        </span>
        <h1 className="font-serif font-bold text-4xl sm:text-5xl text-[#0D1B2A]">
          ისტორიის ტესტები
        </h1>
      </div>

      {/* Section 1: ეროვნულის ტესტები */}
      <div className="space-y-6">
        <div className="border-b border-[#E6DDCB] pb-4">
          <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#0D1B2A]">
            ეროვნულის ტესტები:
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {nationalTestsData.map((item) => (
            <div
              key={item.testId}
              onClick={() => onOpenTest(item.defaultTest)}
              className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E6DDCB] shadow-sm hover:border-[#C79B3A] hover:shadow-md transition-all cursor-pointer group flex items-start gap-6"
            >
              <div className="w-14 h-14 rounded-xl bg-[#F5F2EA] border border-[#E6DDCB] flex items-center justify-center shrink-0 group-hover:bg-[#C79B3A] group-hover:text-white transition-colors">
                {item.icon}
              </div>

              <div className="space-y-2 flex-1">
                <h3 className="font-serif font-bold text-xl text-[#0D1B2A] group-hover:text-[#C79B3A] transition-colors leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-[#666666] leading-relaxed">
                  {item.subtitle}
                </p>
                <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-[#C79B3A]">
                  <span>ტესტის დაწყება</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: სხვა ტესტები */}
      <div className="space-y-6">
        <div className="border-b border-[#E6DDCB] pb-4">
          <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#0D1B2A]">
            სხვა ტესტები
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {otherTestsData.map((item) => (
            <div
              key={item.testId}
              onClick={() => onOpenTest(item.defaultTest)}
              className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E6DDCB] shadow-sm hover:border-[#C79B3A] hover:shadow-md transition-all cursor-pointer group flex items-start gap-6"
            >
              <div className="w-14 h-14 rounded-xl bg-[#F5F2EA] border border-[#E6DDCB] flex items-center justify-center shrink-0 group-hover:bg-[#C79B3A] group-hover:text-white transition-colors">
                {item.icon}
              </div>

              <div className="space-y-2 flex-1">
                <h3 className="font-serif font-bold text-xl text-[#0D1B2A] group-hover:text-[#C79B3A] transition-colors leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-[#666666] leading-relaxed">
                  {item.subtitle}
                </p>
                <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-[#C79B3A]">
                  <span>ტესტის დაწყება</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
