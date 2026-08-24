-- ==============================================================================
-- CLEANUP MIGRATION: DROP ANALYTICS PAGE VIEWS TABLE & RLS POLICIES
-- ==============================================================================

-- 1. Remove table from realtime publication if present
DO $$ 
BEGIN 
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'analytics_page_views'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.analytics_page_views;
  END IF;
END $$;

-- 2. Drop analytics table (CASCADE automatically drops RLS policies and indexes)
DROP TABLE IF EXISTS public.analytics_page_views CASCADE;
