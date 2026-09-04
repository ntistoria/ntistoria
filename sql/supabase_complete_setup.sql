-- ====================================================================
-- NT ISTORIA — COMPLETE SUPABASE SETUP SCRIPT
-- Run this ONCE in your Supabase SQL Editor:
-- https://supabase.com/dashboard → Your Project → SQL Editor
-- ====================================================================

-- ============================================================
-- SECTION 1: ARTICLES TABLE (Blog Posts)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.articles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  slug TEXT,
  excerpt TEXT,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'საქართველოს ისტორია',
  author TEXT DEFAULT 'ნოდარ თოთაძე',
  date TEXT DEFAULT CURRENT_DATE::text,
  image_url TEXT,
  featured BOOLEAN DEFAULT FALSE,
  tags JSONB DEFAULT '["ისტორია"]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and open policies for articles
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for articles" ON public.articles;
CREATE POLICY "Enable all access for articles"
  ON public.articles FOR ALL
  USING (true)
  WITH CHECK (true);
GRANT ALL ON TABLE public.articles TO anon, authenticated, service_role;

-- ============================================================
-- SECTION 2: USER PROGRESS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_progress (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL UNIQUE,
  progress_json JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for user_progress" ON public.user_progress;
CREATE POLICY "Enable all access for user_progress"
  ON public.user_progress FOR ALL
  USING (true)
  WITH CHECK (true);
GRANT ALL ON TABLE public.user_progress TO anon, authenticated, service_role;

-- ============================================================
-- SECTION 3: TEST QUESTION TABLES
-- Multiple choice, maps, analogies, source analysis, 
-- chronology, illustrations in the PUBLIC schema
-- ============================================================

-- 3a. Multiple Choice Questions (N1-35)
CREATE TABLE IF NOT EXISTS public.multiple_choice_questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  chapter_id TEXT NOT NULL DEFAULT 'ch-1',
  prompt TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '["ა", "ბ", "გ", "დ"]'::jsonb,
  correct_answer_index INTEGER NOT NULL DEFAULT 0,
  explanation TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3b. Map Questions (N36)
CREATE TABLE IF NOT EXISTS public.maps_questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  chapter_id TEXT NOT NULL DEFAULT 'ch-1',
  prompt TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '["ა", "ბ", "გ", "დ"]'::jsonb,
  correct_answer_index INTEGER NOT NULL DEFAULT 0,
  map_image TEXT DEFAULT '',
  explanation TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3c. Analogy Questions (N37)
CREATE TABLE IF NOT EXISTS public.analogy_questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  chapter_id TEXT NOT NULL DEFAULT 'ch-1',
  prompt TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '["ა", "ბ", "გ", "დ"]'::jsonb,
  correct_answer_index INTEGER NOT NULL DEFAULT 0,
  explanation TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3d. Source Analysis Questions (N38)
CREATE TABLE IF NOT EXISTS public.source_questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  chapter_id TEXT NOT NULL DEFAULT 'ch-1',
  prompt TEXT NOT NULL,
  source_context TEXT DEFAULT '',
  options JSONB NOT NULL DEFAULT '["ა", "ბ", "გ", "დ"]'::jsonb,
  correct_answer_index INTEGER NOT NULL DEFAULT 0,
  explanation TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3e. Chronology Questions
CREATE TABLE IF NOT EXISTS public.chronology_questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  chapter_id TEXT NOT NULL DEFAULT 'ch-1',
  prompt TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '["ა", "ბ", "გ", "დ"]'::jsonb,
  correct_answer_index INTEGER NOT NULL DEFAULT 0,
  explanation TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3f. Illustration Questions
CREATE TABLE IF NOT EXISTS public.illustration_questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  chapter_id TEXT NOT NULL DEFAULT 'ch-1',
  prompt TEXT NOT NULL,
  map_image TEXT DEFAULT '',
  options JSONB NOT NULL DEFAULT '["ა", "ბ", "გ", "დ"]'::jsonb,
  correct_answer_index INTEGER NOT NULL DEFAULT 0,
  explanation TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 4: APPLY RLS + GRANTS TO ALL TEST TABLES
-- ============================================================

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'multiple_choice_questions',
    'maps_questions',
    'analogy_questions',
    'source_questions',
    'chronology_questions',
    'illustration_questions'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Public read write %I" ON public.%I;', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY "Public read write %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);',
      tbl, tbl
    );
    EXECUTE format('GRANT ALL ON TABLE public.%I TO anon, authenticated, service_role;', tbl);
  END LOOP;
END $$;

-- ============================================================
-- SECTION 5: STORAGE BUCKET FOR IMAGES
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Read Access Photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Access Photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Access Photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Access Photos" ON storage.objects;

CREATE POLICY "Public Read Access Photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

CREATE POLICY "Public Insert Access Photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Public Update Access Photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'photos');

CREATE POLICY "Public Delete Access Photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'photos');

-- ============================================================
-- SECTION 6: VERIFY SETUP
-- Run this to check that all tables exist
-- ============================================================
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'articles',
    'user_progress',
    'multiple_choice_questions',
    'maps_questions',
    'analogy_questions',
    'source_questions',
    'chronology_questions',
    'illustration_questions'
  )
ORDER BY table_name;
