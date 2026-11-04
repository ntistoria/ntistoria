-- ====================================================================
-- NT ISTORIA — MASTER SECURITY HARDENING & RLS LOCKDOWN SCRIPT
-- გაუშვით ეს სკრიპტი Supabase SQL Editor-ში:
-- https://supabase.com/dashboard -> Project -> SQL Editor
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. एकიანი ადმინისტრატორის შემოწმების ფუნქცია (SECURITY DEFINER)
-- ამოწმებს JWT-ის ელფოსტას ან profiles ცხრილში role = 'admin'-ს რეკურსიის გარეშე
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) = 'ntistoria@gmail.com';
$$;

-- შევინარჩუნოთ თავსებადობა is_mock_exam_admin()-თანაც
CREATE OR REPLACE FUNCTION public.is_mock_exam_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin_user();
$$;

GRANT EXECUTE ON FUNCTION public.is_admin_user() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_mock_exam_admin() TO anon, authenticated, service_role;

-- ====================================================================
-- 2. წავშალოთ ყველა ძველი ღია პოლიტიკა ("Allow public all ...", "Enable full access ...")
-- ====================================================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        policyname ILIKE 'Allow public all %'
        OR policyname ILIKE 'Enable full access for %'
        OR policyname ILIKE 'Enable all access for %'
        OR policyname ILIKE 'All operations allowed for %'
        OR policyname ILIKE 'Allow authenticated % access to videos'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ====================================================================
-- 3. PROFILES (მომხმარებლების პროფილები)
-- ====================================================================
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Public read profiles"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    OR user_id = auth.uid()
    OR public.is_admin_user()
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    OR user_id = auth.uid()
    OR public.is_admin_user()
  )
  WITH CHECK (
    (
      (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) OR user_id = auth.uid())
      AND COALESCE(role, 'student') = 'student'
    )
    OR public.is_admin_user()
  );

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin_user());

-- ====================================================================
-- 4. USER_PROGRESS (მოსწავლეების ინდივიდუალური პროგრესი)
-- მოსწავლეს წვდომა აქვს მხოლოდ საკუთარ პროგრესზე!
-- ====================================================================
ALTER TABLE IF EXISTS public.user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can delete own progress" ON public.user_progress;

CREATE POLICY "Users can read own progress"
  ON public.user_progress FOR SELECT
  TO authenticated
  USING (
    lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    OR public.is_admin_user()
  );

CREATE POLICY "Users can insert own progress"
  ON public.user_progress FOR INSERT
  TO authenticated
  WITH CHECK (
    lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    OR public.is_admin_user()
  );

CREATE POLICY "Users can update own progress"
  ON public.user_progress FOR UPDATE
  TO authenticated
  USING (
    lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    OR public.is_admin_user()
  )
  WITH CHECK (
    lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    OR public.is_admin_user()
  );

CREATE POLICY "Users can delete own progress"
  ON public.user_progress FOR DELETE
  TO authenticated
  USING (
    lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    OR public.is_admin_user()
  );

-- ====================================================================
-- 5. ARTICLES & VIDEOS (სტატიები და ვიდეო გაკვეთილები)
-- წაკითხვა: საჯარო | ჩაწერა/განახლება/წაშლა: მხოლოდ ადმინი
-- ====================================================================
DO $$
DECLARE
  tbl TEXT;
  content_tables TEXT[] := ARRAY['articles', 'videos'];
BEGIN
  FOREACH tbl IN ARRAY content_tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Public read %I" ON public.%I;', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Allow public read access to %I" ON public.%I;', tbl, tbl);
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
      EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon, authenticated;', tbl);
      EXECUTE format('GRANT INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated, service_role;', tbl);
    END IF;
  END LOOP;
END $$;

-- ====================================================================
-- 6. საგამოცდო პროგრამები და ტესტების კითხვების ცხრილები
-- წაკითხვა: საჯარო (დაცული სვეტების გარდა) | შეცვლა/წაშლა: მხოლოდ ადმინი
-- ====================================================================
DO $$
DECLARE
  tbl TEXT;
  exam_tables TEXT[] := ARRAY[
    'exam_programs', 'programs',
    'exam_subprograms', 'sub_programs', 'subprograms',
    'multiple_choice_questions', 'არჩევითპასუხიანი', 'mcq_questions',
    'maps', 'map', 'რუკა', 'maps_questions', 'map_questions',
    'analogies', 'analogy', 'ანალოგიები', 'analogy_questions',
    'sources', 'source', 'წყარო', 'source_questions',
    'chronology', 'ქრონოლოგია', 'chronology_questions',
    'illustrations', 'illustration', 'ილუსტრაციები', 'illustration_questions', 'illustrations_questions'
  ];
BEGIN
  FOREACH tbl IN ARRAY exam_tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
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

      -- თუ არ არის analogy_questions ან source_questions, მივანიჭოთ სრული SELECT
      IF tbl NOT IN ('analogy_questions', 'source_questions') THEN
        EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon, authenticated;', tbl);
      END IF;
    END IF;
  END LOOP;
END $$;

-- ღია კითხვების (`analogy_questions`, `source_questions`) `answer` სვეტის დამალვა კლიენტისგან
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'analogy_questions') THEN
    REVOKE SELECT ON public.analogy_questions FROM anon, authenticated;
    GRANT SELECT (id, analogy_number, question_number, question, score) ON public.analogy_questions TO anon, authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'source_questions') THEN
    REVOKE SELECT ON public.source_questions FROM anon, authenticated;
    GRANT SELECT (id, source_number, question_number, question, score) ON public.source_questions TO anon, authenticated;
  END IF;
END $$;

-- ====================================================================
-- 7. QUIZZES, QUIZ_QUESTIONS, QUIZ_ANSWERS, QUIZ_ATTEMPTS
-- ====================================================================
ALTER TABLE IF EXISTS public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Quizzes
DROP POLICY IF EXISTS "Anyone can view published quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Admins manage quizzes" ON public.quizzes;

CREATE POLICY "Anyone can view published quizzes"
  ON public.quizzes FOR SELECT
  TO anon, authenticated
  USING ((status = 'published' AND is_active = true) OR public.is_admin_user());

CREATE POLICY "Admins manage quizzes"
  ON public.quizzes FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Quiz Questions
DROP POLICY IF EXISTS "Anyone can view published quiz questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Admins manage quiz_questions" ON public.quiz_questions;

CREATE POLICY "Anyone can view published quiz questions"
  ON public.quiz_questions FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_questions.quiz_id
        AND ((q.status = 'published' AND q.is_active = true) OR public.is_admin_user())
    )
  );

CREATE POLICY "Admins manage quiz_questions"
  ON public.quiz_questions FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Quiz Answers
DROP POLICY IF EXISTS "Anyone can view published quiz answers" ON public.quiz_answers;
DROP POLICY IF EXISTS "Admins manage quiz_answers" ON public.quiz_answers;

CREATE POLICY "Anyone can view published quiz answers"
  ON public.quiz_answers FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_questions qq
      JOIN public.quizzes q ON q.id = qq.quiz_id
      WHERE qq.id = quiz_answers.question_id
        AND ((q.status = 'published' AND q.is_active = true) OR public.is_admin_user())
    )
  );

CREATE POLICY "Admins manage quiz_answers"
  ON public.quiz_answers FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Quiz Attempts
DROP POLICY IF EXISTS "Anyone can submit quiz attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Anyone can view quiz attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users or admins can delete quiz attempts" ON public.quiz_attempts;

CREATE POLICY "Anyone can view quiz attempts"
  ON public.quiz_attempts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can submit quiz attempts"
  ON public.quiz_attempts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users or admins can delete quiz attempts"
  ON public.quiz_attempts FOR DELETE
  TO anon, authenticated
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR user_id IS NULL
    OR public.is_admin_user()
  );

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.quizzes, public.quiz_questions, public.quiz_answers FROM anon;
GRANT SELECT ON TABLE public.quizzes, public.quiz_questions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.quizzes, public.quiz_questions, public.quiz_answers TO authenticated, service_role;

-- quiz_answers.is_correct სვეტის დამალვა პირდაპირი SELECT მოთხოვნებისგან
REVOKE SELECT ON public.quiz_answers FROM anon, authenticated;
GRANT SELECT (id, question_id, answer_text, answer_order, created_at) ON public.quiz_answers TO anon, authenticated;
GRANT SELECT ON public.quiz_answers TO service_role;

-- დაცული RPC ქვიზის შედეგების განხილვისა და ადმინ-რედაქტირებისთვის
CREATE OR REPLACE FUNCTION public.get_quiz_questions_with_answers(p_quiz_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', qq.id,
        'quiz_id', qq.quiz_id,
        'question_text', qq.question_text,
        'image_path', qq.image_path,
        'question_order', qq.question_order,
        'answers', COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', qa.id,
                'question_id', qa.question_id,
                'answer_text', qa.answer_text,
                'is_correct', qa.is_correct,
                'answer_order', qa.answer_order
              )
              ORDER BY qa.answer_order ASC
            )
            FROM public.quiz_answers qa
            WHERE qa.question_id = qq.id
          ),
          '[]'::jsonb
        )
      )
      ORDER BY qq.question_order ASC
    ),
    '[]'::jsonb
  )
  INTO v_result
  FROM public.quiz_questions qq
  WHERE qq.quiz_id = p_quiz_id;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_quiz_questions_with_answers(UUID) TO anon, authenticated, service_role;

-- დაცული RPC ქვიზის მცდელობის შესაფასებლად და შესანახად (tab_switches მხარდაჭერით)
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS tab_switches INTEGER DEFAULT 0;

DROP FUNCTION IF EXISTS public.submit_quiz_attempt(UUID, UUID, TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
  p_quiz_id UUID,
  p_user_id UUID,
  p_guest_name TEXT,
  p_user_answers JSONB,
  p_tab_switches INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_questions INT := 0;
  v_correct_answers INT := 0;
  v_percentage NUMERIC(5,2) := 0;
  v_attempt_id UUID;
  v_ans RECORD;
  v_is_correct BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO v_total_questions
  FROM public.quiz_questions
  WHERE quiz_id = p_quiz_id;

  IF v_total_questions = 0 THEN
    RAISE EXCEPTION 'No questions found for this quiz';
  END IF;

  FOR v_ans IN SELECT * FROM jsonb_to_recordset(COALESCE(p_user_answers, '[]'::jsonb)) AS x(question_id UUID, answer_id UUID)
  LOOP
    SELECT is_correct INTO v_is_correct
    FROM public.quiz_answers
    WHERE id = v_ans.answer_id AND question_id = v_ans.question_id;

    IF v_is_correct IS TRUE THEN
      v_correct_answers := v_correct_answers + 1;
    END IF;
  END LOOP;

  v_percentage := ROUND((v_correct_answers::NUMERIC / v_total_questions::NUMERIC) * 100, 2);

  INSERT INTO public.quiz_attempts (
    quiz_id,
    user_id,
    guest_name,
    total_questions,
    correct_answers,
    percentage,
    user_answers,
    tab_switches
  ) VALUES (
    p_quiz_id,
    p_user_id,
    p_guest_name,
    v_total_questions,
    v_correct_answers,
    v_percentage,
    COALESCE(p_user_answers, '[]'::jsonb),
    COALESCE(p_tab_switches, 0)
  )
  RETURNING id INTO v_attempt_id;

  RETURN jsonb_build_object(
    'attempt_id', v_attempt_id,
    'total_questions', v_total_questions,
    'correct_answers', v_correct_answers,
    'percentage', v_percentage,
    'tab_switches', COALESCE(p_tab_switches, 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(UUID, UUID, TEXT, JSONB, INTEGER) TO anon, authenticated, service_role;

-- ====================================================================
-- 8. MOCK EXAMS — მოსწავლისთვის სწორი პასუხების დამალვა Network-ში
-- მოსწავლეებს ეკრძალებათ პირდაპირი SELECT mock_exams ცხრილზე (სადაც პასუხებია);
-- ისინი ტესტს იღებენ მხოლოდ get_active_mock_exam_student() RPC-ით!
-- ====================================================================
DROP POLICY IF EXISTS "Students can view active mock exams" ON public.mock_exams;
DROP POLICY IF EXISTS "Admins have full access to mock_exams" ON public.mock_exams;

CREATE POLICY "Admins have full access to mock_exams"
  ON public.mock_exams
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

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
    created_at AS start_time,
    GREATEST(COALESCE(end_time, created_at + (duration_minutes * interval '1 minute')), created_at + (duration_minutes * interval '1 minute')) AS end_time,
    created_at,
    now() AS server_now
  INTO v_exam
  FROM public.mock_exams
  WHERE is_active = true
    AND now() <= GREATEST(COALESCE(end_time, created_at + (duration_minutes * interval '1 minute')), created_at + (duration_minutes * interval '1 minute'))
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN to_jsonb(v_exam);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_mock_exam_banner() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_active_mock_exam_student()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exam RECORD;
  v_payload JSONB;
  v_mcq JSONB := '[]'::jsonb;
  v_map JSONB := 'null'::jsonb;
  v_analogies JSONB := 'null'::jsonb;
  v_source JSONB := 'null'::jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT *
  INTO v_exam
  FROM public.mock_exams
  WHERE is_active = true
    AND now() <= GREATEST(COALESCE(end_time, created_at + (duration_minutes * interval '1 minute')), created_at + (duration_minutes * interval '1 minute'))
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_payload := COALESCE(v_exam.questions_payload, '{}'::jsonb);

  -- გავასუფთავოთ N1-35 კითხვები სწორი პასუხების ინდექსებისგან
  IF jsonb_typeof(v_payload -> 'mcqQuestions') = 'array' THEN
    SELECT COALESCE(
      jsonb_agg(
        elem - 'correctAnswerIndex' - 'correctAnswerLetter' - 'correctAnswerText' - 'correctSequence' - 'explanation'
      ),
      '[]'::jsonb
    )
    INTO v_mcq
    FROM jsonb_array_elements(v_payload -> 'mcqQuestions') AS elem;
  END IF;

  -- გავასუფთავოთ N36 (რუკა)
  IF jsonb_typeof(v_payload -> 'mapTask') = 'object' AND jsonb_typeof(v_payload #> '{mapTask,questions}') = 'array' THEN
    SELECT jsonb_set(
      v_payload -> 'mapTask',
      '{questions}',
      COALESCE(
        (
          SELECT jsonb_agg(
            elem - 'correctAnswerIndex' - 'correctAnswerLetter' - 'correctAnswerText' - 'correctSequence' - 'explanation'
          )
          FROM jsonb_array_elements(v_payload #> '{mapTask,questions}') AS elem
        ),
        '[]'::jsonb
      )
    )
    INTO v_map;
  ELSE
    v_map := COALESCE(v_payload -> 'mapTask', 'null'::jsonb);
  END IF;

  -- გავასუფთავოთ N37 (ანალოგიები)
  IF jsonb_typeof(v_payload -> 'analogyTask') = 'object' AND jsonb_typeof(v_payload #> '{analogyTask,questions}') = 'array' THEN
    SELECT jsonb_set(
      v_payload -> 'analogyTask',
      '{questions}',
      COALESCE(
        (
          SELECT jsonb_agg(
            elem - 'correctAnswerIndex' - 'correctAnswerLetter' - 'correctAnswerText' - 'correctSequence' - 'explanation'
          )
          FROM jsonb_array_elements(v_payload #> '{analogyTask,questions}') AS elem
        ),
        '[]'::jsonb
      )
    )
    INTO v_analogies;
  ELSE
    v_analogies := COALESCE(v_payload -> 'analogyTask', 'null'::jsonb);
  END IF;

  -- გავასუფთავოთ N38 (წყარო)
  IF jsonb_typeof(v_payload -> 'sourceTask') = 'object' AND jsonb_typeof(v_payload #> '{sourceTask,questions}') = 'array' THEN
    SELECT jsonb_set(
      v_payload -> 'sourceTask',
      '{questions}',
      COALESCE(
        (
          SELECT jsonb_agg(
            elem - 'correctAnswerIndex' - 'correctAnswerLetter' - 'correctAnswerText' - 'correctSequence' - 'explanation'
          )
          FROM jsonb_array_elements(v_payload #> '{sourceTask,questions}') AS elem
        ),
        '[]'::jsonb
      )
    )
    INTO v_source;
  ELSE
    v_source := COALESCE(v_payload -> 'sourceTask', 'null'::jsonb);
  END IF;

  RETURN jsonb_build_object(
    'id', v_exam.id,
    'title', v_exam.title,
    'selected_chapters', v_exam.selected_chapters,
    'duration_minutes', v_exam.duration_minutes,
    'is_active', v_exam.is_active,
    'start_time', v_exam.created_at,
    'end_time', GREATEST(COALESCE(v_exam.end_time, v_exam.created_at + (v_exam.duration_minutes * interval '1 minute')), v_exam.created_at + (v_exam.duration_minutes * interval '1 minute')),
    'created_at', v_exam.created_at,
    'server_now', now(),
    'questions_payload', jsonb_build_object(
      'mcqQuestions', v_mcq,
      'mapTask', v_map,
      'analogyTask', v_analogies,
      'sourceTask', v_source
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_mock_exam_student() TO authenticated, service_role;

-- ====================================================================
-- 9. STORAGE BUCKETS RLS HARDENING
-- სურათების ნახვა: საჯარო | ატვირთვა/წაშლა: მხოლოდ ადმინი
-- ====================================================================
DROP POLICY IF EXISTS "Public Insert photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Update photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin Insert photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete photos" ON storage.objects;

CREATE POLICY "Admin Insert photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'photos' AND public.is_admin_user());

CREATE POLICY "Admin Update photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'photos' AND public.is_admin_user())
  WITH CHECK (bucket_id = 'photos' AND public.is_admin_user());

CREATE POLICY "Admin Delete photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'photos' AND public.is_admin_user());

DROP POLICY IF EXISTS "Public Insert Quiz Covers" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Quiz Covers" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Quiz Covers" ON storage.objects;
DROP POLICY IF EXISTS "Admin Manage Quiz Covers" ON storage.objects;

CREATE POLICY "Admin Manage Quiz Covers" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'quiz-covers' AND public.is_admin_user())
  WITH CHECK (bucket_id = 'quiz-covers' AND public.is_admin_user());

DROP POLICY IF EXISTS "Public Insert Quiz Question Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Quiz Question Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Quiz Question Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Manage Quiz Question Images" ON storage.objects;

CREATE POLICY "Admin Manage Quiz Question Images" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'quiz-question-images' AND public.is_admin_user())
  WITH CHECK (bucket_id = 'quiz-question-images' AND public.is_admin_user());
