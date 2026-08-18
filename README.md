# 🏛️ NT ისტორიის მასწავლებელი (NT History Platform)

მაღალი აკადემიური სტანდარტის ისტორიის საგანმანათლებლო პლატფორმა, რომელიც განკუთვნილია ეროვნული გამოცდებისთვის მომზადებისთვის, ისტორიული წყაროების შესასწავლად, ვიდეო გაკვეთილების საყურებლად და ინტერაქტიული ტესტების გასავლელად.

---

## ✨ ფუნქციონალი (Features)

- **📚 ისტორიული ეპოქები და სტატიები:** საქართველოსა და მსოფლიო ისტორიის დეტალური მასალები.
- **📝 ინტერაქტიული ტესტები:** ეროვნული გამოცდების ფორმატის ტესტები დროის კონტროლითა და ქულების დათვლით.
- **🎥 ვიდეო გაკვეთილები:** ვიდეო კურსები და თემატური ვიდეო ლექციები.
- **🔐 ავტორიზაცია & Supabase ინტეგრაცია:** მომხმარებლის რეგისტრაცია/ავტორიზაცია.
- **🔍 ძიება & ფილტრაცია:** სტატიების, ტესტებისა და ვიდეოების სწრაფი ძიება.

---

## 🛠️ ტექნოლოგიური სტეკი (Tech Stack)

- **Frontend:** React 19, TypeScript, Vite
- **Styling & Motion:** TailwindCSS v4, Lucide Icons, Framer Motion
- **Backend & Database:** Supabase (Auth & Storage)

---

## 🚀 ლოკალურად გაშვება (Getting Started)

### 1. წინაპირობები (Prerequisites)
- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/)

### 2. ინსტალაცია (Installation)

```bash
# რეპოზიტორიის კლონირება
git clone https://github.com/YOUR_USERNAME/ntistoria.git
cd ntistoria

# დამოკიდებულებების დაყენება
npm install
```

### 3. გარემოს ცვლადები (.env Setup)

შექმენით `.env` ფაილი პროექტის ძირში (`.env.example`-ის მიხედვით):

```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

### 4. პროექტის გაშვება (Run Development Server)

```bash
npm run dev
```

პროექტი გაეშვება მისამართზე: `http://localhost:3000`

---

## 📜 სკრიპტები (Available Scripts)

- `npm run dev` - დეველოპმენტ სერვერის გაშვება (Port 3000)
- `npm run build` - პროექტის პროდაქშენ ბილდის შექმნა
- `npm run preview` - პროდაქშენ ბილდის ლოკალური გადახედვა
- `npm run lint` - TypeScript-ის ტიპების შემოწმება (`tsc --noEmit`)
- `npm run clean` - `dist` საქაღალდის გასუფთავება

