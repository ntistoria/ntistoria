import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vqkpacwswksgvhuczrbw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxa3BhY3dzd2tzZ3ZodWN6cmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwODQ2MzAsImV4cCI6MjEwMjY2MDYzMH0.WFqrSJvxnJyelW1kCWYZGg3I5M54Vbrm3McFPuA_zsg'
);

const TEST_CATEGORIES = [
  { key: 'mcq', tableName: 'multiple_choice_questions' },
  { key: 'map', tableName: 'maps_questions' },
  { key: 'analogies', tableName: 'analogy_questions' },
  { key: 'source', tableName: 'source_questions' },
  { key: 'chronology', tableName: 'chronology' },
  { key: 'illustrations', tableName: 'illustrations_questions' }
];

async function testParallelFetch() {
  console.time('Parallel Category Counts');
  
  const results = await Promise.all(
    TEST_CATEGORIES.map(async (cat) => {
      try {
        const { count, error } = await supabase
          .from(cat.tableName)
          .select('*', { count: 'exact', head: true });
        return { key: cat.key, count: (!error && typeof count === 'number') ? count : 0, error: error?.message };
      } catch (e: any) {
        return { key: cat.key, count: 0, error: e.message };
      }
    })
  );

  console.timeEnd('Parallel Category Counts');
  console.log('Results:', results);
}

testParallelFetch().catch(console.error);
