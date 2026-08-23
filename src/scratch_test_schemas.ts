import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vqkpacwswksgvhuczrbw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxa3BhY3dzd2tzZ3ZodWN6cmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwODQ2MzAsImV4cCI6MjEwMjY2MDYzMH0.WFqrSJvxnJyelW1kCWYZGg3I5M54Vbrm3McFPuA_zsg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSchemas() {
  console.log('=== TESTING SCHEMAS ===');
  const schemas = ['public', 'history_exam', 'history', 'exam', 'naec', 'test', 'storage'];
  const testTables = ['multiple_choice_questions', 'maps', 'analogies', 'sources', 'chronology_questions', 'illustrations', 'exam_programs'];

  for (const s of schemas) {
    for (const t of testTables) {
      try {
        const { data, error } = await supabase.schema(s).from(t).select('*').limit(1);
        if (!error) {
          console.log(`🎉 FOUND SCHEMA & TABLE: [${s}.${t}]! Data count: ${data?.length}`);
        } else {
          if (!error.message.includes('Invalid schema') && !error.message.includes('Could not find')) {
            console.log(`⚠️ Schema [${s}.${t}] Error: ${error.message}`);
          }
        }
      } catch (e: any) {
        // quiet
      }
    }
  }
}

testSchemas();
