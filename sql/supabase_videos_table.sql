-- ====================================================================
-- SUPABASE DDL FOR VIDEOS TABLE
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ====================================================================

-- 1. Create VIDEOS Table
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access to videos" ON public.videos;
DROP POLICY IF EXISTS "Allow authenticated insert access to videos" ON public.videos;
DROP POLICY IF EXISTS "Allow authenticated update access to videos" ON public.videos;
DROP POLICY IF EXISTS "Allow authenticated delete access to videos" ON public.videos;
DROP POLICY IF EXISTS "Allow authenticated admin full access to videos" ON public.videos;
DROP POLICY IF EXISTS "Enable all access for videos" ON public.videos;

-- 4. Public Read (SELECT) Policy for everyone (anon & authenticated)
CREATE POLICY "Allow public read access to videos"
ON public.videos
FOR SELECT
TO public
USING (true);

-- 5. Insert, Update, Delete Policies for Authenticated Users
CREATE POLICY "Allow authenticated insert access to videos"
ON public.videos
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update access to videos"
ON public.videos
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated delete access to videos"
ON public.videos
FOR DELETE
TO authenticated
USING (true);

-- 6. Grant permissions
GRANT SELECT ON TABLE public.videos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.videos TO authenticated, service_role;
