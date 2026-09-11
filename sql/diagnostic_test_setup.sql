-- ====================================================================
-- სადიაგნოსტიკო ტესტი N1 — SUPABASE SQL SETUP
-- NT ისტორია — ntistoria.ge
--
-- გაუშვით ეს სქრიპტი Supabase SQL Editor-ში.
-- რუკის URL: ატვირთეთ photos bucket-ში, შემდეგ ჩასვით
--   public URL diagnostic_questions-ში map_url სვეტში.
-- ====================================================================

-- ====================================================================
-- 1. DIAGNOSTIC_QUESTIONS — ტესტის კითხვები
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.diagnostic_questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id         TEXT NOT NULL DEFAULT 'diagnostic-1',
  section         TEXT NOT NULL,         -- 'I', 'II', 'III', 'IV'
  section_title   TEXT,                  -- სექციის სრული სათაური
  question_order  INT  NOT NULL,         -- კითხვის ნომერი (1,2,3...)
  question_text   TEXT NOT NULL,         -- კითხვის ტექსტი
  question_type   TEXT NOT NULL,         -- 'multiple_choice' | 'open_text'
  max_points      INT  NOT NULL DEFAULT 1,
  options         JSONB,                 -- ["A. ...", "B. ...", "C. ...", "D. ..."]
  map_url         TEXT,                  -- photos bucket-ის public URL (სურ.)
  source_text     TEXT,                  -- ისტორიული წყაროს ტექსტი (IV ნაწ.)
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 2. DIAGNOSTIC_ATTEMPTS — მოსწავლის attempt
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.diagnostic_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id       TEXT NOT NULL DEFAULT 'diagnostic-1',
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email    TEXT NOT NULL,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- timer-ის დაწყება
  submitted_at  TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress'|'submitted'|'graded'
  total_score   INT,                                 -- admin-ის მიერ საბოლოო ქულა
  max_score     INT NOT NULL DEFAULT 40,
  graded_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 3. DIAGNOSTIC_ANSWERS — მოსწავლის პასუხები
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.diagnostic_answers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id      UUID NOT NULL REFERENCES public.diagnostic_attempts(id) ON DELETE CASCADE,
  question_id     UUID NOT NULL REFERENCES public.diagnostic_questions(id) ON DELETE CASCADE,
  answer_text     TEXT,                 -- მოსწავლის პასუხი
  points_awarded  INT,                  -- admin-ის მინიჭებული ქულა (NULL სანამ არ შეფასდება)
  teacher_comment TEXT,                 -- მასწავლებლის კომენტარი
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(attempt_id, question_id)
);

-- ====================================================================
-- 4. ROW LEVEL SECURITY
-- ====================================================================

ALTER TABLE public.diagnostic_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_attempts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_answers   ENABLE ROW LEVEL SECURITY;

-- diagnostic_questions: ნებისმიერ ავტორიზებულ მომხმარებელს შეუძლია კითხვების წაკითხვა
DROP POLICY IF EXISTS "Authenticated read diagnostic_questions" ON public.diagnostic_questions;
CREATE POLICY "Authenticated read diagnostic_questions"
  ON public.diagnostic_questions
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admin: სრული წვდომა კითხვებზე
DROP POLICY IF EXISTS "Admin full access diagnostic_questions" ON public.diagnostic_questions;
CREATE POLICY "Admin full access diagnostic_questions"
  ON public.diagnostic_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- diagnostic_attempts: სტუდენტი მხოლოდ საკუთარ attempt-ებს ხედავს/ქმნის
DROP POLICY IF EXISTS "Student own attempts select"  ON public.diagnostic_attempts;
DROP POLICY IF EXISTS "Student own attempts insert"  ON public.diagnostic_attempts;
DROP POLICY IF EXISTS "Student own attempts update"  ON public.diagnostic_attempts;
DROP POLICY IF EXISTS "Admin all attempts"           ON public.diagnostic_attempts;

CREATE POLICY "Student own attempts select"
  ON public.diagnostic_attempts
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Student own attempts insert"
  ON public.diagnostic_attempts
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Student own attempts update"
  ON public.diagnostic_attempts
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin all attempts"
  ON public.diagnostic_attempts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- diagnostic_answers: სტუდენტი მხოლოდ საკუთარი attempt-ის პასუხებს ხედავს
DROP POLICY IF EXISTS "Student own answers select"  ON public.diagnostic_answers;
DROP POLICY IF EXISTS "Student own answers insert"  ON public.diagnostic_answers;
DROP POLICY IF EXISTS "Student own answers update"  ON public.diagnostic_answers;
DROP POLICY IF EXISTS "Admin all answers"           ON public.diagnostic_answers;

CREATE POLICY "Student own answers select"
  ON public.diagnostic_answers
  FOR SELECT
  USING (
    attempt_id IN (
      SELECT id FROM public.diagnostic_attempts
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Student own answers insert"
  ON public.diagnostic_answers
  FOR INSERT
  WITH CHECK (
    attempt_id IN (
      SELECT id FROM public.diagnostic_attempts
      WHERE user_id = auth.uid()
    )
  );

-- სტუდენტმა პასუხი მხოლოდ in_progress status-ზე შეიძლება შეცვალოს
CREATE POLICY "Student own answers update"
  ON public.diagnostic_answers
  FOR UPDATE
  USING (
    attempt_id IN (
      SELECT id FROM public.diagnostic_attempts
      WHERE user_id = auth.uid()
        AND status = 'in_progress'
    )
  );

CREATE POLICY "Admin all answers"
  ON public.diagnostic_answers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ====================================================================
-- 5. GRANTS
-- ====================================================================
GRANT SELECT ON public.diagnostic_questions TO authenticated;
GRANT ALL    ON public.diagnostic_attempts  TO authenticated;
GRANT ALL    ON public.diagnostic_answers   TO authenticated;

-- ====================================================================
-- 6. კითხვების INSERT
-- შეავსეთ question_text, options, max_points თქვენი კითხვებით.
-- რუკის URL: photos bucket-ზე upload-ის შემდეგ ჩასვით map_url-ში.
-- მაგ: 'https://enjnwxpzafroxapksdlt.supabase.co/storage/v1/object/public/photos/map-n1.jpg'
-- ====================================================================

-- I ნაწილი — არჩევითპასუხიანი კითხვები (10 კითხვა × 1 ქულა = 10 ქულა)
INSERT INTO public.diagnostic_questions
  (test_id, section, section_title, question_order, question_type, question_text, max_points, options)
VALUES
('diagnostic-1','I','I ნაწილი — არჩევითპასუხიანი კითხვები',1,'multiple_choice','კითხვა 1 — ჩაწერეთ ტექსტი',1,'["A. ვარიანტი ა","B. ვარიანტი ბ","C. ვარიანტი გ","D. ვარიანტი დ"]'),
('diagnostic-1','I','I ნაწილი — არჩევითპასუხიანი კითხვები',2,'multiple_choice','კითხვა 2 — ჩაწერეთ ტექსტი',1,'["A. ვარიანტი ა","B. ვარიანტი ბ","C. ვარიანტი გ","D. ვარიანტი დ"]'),
('diagnostic-1','I','I ნაწილი — არჩევითპასუხიანი კითხვები',3,'multiple_choice','კითხვა 3 — ჩაწერეთ ტექსტი',1,'["A. ვარიანტი ა","B. ვარიანტი ბ","C. ვარიანტი გ","D. ვარიანტი დ"]'),
('diagnostic-1','I','I ნაწილი — არჩევითპასუხიანი კითხვები',4,'multiple_choice','კითხვა 4 — ჩაწერეთ ტექსტი',1,'["A. ვარიანტი ა","B. ვარიანტი ბ","C. ვარიანტი გ","D. ვარიანტი დ"]'),
('diagnostic-1','I','I ნაწილი — არჩევითპასუხიანი კითხვები',5,'multiple_choice','კითხვა 5 — ჩაწერეთ ტექსტი',1,'["A. ვარიანტი ა","B. ვარიანტი ბ","C. ვარიანტი გ","D. ვარიანტი დ"]'),
('diagnostic-1','I','I ნაწილი — არჩევითპასუხიანი კითხვები',6,'multiple_choice','კითხვა 6 — ჩაწერეთ ტექსტი',1,'["A. ვარიანტი ა","B. ვარიანტი ბ","C. ვარიანტი გ","D. ვარიანტი დ"]'),
('diagnostic-1','I','I ნაწილი — არჩევითპასუხიანი კითხვები',7,'multiple_choice','კითხვა 7 — ჩაწერეთ ტექსტი',1,'["A. ვარიანტი ა","B. ვარიანტი ბ","C. ვარიანტი გ","D. ვარიანტი დ"]'),
('diagnostic-1','I','I ნაწილი — არჩევითპასუხიანი კითხვები',8,'multiple_choice','კითხვა 8 — ჩაწერეთ ტექსტი',1,'["A. ვარიანტი ა","B. ვარიანტი ბ","C. ვარიანტი გ","D. ვარიანტი დ"]'),
('diagnostic-1','I','I ნაწილი — არჩევითპასუხიანი კითხვები',9,'multiple_choice','კითხვა 9 — ჩაწერეთ ტექსტი',1,'["A. ვარიანტი ა","B. ვარიანტი ბ","C. ვარიანტი გ","D. ვარიანტი დ"]'),
('diagnostic-1','I','I ნაწილი — არჩევითპასუხიანი კითხვები',10,'multiple_choice','კითხვა 10 — ჩაწერეთ ტექსტი',1,'["A. ვარიანტი ა","B. ვარიანტი ბ","C. ვარიანტი გ","D. ვარიანტი დ"]');

-- II ნაწილი — ისტორიული რუკის დავალება
-- !! map_url-ში ჩასვით photos bucket-ის public URL !!
INSERT INTO public.diagnostic_questions
  (test_id, section, section_title, question_order, question_type, question_text, max_points, options, map_url)
VALUES
('diagnostic-1','II','II ნაწილი — ისტორიული რუკის დავალება',11,'multiple_choice','კითხვა 11 — რუკაზე დაყრდნობით (MC)',2,'["A. ვარიანტი ა","B. ვარიანტი ბ","C. ვარიანტი გ","D. ვარიანტი დ"]','REPLACE_WITH_YOUR_MAP_URL'),
('diagnostic-1','II','II ნაწილი — ისტორიული რუკის დავალება',12,'open_text','კითხვა 12 — რუკაზე დაყრდნობით (ღია)',3,NULL,'REPLACE_WITH_YOUR_MAP_URL'),
('diagnostic-1','II','II ნაწილი — ისტორიული რუკის დავალება',13,'open_text','კითხვა 13 — რუკაზე დაყრდნობით (ღია)',5,NULL,'REPLACE_WITH_YOUR_MAP_URL');

-- III ნაწილი — ისტორიული მოვლენის/პროცესის ანალიზი
INSERT INTO public.diagnostic_questions
  (test_id, section, section_title, question_order, question_type, question_text, max_points)
VALUES
('diagnostic-1','III','III ნაწილი — ისტორიული მოვლენის/პროცესის ანალიზი',14,'open_text','კითხვა 14 — ჩაწერეთ ტექსტი',5),
('diagnostic-1','III','III ნაწილი — ისტორიული მოვლენის/პროცესის ანალიზი',15,'open_text','კითხვა 15 — ჩაწერეთ ტექსტი',5),
('diagnostic-1','III','III ნაწილი — ისტორიული მოვლენის/პროცესის ანალიზი',16,'open_text','კითხვა 16 — ჩაწერეთ ტექსტი',5);

-- IV ნაწილი — ისტორიული წყაროს ანალიზი
-- source_text ველში ჩასვით ისტორიული წყაროს ტექსტი
INSERT INTO public.diagnostic_questions
  (test_id, section, section_title, question_order, question_type, question_text, max_points, source_text)
VALUES
('diagnostic-1','IV','IV ნაწილი — ისტორიული წყაროს ანალიზი',17,'open_text','კითხვა 17 — ჩაწერეთ ტექსტი',3,'ჩასვით ისტორიული წყაროს ტექსტი...'),
('diagnostic-1','IV','IV ნაწილი — ისტორიული წყაროს ანალიზი',18,'open_text','კითხვა 18 — ჩაწერეთ ტექსტი',3,'ჩასვით ისტორიული წყაროს ტექსტი...'),
('diagnostic-1','IV','IV ნაწილი — ისტორიული წყაროს ანალიზი',19,'open_text','კითხვა 19 — ჩაწერეთ ტექსტი',5,'ჩასვით ისტორიული წყაროს ტექსტი...'),
('diagnostic-1','IV','IV ნაწილი — ისტორიული წყაროს ანალიზი',20,'open_text','კითხვა 20 — ჩაწერეთ ტექსტი',5,'ჩასვით ისტორიული წყაროს ტექსტი...');

-- ====================================================================
-- 7. profiles ცხრილის შემოწმება (RLS user_id-ისთვის)
-- ====================================================================
-- თუ profiles.user_id სვეტი არ არსებობს:
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS
--   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- admin role-ის მინიჭება:
-- UPDATE public.profiles SET role = 'admin'
--   WHERE email = 'ntistoria@gmail.com';
-- ====================================================================
