-- Hide the correct answers of AI-graded open questions from the browser.
--
-- ORDER MATTERS:
--   1. Deploy the new frontend first (it no longer selects the `answer` column).
--   2. Make sure SUPABASE_SERVICE_ROLE_KEY is set in Vercel (the API reads `answer` with it).
--   3. Only then run this script in the Supabase SQL editor.
--
-- After this, `select *` on these tables fails for anon/authenticated users,
-- and `answer` can only be read by the service_role (i.e. /api/grade-answer).

-- analogy_questions
REVOKE SELECT ON public.analogy_questions FROM anon, authenticated;
GRANT SELECT (id, analogy_number, question_number, question, score)
  ON public.analogy_questions TO anon, authenticated;

-- source_questions
REVOKE SELECT ON public.source_questions FROM anon, authenticated;
GRANT SELECT (id, source_number, question_number, question, score)
  ON public.source_questions TO anon, authenticated;

-- ROLLBACK (if something breaks):
-- GRANT SELECT ON public.analogy_questions TO anon, authenticated;
-- GRANT SELECT ON public.source_questions  TO anon, authenticated;
