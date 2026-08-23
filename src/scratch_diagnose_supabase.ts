/**
 * Quick check: does history_exam schema actually have tables with data?
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vqkpacwswksgvhuczrbw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxa3BhY3dzd2tzZ3ZodWN6cmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwODQ2MzAsImV4cCI6MjEwMjY2MDYzMH0.WFqrSJvxnJyelW1kCWYZGg3I5M54Vbrm3McFPuA_zsg'
);

async function check() {
  // Check history_exam schema tables with actual data fetch
  const testTables = [
    'multiple_choice_questions', 'არჩევითპასუხიანი', 'mcq_questions',
    'maps_questions', 'map_questions', 
    'analogy_questions', 'analogies',
    'source_questions', 'sources',
    'chronology_questions', 'chronology',
    'illustration_questions', 'illustrations'
  ];

  console.log('=== Checking history_exam schema for data ===\n');
  for (const t of testTables) {
    try {
      const { data, error } = await supabase
        .schema('history_exam')
        .from(t)
        .select('*')
        .limit(2);
      
      if (error) {
        // silent
      } else if (data && data.length > 0) {
        console.log(`>>> FOUND DATA in history_exam.${t}: ${data.length}+ rows`);
        console.log(`    Columns: ${Object.keys(data[0]).join(', ')}`);
        console.log(`    Sample: ${JSON.stringify(data[0]).substring(0, 300)}`);
      }
    } catch (e) {}
  }

  // Also check ALL tables visible through PostgREST in public schema
  console.log('\n=== Listing all public tables with data ===\n');
  // Try common table naming patterns
  const publicTables = [
    'articles', 'user_progress',
    'multiple_choice_questions', 'maps_questions', 'analogy_questions', 
    'source_questions', 'chronology_questions', 'illustration_questions',
    'questions', 'test_questions', 'exam_questions', 'history_questions',
    'tests', 'exams', 'quiz', 'quizzes',
    'exam_programs', 'programs', 'program',
    'maps', 'sources', 'illustrations', 'chronology',
  ];

  for (const t of publicTables) {
    try {
      const { data, error, count } = await supabase
        .from(t)
        .select('*', { count: 'exact', head: false })
        .limit(1);
      
      if (!error && data) {
        console.log(`   public.${t}: ${count ?? data.length} row(s)${data.length > 0 ? `, columns: [${Object.keys(data[0]).join(', ')}]` : ' (empty)'}`);
      }
    } catch (e) {}
  }

  console.log('\n=== DONE ===');
}

check().catch(console.error);
