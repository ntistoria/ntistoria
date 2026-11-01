-- ====================================================================
-- NT ISTORIA — MOCK EXAM MODE (იმიტირებული ეროვნული გამოცდა)
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard -> Project -> SQL Editor
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create MOCK_EXAMS table
CREATE TABLE IF NOT EXISTS public.mock_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'იმიტირებული გამოცდა #1',
  selected_chapters INTEGER[] NOT NULL DEFAULT '{}'::integer[],
  duration_minutes INTEGER NOT NULL DEFAULT 180 CHECK (duration_minutes > 0),
  is_active BOOLEAN NOT NULL DEFAULT false,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  questions_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup of active mock exam
CREATE INDEX IF NOT EXISTS idx_mock_exams_active
  ON public.mock_exams (is_active, end_time DESC);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.mock_exams ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running migration
DROP POLICY IF EXISTS "Allow public all mock_exams" ON public.mock_exams;
DROP POLICY IF EXISTS "Students can view active mock exams" ON public.mock_exams;
DROP POLICY IF EXISTS "Admins have full access to mock_exams" ON public.mock_exams;

-- 3. RLS Policy for Students (Authenticated Users):
-- Only SELECT is allowed, and ONLY when is_active = true AND now() <= end_time
CREATE POLICY "Students can view active mock exams"
  ON public.mock_exams
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND end_time IS NOT NULL
    AND now() <= end_time
  );

-- 4. RLS Policy for Admins:
-- Full access (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admins have full access to mock_exams"
  ON public.mock_exams
  FOR ALL
  TO authenticated
  USING (
    lower(auth.jwt() ->> 'email') IN ('ntistoria@gmail.com', 'admin@ntistoria.ge', 'admin@gmail.com')
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE (
        profiles.user_id = auth.uid()
        OR profiles.id = auth.uid()
        OR lower(profiles.email) = lower(auth.jwt() ->> 'email')
      )
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    lower(auth.jwt() ->> 'email') IN ('ntistoria@gmail.com', 'admin@ntistoria.ge', 'admin@gmail.com')
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE (
        profiles.user_id = auth.uid()
        OR profiles.id = auth.uid()
        OR lower(profiles.email) = lower(auth.jwt() ->> 'email')
      )
      AND profiles.role = 'admin'
    )
  );

-- 5. Table Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.mock_exams TO authenticated, service_role;

-- 6. Public status helper RPC (so unauthenticated visitors can see the active banner
-- on the Tests page without exposing questions_payload; clicking redirects them to Login)
CREATE OR REPLACE FUNCTION public.get_active_mock_exam_banner()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exam RECORD;
BEGIN
  SELECT
    id,
    title,
    selected_chapters,
    duration_minutes,
    is_active,
    start_time,
    end_time,
    created_at,
    now() AS server_now
  INTO v_exam
  FROM public.mock_exams
  WHERE is_active = true
    AND end_time IS NOT NULL
    AND now() <= end_time
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN to_jsonb(v_exam);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_mock_exam_banner() TO anon, authenticated, service_role;

-- 7. Admin Answer Key Helper RPC
-- Reads the protected `answer` column from `analogy_questions` and `source_questions`
-- ONLY for authenticated Admin users when generating a mock exam or viewing the Answer Key.
CREATE OR REPLACE FUNCTION public.get_admin_open_answers(
  p_analogy_ids TEXT[] DEFAULT '{}'::TEXT[],
  p_source_ids TEXT[] DEFAULT '{}'::TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN := false;
  v_analogy_answers JSONB := '{}'::jsonb;
  v_source_answers JSONB := '{}'::jsonb;
BEGIN
  SELECT (
    lower(auth.jwt() ->> 'email') IN ('ntistoria@gmail.com', 'admin@ntistoria.ge', 'admin@gmail.com')
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE (
        profiles.user_id = auth.uid()
        OR profiles.id = auth.uid()
        OR lower(profiles.email) = lower(auth.jwt() ->> 'email')
      )
      AND profiles.role = 'admin'
    )
  ) INTO v_is_admin;

  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  IF array_length(p_analogy_ids, 1) > 0 THEN
    SELECT COALESCE(
      jsonb_object_agg(id::text, jsonb_build_object('answer', answer, 'score', score)),
      '{}'::jsonb
    )
    INTO v_analogy_answers
    FROM public.analogy_questions
    WHERE id::text = ANY(p_analogy_ids);
  END IF;

  IF array_length(p_source_ids, 1) > 0 THEN
    SELECT COALESCE(
      jsonb_object_agg(id::text, jsonb_build_object('answer', answer, 'score', score)),
      '{}'::jsonb
    )
    INTO v_source_answers
    FROM public.source_questions
    WHERE id::text = ANY(p_source_ids);
  END IF;

  RETURN jsonb_build_object(
    'analogy_questions', v_analogy_answers,
    'source_questions', v_source_answers
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_open_answers(TEXT[], TEXT[]) TO authenticated, service_role;


