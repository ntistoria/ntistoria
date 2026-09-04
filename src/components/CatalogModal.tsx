import { type FC } from 'react';
import { X, GraduationCap, BookOpen, Award, CheckCircle2, ExternalLink } from 'lucide-react';

interface CatalogModalProps {
  type: 'universities' | 'colleges' | 'programs' | null;
  onClose: () => void;
}

export const CatalogModal: FC<CatalogModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  const getContent = () => {
    switch (type) {
      case 'universities':
        return {
          title: 'უმაღლესი სასწავლებლების კატალოგი',
          subtitle: 'საქართველოს წამყვანი უნივერსიტეტების სია და საგამოცდო კოეფიციენტები',
          icon: <GraduationCap className="w-7 h-7 text-[#C79B3A]" />,
          items: [
            {
              name: 'ივანე ჯავახიშვილის სახელობის თბილისის სახელმწიფო უნივერსიტეტი (თსუ)',
              code: '001',
              faculty: 'ჰუმანიტარულ მეცნიერებათა ფაკულტეტი / ისტორია',
              details: 'სავალდებულო საგანი: ისტორია (მინიმალური ზღვარი 45%+).',
            },
            {
              name: 'ილიას სახელმწიფო უნივერსიტეტი (ილიაუნი)',
              code: '010',
              faculty: 'მეცნიერებათა და ხელოვნების ფაკულტეტი',
              details: 'ისტორიის საგამოცდო კოეფიციენტი: 4.0.',
            },
            {
              name: 'საქართველოს ტექნიკური უნივერსიტეტი (სტუ)',
              code: '003',
              faculty: 'საჯარო მართვისა და პოლიტიკის ფაკულტეტი',
              details: 'ისტორია და სამოქალაქო განათლება.',
            },
            {
              name: 'კავკასიის უნივერსიტეტი (CU)',
              code: '120',
              faculty: 'ჰუმანიტარულ და სოციალურ მეცნიერებათა სკოლა',
              details: 'მაღალი აკადემიური სტანდარტის პროგრამები.',
            },
          ]
        };

      case 'colleges':
        return {
          title: 'პროფესიული კოლეჯების კატალოგი',
          subtitle: 'საქართველოს ავტორიზებული პროფესიული სასწავლებლები',
          icon: <BookOpen className="w-7 h-7 text-[#C79B3A]" />,
          items: [
            {
              name: 'საზოგადოებრივი კოლეჯი „მერმისი“',
              code: 'COL-01',
              faculty: 'კულტურული მემკვიდრეობა და გიდობა',
              details: 'ტურისტული გიდის პროფესიული პროგრამა ისტორიული მოდულებით.',
            },
            {
              name: 'კოლეჯი „სპექტრი“',
              code: 'COL-02',
              faculty: 'არქეოლოგიური ასისტენტი & რესტავრაცია',
              details: 'ისტორიული ძეგლების დაცვისა და რესტავრაციის საფუძვლები.',
            },
            {
              name: 'კოლეჯი „იკაროსი“',
              code: 'COL-03',
              faculty: 'ტურიზმისა და მასპინძლობის მენეჯმენტი',
              details: 'საქართველოს ისტორიისა და გეოგრაფიის ინტენსიური კურსი.',
            },
          ]
        };

      case 'programs':
        return {
          title: 'პროგრამების კატალოგი 2026',
          subtitle: 'შეფასებისა და გამოცდების ეროვნული ცენტრის (NAEC) 2026 წლის პროგრამა',
          icon: <Award className="w-7 h-7 text-[#C79B3A]" />,
          items: [
            {
              name: 'ძველი მსოფლიოსა და ანტიკური ხანის ისტორია',
              code: 'PRG-2026-01',
              faculty: 'შუმერი, ეგვიპტე, ხეთები, საბერძნეთი, რომი და კოლხეთი/იბერია',
              details: 'ძირითადი თარიღები, ბრძოლები და კულტურული მემკვიდრეობა.',
            },
            {
              name: 'შუა საუკუნეების საქართველოსა და მსოფლიო ისტორია',
              code: 'PRG-2026-02',
              faculty: 'არაბობა, ფეოდალური დაშლილობა, დავით IV, თამარ მეფე, მონღოლები',
              details: 'წყაროების ანალიზი და რუკების კრიტიკული დამუშავება.',
            },
            {
              name: 'ახალი და უახლესი ისტორია (XIX-XXI სს.)',
              code: 'PRG-2026-03',
              faculty: 'თერგდალეულები, 1918-1921 წწ. დემოკრატიული რესპუბლიკა, საბჭოთა ოკუპაცია',
              details: 'დამოუკიდებლობის აღდგენა და თანამედროვე გამოწვევები.',
            },
          ]
        };
      default:
        return null;
    }
  };

  const data = getContent();
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-[#E6DDCB] shadow-2xl rounded-2xl overflow-hidden p-6 sm:p-8 space-y-6 max-h-[90vh] flex flex-col">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#8A8A8A] hover:text-[#13253D] hover:bg-[#F5F2EA] rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 border-b border-[#E6DDCB] pb-4">
          <div className="w-12 h-12 rounded-xl bg-[#F5F2EA] border border-[#E6DDCB] flex items-center justify-center shrink-0">
            {data.icon}
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#13253D]">
              {data.title}
            </h2>
            <p className="text-xs text-[#666666] mt-0.5">
              {data.subtitle}
            </p>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {data.items.map((item, idx) => (
            <div key={idx} className="p-4 bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl space-y-2 hover:border-[#C79B3A] transition-colors">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-serif font-bold text-base text-[#13253D]">
                  {item.name}
                </h3>
                <span className="text-[10px] font-mono font-bold bg-[#13253D] text-[#FAF8F3] px-2.5 py-0.5 rounded">
                  {item.code}
                </span>
              </div>
              <p className="text-xs font-semibold text-[#C79B3A]">
                {item.faculty}
              </p>
              <p className="text-xs text-[#666666] leading-relaxed">
                {item.details}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#E6DDCB] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#13253D] hover:bg-[#C79B3A] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
          >
            დახურვა
          </button>
        </div>

      </div>
    </div>
  );
};
