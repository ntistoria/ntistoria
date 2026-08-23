import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vqkpacwswksgvhuczrbw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxa3BhY3dzd2tzZ3ZodWN6cmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwODQ2MzAsImV4cCI6MjEwMjY2MDYzMH0.WFqrSJvxnJyelW1kCWYZGg3I5M54Vbrm3McFPuA_zsg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAllPossibleTables() {
  console.log('=== TESTING EXTENDED LIST OF TABLES ===');
  
  const tables = [
    'articles',
    'blogs',
    'posts',
    'profiles',
    'users',
    'user_progress',
    'questions',
    'tests',
    'history_tests',
    'test_questions',
    'quiz_questions',
    'naec_questions',
    'naec_tests',
    'exam_questions',
    'history_exam',
    'history',
    'exam',
    'programs',
    'subprograms',
    'chapters',
    'topics',
    'multiple_choice',
    'mcq',
    'map',
    'analogy',
    'source',
    'chronology',
    'illustration',
    'ilustrations'
  ];

  for (const t of tables) {
    const { data, error, count } = await supabase.from(t).select('*', { count: 'exact' }).limit(1);
    if (!error) {
      console.log(`🎉 FOUND TABLE: public.${t} (Count: ${count})`);
      if (data && data[0]) console.log(`   Keys:`, Object.keys(data[0]));
    }
  }
}

testAllPossibleTables();
