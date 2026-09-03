-- =========================================================
-- NT ISTORIA — COMPLETE QUIZ SYSTEM DATABASE SETUP
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard -> Project -> SQL Editor
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- 1. QUIZZES TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_path TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 2. QUIZ QUESTIONS TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  image_path TEXT,
  question_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 3. QUIZ ANSWERS TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  answer_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 4. QUIZ ATTEMPTS / RESULTS TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name TEXT,
  correct_answers INTEGER NOT NULL CHECK (correct_answers >= 0),
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  percentage NUMERIC(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT attempt_user_or_guest_check CHECK (
    user_id IS NOT NULL OR (guest_name IS NOT NULL AND LENGTH(TRIM(guest_name)) > 0)
  )
);

-- =========================================================
-- INDEXES FOR MAXIMUM PERFORMANCE
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_quizzes_status ON public.quizzes(status, is_active);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id, question_order);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_question_id ON public.quiz_answers(question_id, answer_order);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_leaderboard ON public.quiz_attempts (quiz_id, correct_answers DESC, percentage DESC, created_at ASC);

-- =========================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =========================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_quizzes_updated_at ON public.quizzes;
CREATE TRIGGER set_quizzes_updated_at
BEFORE UPDATE ON public.quizzes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_quiz_questions_updated_at ON public.quiz_questions;
CREATE TRIGGER set_quiz_questions_updated_at
BEFORE UPDATE ON public.quiz_questions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- STORAGE BUCKETS FOR QUIZ IMAGES
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('quiz-covers', 'quiz-covers', true),
  ('quiz-question-images', 'quiz-question-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for quiz-covers
DROP POLICY IF EXISTS "Public Read Quiz Covers" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Quiz Covers" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Quiz Covers" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Quiz Covers" ON storage.objects;

CREATE POLICY "Public Read Quiz Covers" ON storage.objects FOR SELECT USING (bucket_id = 'quiz-covers');
CREATE POLICY "Public Insert Quiz Covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'quiz-covers');
CREATE POLICY "Public Update Quiz Covers" ON storage.objects FOR UPDATE USING (bucket_id = 'quiz-covers');
CREATE POLICY "Public Delete Quiz Covers" ON storage.objects FOR DELETE USING (bucket_id = 'quiz-covers');

-- Storage Policies for quiz-question-images
DROP POLICY IF EXISTS "Public Read Quiz Question Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Quiz Question Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Quiz Question Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Quiz Question Images" ON storage.objects;

CREATE POLICY "Public Read Quiz Question Images" ON storage.objects FOR SELECT USING (bucket_id = 'quiz-question-images');
CREATE POLICY "Public Insert Quiz Question Images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'quiz-question-images');
CREATE POLICY "Public Update Quiz Question Images" ON storage.objects FOR UPDATE USING (bucket_id = 'quiz-question-images');
CREATE POLICY "Public Delete Quiz Question Images" ON storage.objects FOR DELETE USING (bucket_id = 'quiz-question-images');

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- 1. Quizzes Policies
DROP POLICY IF EXISTS "Anyone can view published quizzes" ON public.quizzes;
CREATE POLICY "Anyone can view published quizzes" ON public.quizzes FOR SELECT USING (status = 'published' AND is_active = true);

DROP POLICY IF EXISTS "All operations allowed for quizzes" ON public.quizzes;
CREATE POLICY "All operations allowed for quizzes" ON public.quizzes FOR ALL USING (true) WITH CHECK (true);

-- 2. Quiz Questions Policies
DROP POLICY IF EXISTS "Anyone can view published quiz questions" ON public.quiz_questions;
CREATE POLICY "Anyone can view published quiz questions" ON public.quiz_questions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = quiz_questions.quiz_id AND q.status = 'published' AND q.is_active = true
  )
);

DROP POLICY IF EXISTS "All operations allowed for quiz_questions" ON public.quiz_questions;
CREATE POLICY "All operations allowed for quiz_questions" ON public.quiz_questions FOR ALL USING (true) WITH CHECK (true);

-- 3. Quiz Answers Policies
DROP POLICY IF EXISTS "Anyone can view published quiz answers" ON public.quiz_answers;
CREATE POLICY "Anyone can view published quiz answers" ON public.quiz_answers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.quiz_questions qq
    JOIN public.quizzes q ON q.id = qq.quiz_id
    WHERE qq.id = quiz_answers.question_id AND q.status = 'published' AND q.is_active = true
  )
);

DROP POLICY IF EXISTS "All operations allowed for quiz_answers" ON public.quiz_answers;
CREATE POLICY "All operations allowed for quiz_answers" ON public.quiz_answers FOR ALL USING (true) WITH CHECK (true);

-- 4. Quiz Attempts Policies
DROP POLICY IF EXISTS "Anyone can submit quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Anyone can submit quiz attempts" ON public.quiz_attempts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Anyone can view quiz attempts" ON public.quiz_attempts FOR SELECT USING (true);

GRANT ALL ON TABLE public.quizzes TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.quiz_questions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.quiz_answers TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.quiz_attempts TO anon, authenticated, service_role;

-- =========================================================
-- SECURE SERVER-SIDE ANSWER SUBMISSION RPC
-- =========================================================
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
  p_quiz_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_guest_name TEXT DEFAULT NULL,
  p_user_answers JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total INT;
  v_correct INT := 0;
  v_percentage NUMERIC(5,2);
  v_attempt_id UUID;
  v_item JSONB;
  v_q_id UUID;
  v_a_id UUID;
  v_is_correct BOOLEAN;
BEGIN
  -- Validate quiz existence
  SELECT COUNT(*) INTO v_total
  FROM public.quiz_questions
  WHERE quiz_id = p_quiz_id;

  IF v_total = 0 THEN
    RAISE EXCEPTION 'Quiz has no questions or does not exist';
  END IF;

  -- Iterate submitted user answers array: [{"question_id": "...", "answer_id": "..."}, ...]
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_user_answers)
  LOOP
    v_q_id := (v_item->>'question_id')::uuid;
    v_a_id := (v_item->>'answer_id')::uuid;

    IF v_q_id IS NOT NULL AND v_a_id IS NOT NULL THEN
      SELECT is_correct INTO v_is_correct
      FROM public.quiz_answers
      WHERE id = v_a_id AND question_id = v_q_id;

      IF v_is_correct = TRUE THEN
        v_correct := v_correct + 1;
      END IF;
    END IF;
  END LOOP;

  v_percentage := ROUND((v_correct::numeric / v_total::numeric) * 100, 2);

  -- Insert attempt
  INSERT INTO public.quiz_attempts (quiz_id, user_id, guest_name, correct_answers, total_questions, percentage)
  VALUES (p_quiz_id, p_user_id, TRIM(p_guest_name), v_correct, v_total, v_percentage)
  RETURNING id INTO v_attempt_id;

  RETURN jsonb_build_object(
    'attempt_id', v_attempt_id,
    'correct_answers', v_correct,
    'total_questions', v_total,
    'percentage', v_percentage
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt TO anon, authenticated, service_role;

-- =========================================================
-- LEADERBOARD VIEW (BEST ATTEMPT PER USER / GUEST)
-- =========================================================
CREATE OR REPLACE VIEW public.quiz_leaderboard_best AS
WITH ranked_attempts AS (
  SELECT
    qa.id,
    qa.quiz_id,
    qa.user_id,
    qa.guest_name,
    qa.correct_answers,
    qa.total_questions,
    qa.percentage,
    qa.created_at,
    ROW_NUMBER() OVER (
      PARTITION BY qa.quiz_id, COALESCE(qa.user_id::text, LOWER(TRIM(qa.guest_name)))
      ORDER BY qa.correct_answers DESC, qa.percentage DESC, qa.created_at ASC
    ) as rank_per_user
  FROM public.quiz_attempts qa
)
SELECT
  id,
  quiz_id,
  user_id,
  guest_name,
  correct_answers,
  total_questions,
  percentage,
  created_at
FROM ranked_attempts
WHERE rank_per_user = 1
ORDER BY quiz_id, correct_answers DESC, percentage DESC, created_at ASC;

GRANT SELECT ON public.quiz_leaderboard_best TO anon, authenticated, service_role;
