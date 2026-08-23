-- ====================================================================
-- SUPABASE DDL FOR ARTICLES (BLOGS) TABLE & STORAGE BUCKET
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ====================================================================

-- 1. Create ARTICLES (Blogs) Table
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

-- 2. Disable Row Level Security on articles table
ALTER TABLE public.articles DISABLE ROW LEVEL SECURITY;

-- 3. Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Enable all access for articles" ON public.articles;

-- 4. Create permissive policy for articles table
CREATE POLICY "Enable all access for articles" 
ON public.articles 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 5. Grant SELECT, INSERT, UPDATE, DELETE permissions to all roles
GRANT ALL ON TABLE public.articles TO anon, authenticated, service_role;

-- 6. Ensure Storage Bucket 'photos' exists for Blog & Map images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 7. Drop existing storage policies if present
DROP POLICY IF EXISTS "Public Read Access Photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Access Photos" ON storage.objects;

-- 8. Storage Public Read & Insert Access Policies
CREATE POLICY "Public Read Access Photos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'photos');

CREATE POLICY "Public Insert Access Photos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'photos');
