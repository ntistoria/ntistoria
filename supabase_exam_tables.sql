-- ====================================================================
-- NTISTORIA HISTORY EXAM DATABASE DDL FOR SUPABASE
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- to create all test tables in public schema with instant read access!
-- ====================================================================

-- 1. Create EXAM PROGRAMS table (11 Chapters)
CREATE TABLE IF NOT EXISTS public.exam_programs (
  id TEXT PRIMARY KEY,
  chapter_number INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create EXAM SUBPROGRAMS table
CREATE TABLE IF NOT EXISTS public.exam_subprograms (
  id TEXT PRIMARY KEY,
  program_id TEXT REFERENCES public.exam_programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create MULTIPLE CHOICE QUESTIONS (N1-N38)
CREATE TABLE IF NOT EXISTS public.multiple_choice_questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  chapter_id TEXT,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL, -- e.g. ["option A", "option B", "option C", "option D"]
  correct_answer_index INT NOT NULL DEFAULT 0,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create MAPS table
CREATE TABLE IF NOT EXISTS public.maps (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT,
  map_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create MAP QUESTIONS table
CREATE TABLE IF NOT EXISTS public.maps_questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  chapter_id TEXT,
  map_id TEXT REFERENCES public.maps(id) ON DELETE SET NULL,
  map_url TEXT,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer_index INT NOT NULL DEFAULT 0,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create ANALOGIES & ANALOGY QUESTIONS table
CREATE TABLE IF NOT EXISTS public.analogies (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.analogy_questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  chapter_id TEXT,
  analogy_id TEXT REFERENCES public.analogies(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer_index INT NOT NULL DEFAULT 0,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create SOURCES & SOURCE QUESTIONS table
CREATE TABLE IF NOT EXISTS public.sources (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.source_questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  chapter_id TEXT,
  source_id TEXT REFERENCES public.sources(id) ON DELETE SET NULL,
  source_context TEXT,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer_index INT NOT NULL DEFAULT 0,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create CHRONOLOGY QUESTIONS table (Independent)
CREATE TABLE IF NOT EXISTS public.chronology_questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  chapter_id TEXT DEFAULT 'independent',
  prompt TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer_index INT NOT NULL DEFAULT 0,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Create ILLUSTRATIONS & ILLUSTRATION QUESTIONS table
CREATE TABLE IF NOT EXISTS public.illustrations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.illustration_questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  chapter_id TEXT,
  illustration_id TEXT REFERENCES public.illustrations(id) ON DELETE SET NULL,
  map_image TEXT,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer_index INT NOT NULL DEFAULT 0,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- DISABLE RLS & GRANT PUBLIC READ ACCESS
-- ====================================================================
ALTER TABLE public.exam_programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_subprograms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiple_choice_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.maps DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.maps_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.analogies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.analogy_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chronology_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.illustrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.illustration_questions DISABLE ROW LEVEL SECURITY;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
