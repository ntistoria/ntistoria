-- =========================================================
-- NT ISTORIA — QUIZ ATTEMPTS USER ANSWERS & POLICIES UPDATE
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard -> Project -> SQL Editor
-- =========================================================

-- 1. Add user_answers JSONB column to quiz_attempts table
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS user_answers JSONB;

-- 2. Ensure RLS policies allow DELETE for attempts
DROP POLICY IF EXISTS "Anyone can delete quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Anyone can delete quiz attempts" ON public.quiz_attempts FOR DELETE USING (true);

-- 3. Update submit_quiz_attempt RPC function to store p_user_answers
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

  -- Insert attempt with user_answers
  INSERT INTO public.quiz_attempts (quiz_id, user_id, guest_name, correct_answers, total_questions, percentage, user_answers)
  VALUES (p_quiz_id, p_user_id, TRIM(p_guest_name), v_correct, v_total, v_percentage, p_user_answers)
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
