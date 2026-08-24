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
-- RLS POLICIES & GRANTS (სრული წვდომის უფლებები)
-- =========================================================

-- RLS-ის ჩართვა
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- პოლიტიკების განახლება
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable full access for profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public read articles" ON public.articles;
DROP POLICY IF EXISTS "Enable full access for articles" ON public.articles;
DROP POLICY IF EXISTS "Public read progress" ON public.user_progress;
DROP POLICY IF EXISTS "Enable full access for progress" ON public.user_progress;

CREATE POLICY "Enable full access for profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable full access for articles" ON public.articles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable full access for progress" ON public.user_progress FOR ALL USING (true) WITH CHECK (true);

-- ავტომატური წვდომის პოლიტიკები public სქემის ყველა ცხრილისთვის
DO $$ 
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow public all %I" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Allow public all %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
    END LOOP;
END $$;

-- უფლებების მინიჭება anon, authenticated და service_role-ისთვის
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
