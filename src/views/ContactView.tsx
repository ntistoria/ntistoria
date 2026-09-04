import { useState, type FC } from 'react';
import { FAQS } from '../data/historyData';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, HelpCircle, ChevronDown, ChevronUp, Facebook, Instagram, Youtube, MessageCircle, Share2 } from 'lucide-react';

export const ContactView: FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setSubmitted(true);
  };

  return (
    <div className="max-w-[1180px] mx-auto space-y-16 pb-20 py-6 px-4 sm:px-6">
      
      {/* Editorial Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[#C79B3A]">
          კონსულტაცია
        </span>
        <h1 className="font-serif font-bold text-4xl sm:text-5xl text-[#0D1B2A]">
          კონსულტაცია
        </h1>
        <p className="text-sm sm:text-base text-[#666666] leading-relaxed">
          გაქვთ შეკითხვები ეროვნული გამოცდებისთვის მომზადების, ონლაინ კურსებისა თუ კერძო გაკვეთილების შესახებ? მოგვწერეთ და მიიღეთ ამომწურავი კონსულტაცია.
        </p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Side: Consultation Form & Contact Details (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Consultation Form */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-[#E6DDCB] shadow-luxury space-y-6">
            <div className="space-y-2 border-b border-[#E6DDCB] pb-4">
              <h2 className="font-serif font-bold text-2xl text-[#0D1B2A]">
                გამოგვიგზავნეთ შეტყობინება
              </h2>
              <p className="text-xs text-[#666666]">
                შეავსეთ ფორმა და ჩვენი გუნდი უახლოეს 24 საათში დაგიკავშირდებათ.
              </p>
            </div>

            {submitted ? (
              <div className="p-8 text-center bg-[#F5F2EA] rounded-xl border border-[#C79B3A] space-y-4 animate-in fade-in duration-300">
                <div className="w-14 h-14 rounded-full bg-[#C79B3A]/20 text-[#C79B3A] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-serif font-bold text-xl text-[#0D1B2A]">
                  შეტყობინება წარმატებით გაიგზავნა!
                </h3>
                <p className="text-xs text-[#666666] max-w-sm mx-auto leading-relaxed">
                  გმადლობთ დაინტერესებისთვის. ნოდარ მასწავლებელი მალე დაგიკავშირდებათ მითითებულ ელ.ფოსტაზე.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', subject: '', message: '' });
                  }}
                  className="text-xs font-semibold text-[#13253D] underline hover:text-[#C79B3A] cursor-pointer"
                >
                  ახალი შეტყობინების გაგზავნა
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#0D1B2A] block">
                      სახელი და გვარი *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="მაგ: გიორგი ბერიძე"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-4 py-3 text-xs font-medium text-[#0D1B2A] focus:outline-none focus:border-[#C79B3A]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#0D1B2A] block">
                      ელ.ფოსტა *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="giorgi@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-4 py-3 text-xs font-medium text-[#0D1B2A] focus:outline-none focus:border-[#C79B3A]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0D1B2A] block">
                    თემა
                  </label>
                  <input
                    type="text"
                    placeholder="მაგ: საგამოცდო კურსზე ჩაწერა / კერძო გაკვეთილები"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl px-4 py-3 text-xs font-medium text-[#0D1B2A] focus:outline-none focus:border-[#C79B3A]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#0D1B2A] block">
                    შეტყობინება *
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="ჩაწერეთ თქვენი შეკითხვა..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-[#FAF8F3] border border-[#E6DDCB] rounded-xl p-4 text-xs font-medium text-[#0D1B2A] focus:outline-none focus:border-[#C79B3A] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#C79B3A] hover:bg-[#D4AF37] text-[#0D1B2A] font-semibold text-sm py-3.5 rounded-xl shadow-sm transition-all cursor-pointer active:scale-[0.99]"
                >
                  <Send className="w-4 h-4 text-[#0D1B2A]" />
                  <span>შეტყობინების გაგზავნა</span>
                </button>
              </form>
            )}
          </div>

          {/* Contact & Consultation Details Box */}
          <div className="bg-[#0D1B2A] text-[#FAF8F3] p-8 rounded-2xl border border-[#0D1B2A] shadow-xl space-y-6">
            <h3 className="font-serif font-bold text-2xl text-[#FAF8F3] border-b border-[#FAF8F3]/10 pb-4">
              საკონტაქტო ინფორმაცია
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-[#FAF8F3]/80">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#C79B3A]/20 text-[#C79B3A] flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#C79B3A] uppercase tracking-wider">მისამართი</div>
                  <div className="text-sm mt-0.5">თბილისი, ვაზისუბნის დასახლება</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#C79B3A]/20 text-[#C79B3A] flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#C79B3A] uppercase tracking-wider">ტელეფონი</div>
                  <div className="text-sm mt-0.5">574 122 193</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#C79B3A]/20 text-[#C79B3A] flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#C79B3A] uppercase tracking-wider">ელ.ფოსტა</div>
                  <div className="text-sm mt-0.5">ntistoria@gmail.com</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#C79B3A]/20 text-[#C79B3A] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#C79B3A] uppercase tracking-wider">საათები</div>
                  <div className="text-sm mt-0.5">ორშ - შაბ: 10:00 - 19:00</div>
                </div>
              </div>
            </div>

            {/* Social Media Buttons */}
            <div className="pt-4 border-t border-[#FAF8F3]/10 space-y-3">
              <div className="text-xs font-semibold text-[#C79B3A] uppercase tracking-wider flex items-center gap-2">
                <Share2 className="w-3.5 h-3.5" />
                <span>სოციალური ქსელები</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <a
                  href="https://www.facebook.com/profile.php?id=61593642503126"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#FAF8F3]/10 hover:bg-[#C79B3A] text-[#FAF8F3] hover:text-[#0D1B2A] text-xs font-medium transition-all group"
                >
                  <Facebook className="w-4 h-4 text-[#C79B3A] group-hover:text-[#0D1B2A] transition-colors" />
                  <span>Facebook</span>
                </a>
                <a
                  href="https://www.instagram.com/ntistoria/?hl=en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#FAF8F3]/10 hover:bg-[#C79B3A] text-[#FAF8F3] hover:text-[#0D1B2A] text-xs font-medium transition-all group"
                >
                  <Instagram className="w-4 h-4 text-[#C79B3A] group-hover:text-[#0D1B2A] transition-colors" />
                  <span>Instagram</span>
                </a>
                <a
                  href="https://www.tiktok.com/@nt.istoria"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#FAF8F3]/10 hover:bg-[#C79B3A] text-[#FAF8F3] hover:text-[#0D1B2A] text-xs font-medium transition-all group"
                >
                  <svg className="w-4 h-4 fill-current text-[#C79B3A] group-hover:text-[#0D1B2A] transition-colors" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-2.89-2.89c.28 0 .54.04.8.1v-3.52a6.37 6.37 0 1 0 5.54 6.31V9a8.27 8.27 0 0 0 4.84 1.56V7.07a4.83 4.83 0 0 1-1.07-.38z"/>
                  </svg>
                  <span>TikTok</span>
                </a>
                <a
                  href="https://www.youtube.com/@NTIstoria"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#FAF8F3]/10 hover:bg-[#C79B3A] text-[#FAF8F3] hover:text-[#0D1B2A] text-xs font-medium transition-all group"
                >
                  <Youtube className="w-4 h-4 text-[#C79B3A] group-hover:text-[#0D1B2A] transition-colors" />
                  <span>YouTube</span>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Logo Display (5 cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
          
          {/* Logo Showcase Card */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border-2 border-[#E6DDCB] shadow-luxury text-center space-y-6">
            <div className="p-8 rounded-2xl bg-[#FAF8F3] border border-[#E6DDCB] flex items-center justify-center transition-all hover:border-[#C79B3A]/50 shadow-inner">
              <img 
                src="https://enjnwxpzafroxapksdlt.supabase.co/storage/v1/object/public/photos/logooo.png" 
                alt="NT ისტორიის მასწავლებელი ლოგო" 
                className="w-full max-w-[280px] sm:max-w-[320px] h-auto object-contain drop-shadow-md transition-transform duration-500 hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="space-y-2 pt-2">
              <h3 className="font-serif font-bold text-xl text-[#0D1B2A]">
                ნოდარ თოთაძე
              </h3>
              <p className="text-xs text-[#666666]">
                ისტორიის პედაგოგი & საგამოცდო ტრენერი
              </p>
            </div>

            <div className="pt-4 border-t border-[#E6DDCB] flex items-center justify-between text-xs text-[#666666]">
              <span>საგამოცდო მომზადება</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C79B3A]" />
              <span>ინდივიდუალური & ჯგუფური</span>
            </div>
          </div>

          {/* Location Box */}
          <div className="bg-white p-6 rounded-2xl border border-[#E6DDCB] shadow-luxury space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#0D1B2A] uppercase tracking-wider">ლოკაცია</span>
              <span className="text-[10px] text-[#C79B3A] font-medium">თბილისი, ვაზისუბანი</span>
            </div>
            
            <div className="relative rounded-xl overflow-hidden aspect-[16/9] bg-[#F5F2EA] border border-[#E6DDCB] flex items-center justify-center">
              <img 
                src="https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=800&q=80" 
                alt="თბილისი, ვაზისუბნის დასახლება" 
                className="w-full h-full object-cover opacity-70"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B2A]/60 to-transparent" />
              <div className="absolute p-3 rounded-lg bg-[#FAF8F3] border border-[#C79B3A] shadow-md text-center space-y-0.5">
                <MapPin className="w-5 h-5 text-[#C79B3A] mx-auto" />
                <span className="text-[11px] font-bold text-[#0D1B2A] block">ვაზისუბნის დასახლება</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* FAQ Accordion Section */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-[#E6DDCB] shadow-luxury space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#C79B3A]">
            ხშირად დასმული კითხვები
          </span>
          <h2 className="font-serif font-bold text-3xl text-[#0D1B2A]">
            პასუხები თქვენს შეკითხვებზე
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = expandedFaq === index;
            return (
              <div 
                key={index}
                className="rounded-xl border border-[#E6DDCB] bg-[#FAF8F3] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setExpandedFaq(isOpen ? null : index)}
                  className="w-full text-left p-5 font-serif font-bold text-base text-[#0D1B2A] flex items-center justify-between cursor-pointer hover:text-[#C79B3A]"
                >
                  <span className="pr-4">{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-5 h-5 text-[#C79B3A] shrink-0" /> : <ChevronDown className="w-5 h-5 text-[#8A8A8A] shrink-0" />}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-[#666666] leading-relaxed border-t border-[#E6DDCB]/60 pt-3 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
