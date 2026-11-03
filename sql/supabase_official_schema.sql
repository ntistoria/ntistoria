-- =========================================================
-- NTISTORIA.GE - SUPABASE PRODUCTION SCHEMA & POLICIES
-- წაშალეთ/გაუშვით ეს სქრიპტი Supabase-ის SQL Editor-ში
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (მომხმარებლების პროფილები)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. ARTICLES (ბლოგები და ისტორიული სტატიები)
CREATE TABLE IF NOT EXISTS public.articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    excerpt TEXT,
    content TEXT,
    category TEXT DEFAULT 'საქართველოს ისტორია',
    author TEXT DEFAULT 'ნოდარ თოთაძე',
    date TEXT,
    image_url TEXT,
    featured BOOLEAN DEFAULT FALSE,
    tags JSONB DEFAULT '["ისტორია"]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. USER_PROGRESS (სტუდენტების ტესტების პროგრესი)
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT UNIQUE NOT NULL,
    progress_json JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =========================================================
-- RLS POLICIES & GRANTS (დაცული წვდომის უფლებები)
-- =========================================================

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    lower(coalesce(auth.jwt() ->> 'email', '')) IN (
      'ntistoria@gmail.com',
      'admin@ntistoria.ge',
      'admin@gmail.com',
      't.totadze@gmail.com',
      'nodar.totadze@gmail.com'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE (
        profiles.user_id = auth.uid()
        OR profiles.id = auth.uid()
        OR lower(profiles.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
      AND profiles.role = 'admin'
    )
  );
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable full access for profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public read articles" ON public.articles;
DROP POLICY IF EXISTS "Enable full access for articles" ON public.articles;
DROP POLICY IF EXISTS "Admin write articles" ON public.articles;
DROP POLICY IF EXISTS "Public read progress" ON public.user_progress;
DROP POLICY IF EXISTS "Enable full access for progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can read own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can delete own progress" ON public.user_progress;

-- Profiles: საჯარო წაკითხვა, საკუთარი პროფილის განახლება
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) OR user_id = auth.uid() OR public.is_admin_user());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) OR user_id = auth.uid() OR public.is_admin_user()) WITH CHECK (((lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) OR user_id = auth.uid()) AND COALESCE(role, 'student') = 'student') OR public.is_admin_user());

-- Articles: საჯარო წაკითხვა, მხოლოდ ადმინის ჩაწერა/წაშლა
CREATE POLICY "Public read articles" ON public.articles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin write articles" ON public.articles FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- User Progress: მხოლოდ საკუთარ პროგრესზე წვდომა
CREATE POLICY "Users can read own progress" ON public.user_progress FOR SELECT TO authenticated USING (lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', '')) OR public.is_admin_user());
CREATE POLICY "Users can insert own progress" ON public.user_progress FOR INSERT TO authenticated WITH CHECK (lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', '')) OR public.is_admin_user());
CREATE POLICY "Users can update own progress" ON public.user_progress FOR UPDATE TO authenticated USING (lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', '')) OR public.is_admin_user()) WITH CHECK (lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', '')) OR public.is_admin_user());
CREATE POLICY "Users can delete own progress" ON public.user_progress FOR DELETE TO authenticated USING (lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', '')) OR public.is_admin_user());

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.profiles, public.articles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles, public.articles, public.user_progress TO authenticated, service_role;
GRANT SELECT ON public.user_progress TO authenticated, service_role;

-- =========================================================
-- STORAGE 'photos' BUCKET RLS POLICIES (ფოტოების ატვირთვის უფლებები)
-- =========================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Select photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Update photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin Insert photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete photos" ON storage.objects;

CREATE POLICY "Public Select photos" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
CREATE POLICY "Admin Insert photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'photos' AND public.is_admin_user());
CREATE POLICY "Admin Update photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'photos' AND public.is_admin_user()) WITH CHECK (bucket_id = 'photos' AND public.is_admin_user());
CREATE POLICY "Admin Delete photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'photos' AND public.is_admin_user());
