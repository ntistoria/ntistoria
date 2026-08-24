-- ==============================================================================
-- MIGRATION: ANALYTICS PAGE VIEWS TABLE & RLS POLICIES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.analytics_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL,
  referrer TEXT,
  device_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_page_views_created_at ON public.analytics_page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_page_views_page_path ON public.analytics_page_views (page_path);

-- Enable Row Level Security
ALTER TABLE public.analytics_page_views ENABLE ROW LEVEL SECURITY;

-- 1. Allow anyone (anon + authenticated + public) to insert page view logs
DROP POLICY IF EXISTS "Allow public insert to analytics_page_views" ON public.analytics_page_views;
CREATE POLICY "Allow public insert to analytics_page_views" 
  ON public.analytics_page_views 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

-- 2. Allow reading analytics for dashboard rendering
DROP POLICY IF EXISTS "Allow select to analytics_page_views" ON public.analytics_page_views;
CREATE POLICY "Allow select to analytics_page_views" 
  ON public.analytics_page_views 
  FOR SELECT 
  TO public 
  USING (true);

-- Enable Realtime for analytics table
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.analytics_page_views;
  END IF;
END $$;
