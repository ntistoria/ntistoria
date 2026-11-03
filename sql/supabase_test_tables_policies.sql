-- ====================================================================
-- Supabase policies for all test tables (multiple choice, maps, etc.)
-- Public SELECT (except protected columns on analogy/source), Admin-only write
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
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable all access for %I" ON public.%I;', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Allow public all %I" ON public.%I;', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Public read %I" ON public.%I;', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Admin write %I" ON public.%I;', tbl, tbl);

      EXECUTE format(
        'CREATE POLICY "Public read %I" ON public.%I FOR SELECT TO anon, authenticated USING (true);',
        tbl, tbl
      );
      EXECUTE format(
        'CREATE POLICY "Admin write %I" ON public.%I FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());',
        tbl, tbl
      );

      EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.%I FROM anon;', tbl);
      EXECUTE format('GRANT INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated, service_role;', tbl);
      IF tbl NOT IN ('analogy_questions', 'source_questions') THEN
        EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon, authenticated;', tbl);
      END IF;
    END IF;
  END LOOP;
END $$;
