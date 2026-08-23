-- ====================================================================
-- Supabase policies for all test tables (multiple choice, maps, etc.)
-- Run this script in the Supabase SQL editor after you have created the tables.
-- ====================================================================

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'multiple_choice_questions',
    'maps_questions',
    'analogy_questions',
    'source_questions',
    'chronology_questions',
    'illustration_questions',
    -- aliases that might exist in the DB
    'არჩევითპასუხიანი','mcq_questions',
    'map','maps','რუკა',
    'analogies','ანალოგიები',
    'sources','წყარო',
    'chronology','ქრონოლოგია',
    'illustrations','ილუსტრაციები'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    -- Enable RLS (required for policies)
    EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    -- Drop any old policy that might be restrictive
    EXECUTE format('DROP POLICY IF EXISTS "Enable all access for %I" ON public.%I;', tbl, tbl);
    -- Create a permissive policy that allows everything for all roles
    EXECUTE format(
      'CREATE POLICY "Enable all access for %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);',
      tbl, tbl
    );
    -- Grant full privileges to the three Supabase roles
    EXECUTE format('GRANT ALL ON TABLE IF EXISTS public.%I TO anon, authenticated, service_role;', tbl);
  END LOOP;
END $$;
