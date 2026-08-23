-- =========================================================
-- HISTORY EXAM DATABASE - OFFICIAL SUPABASE SCHEMA
-- WITH RLS POLICIES & GRANTS FOR HIGH-PERFORMANCE FETCHING
-- =========================================================

-- =========================================================
-- 1. წაშლა ძველი ცხრილების
-- =========================================================

DROP TABLE IF EXISTS illustrations_questions CASCADE;
DROP TABLE IF EXISTS illustrations CASCADE;

DROP TABLE IF EXISTS source_questions CASCADE;
DROP TABLE IF EXISTS source CASCADE;

DROP TABLE IF EXISTS maps_questions CASCADE;
DROP TABLE IF EXISTS maps CASCADE;

DROP TABLE IF EXISTS analogy_questions CASCADE;
DROP TABLE IF EXISTS analogy CASCADE;

DROP TABLE IF EXISTS multiple_choice_questions CASCADE;

DROP TABLE IF EXISTS chronology CASCADE;

DROP TABLE IF EXISTS sub_programs CASCADE;
DROP TABLE IF EXISTS exam_programs CASCADE;


-- =========================================================
-- 2. საგამოცდო პროგრამები
-- =========================================================

CREATE TABLE exam_programs (
    program_number INTEGER PRIMARY KEY,
    program_name TEXT NOT NULL
);


-- =========================================================
-- 3. ქვეპროგრამები
-- =========================================================

CREATE TABLE sub_programs (
    sub_program_number INTEGER PRIMARY KEY,
    program_number INTEGER NOT NULL,
    sub_name TEXT NOT NULL,

    CONSTRAINT fk_subprogram_program
        FOREIGN KEY (program_number)
        REFERENCES exam_programs(program_number)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- =========================================================
-- 4. მრავალპასუხიანი / Multiple Choice კითხვები
-- =========================================================

CREATE TABLE multiple_choice_questions (
    id BIGSERIAL PRIMARY KEY,

    program_number INTEGER NOT NULL,
    sub_program_number INTEGER NOT NULL,

    question_number INTEGER NOT NULL,
    question TEXT NOT NULL,

    answer_1 TEXT NOT NULL,
    answer_2 TEXT NOT NULL,
    answer_3 TEXT NOT NULL,
    answer_4 TEXT NOT NULL,

    correct_answer INTEGER NOT NULL,
    score INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT fk_mc_program
        FOREIGN KEY (program_number)
        REFERENCES exam_programs(program_number)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_mc_subprogram
        FOREIGN KEY (sub_program_number)
        REFERENCES sub_programs(sub_program_number)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT chk_mc_correct_answer
        CHECK (correct_answer BETWEEN 1 AND 4),

    CONSTRAINT chk_mc_score
        CHECK (score >= 0),

    CONSTRAINT uq_mc_question
        UNIQUE (program_number, sub_program_number, question_number)
);


-- =========================================================
-- 5. ანალოგიები
-- =========================================================

CREATE TABLE analogy (
    analogy_number INTEGER PRIMARY KEY,

    program_number INTEGER NOT NULL,
    sub_program_number INTEGER NOT NULL,

    analogy TEXT NOT NULL,

    CONSTRAINT fk_analogy_program
        FOREIGN KEY (program_number)
        REFERENCES exam_programs(program_number)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_analogy_subprogram
        FOREIGN KEY (sub_program_number)
        REFERENCES sub_programs(sub_program_number)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- =========================================================
-- 6. ანალოგიის კითხვები
-- =========================================================

CREATE TABLE analogy_questions (
    id BIGSERIAL PRIMARY KEY,

    analogy_number INTEGER NOT NULL,
    question_number INTEGER NOT NULL,

    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT fk_analogy_question
        FOREIGN KEY (analogy_number)
        REFERENCES analogy(analogy_number)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT chk_analogy_score
        CHECK (score >= 0),

    CONSTRAINT uq_analogy_question
        UNIQUE (analogy_number, question_number)
);


-- =========================================================
-- 7. რუკები
-- =========================================================

CREATE TABLE maps (
    map_number INTEGER PRIMARY KEY,

    program_number INTEGER NOT NULL,
    sub_program_number INTEGER NOT NULL,

    map_url TEXT,

    CONSTRAINT fk_map_program
        FOREIGN KEY (program_number)
        REFERENCES exam_programs(program_number)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_map_subprogram
        FOREIGN KEY (sub_program_number)
        REFERENCES sub_programs(sub_program_number)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- =========================================================
-- 8. რუკების კითხვები
-- =========================================================

CREATE TABLE maps_questions (
    id BIGSERIAL PRIMARY KEY,

    map_number INTEGER NOT NULL,
    question_number INTEGER NOT NULL,

    question TEXT NOT NULL,

    answer_1 TEXT NOT NULL,
    answer_2 TEXT NOT NULL,
    answer_3 TEXT NOT NULL,
    answer_4 TEXT NOT NULL,

    correct_answer INTEGER NOT NULL,
    score INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT fk_map_question
        FOREIGN KEY (map_number)
        REFERENCES maps(map_number)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT chk_map_correct_answer
        CHECK (correct_answer BETWEEN 1 AND 4),

    CONSTRAINT chk_map_score
        CHECK (score >= 0),

    CONSTRAINT uq_map_question
        UNIQUE (map_number, question_number)
);


-- =========================================================
-- 9. წყაროები
-- =========================================================

CREATE TABLE source (
    source_number INTEGER PRIMARY KEY,

    program_number INTEGER NOT NULL,
    sub_program_number INTEGER NOT NULL,

    source TEXT NOT NULL,

    CONSTRAINT fk_source_program
        FOREIGN KEY (program_number)
        REFERENCES exam_programs(program_number)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_source_subprogram
        FOREIGN KEY (sub_program_number)
        REFERENCES sub_programs(sub_program_number)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- =========================================================
-- 10. წყაროს კითხვები
-- =========================================================

CREATE TABLE source_questions (
    id BIGSERIAL PRIMARY KEY,

    source_number INTEGER NOT NULL,
    question_number INTEGER NOT NULL,

    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT fk_source_question
        FOREIGN KEY (source_number)
        REFERENCES source(source_number)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT chk_source_score
        CHECK (score >= 0),

    CONSTRAINT uq_source_question
        UNIQUE (source_number, question_number)
);


-- =========================================================
-- 11. ქრონოლოგიის კითხვები
-- =========================================================

CREATE TABLE chronology (
    chronology_number INTEGER PRIMARY KEY,

    question TEXT NOT NULL,

    answer_1 TEXT NOT NULL,
    answer_2 TEXT NOT NULL,
    answer_3 TEXT NOT NULL,

    correct_answer TEXT NOT NULL,

    score INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT chk_chronology_score
        CHECK (score >= 0)
);


-- =========================================================
-- 12. ილუსტრაციები
-- =========================================================

CREATE TABLE illustrations (
    illustration_number INTEGER PRIMARY KEY,

    program_number INTEGER NOT NULL,
    sub_program_number INTEGER NOT NULL,

    illustration_url TEXT,

    CONSTRAINT fk_illustration_program
        FOREIGN KEY (program_number)
        REFERENCES exam_programs(program_number)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_illustration_subprogram
        FOREIGN KEY (sub_program_number)
        REFERENCES sub_programs(sub_program_number)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- =========================================================
-- 13. ილუსტრაციების კითხვები
-- =========================================================

CREATE TABLE illustrations_questions (
    id BIGSERIAL PRIMARY KEY,

    illustration_number INTEGER NOT NULL,
    question_number INTEGER NOT NULL,

    question TEXT NOT NULL,
    correct_answer TEXT NOT NULL,

    score INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT fk_illustration_question
        FOREIGN KEY (illustration_number)
        REFERENCES illustrations(illustration_number)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT chk_illustration_score
        CHECK (score >= 0),

    CONSTRAINT uq_illustration_question
        UNIQUE (illustration_number, question_number)
);


-- =========================================================
-- 14. INDEX-ები (სწრაფი ძებნისთვის)
-- =========================================================

CREATE INDEX idx_sub_programs_program
    ON sub_programs(program_number);

CREATE INDEX idx_mc_program
    ON multiple_choice_questions(program_number);

CREATE INDEX idx_mc_subprogram
    ON multiple_choice_questions(sub_program_number);

CREATE INDEX idx_analogy_program
    ON analogy(program_number);

CREATE INDEX idx_analogy_subprogram
    ON analogy(sub_program_number);

CREATE INDEX idx_analogy_questions_analogy
    ON analogy_questions(analogy_number);

CREATE INDEX idx_maps_program
    ON maps(program_number);

CREATE INDEX idx_maps_subprogram
    ON maps(sub_program_number);

CREATE INDEX idx_maps_questions_map
    ON maps_questions(map_number);

CREATE INDEX idx_source_program
    ON source(program_number);

CREATE INDEX idx_source_subprogram
    ON source(sub_program_number);

CREATE INDEX idx_source_questions_source
    ON source_questions(source_number);

CREATE INDEX idx_illustrations_program
    ON illustrations(program_number);

CREATE INDEX idx_illustrations_subprogram
    ON illustrations(sub_program_number);

CREATE INDEX idx_illustrations_questions_illustration
    ON illustrations_questions(illustration_number);


-- =========================================================
-- 15. RLS და უფლებები (აუცილებელია Supabase API-სთვის)
-- =========================================================

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'exam_programs',
    'sub_programs',
    'multiple_choice_questions',
    'analogy',
    'analogy_questions',
    'maps',
    'maps_questions',
    'source',
    'source_questions',
    'chronology',
    'illustrations',
    'illustrations_questions'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Public access for %I" ON public.%I;', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY "Public access for %I" ON public.%I FOR ALL USING (true) WITH CHECK (true);',
      tbl, tbl
    );
    EXECUTE format('GRANT ALL ON TABLE public.%I TO anon, authenticated, service_role;', tbl);
  END LOOP;
END $$;


-- =========================================================
-- 16. შემოწმება
-- =========================================================

SELECT
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
