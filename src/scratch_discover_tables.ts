import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vqkpacwswksgvhuczrbw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxa3BhY3dzd2tzZ3ZodWN6cmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwODQ2MzAsImV4cCI6MjEwMjY2MDYzMH0.WFqrSJvxnJyelW1kCWYZGg3I5M54Vbrm3McFPuA_zsg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAllTables() {
  console.log('=== TESTING SUPABASE TABLES ===');
  
  const possibleTables = [
    // Georgian original names
    'არჩევითპასუხიანი',
    'რუკა',
    'ანალოგიები',
    'წყარო',
    'ქრონოლოგია',
    'ილუსტრაციები',
    'program',
    'subprogram',
    // English history_exam / public names
    'multiple_choice_questions',
    'maps',
    'maps_questions',
    'map_questions',
    'analogies',
    'analogy_questions',
    'sources',
    'source_questions',
    'chronology_questions',
    'illustrations',
    'illustration_questions',
    'ilustrations',
    'exam_programs',
    'exam_subprograms'
  ];

  for (const table of possibleTables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(3);

      if (error) {
        console.log(`❌ Table [public.${table}]: Error -> ${error.message}`);
      } else {
        console.log(`✅ Table [public.${table}]: FOUND! Count: ${count}`);
        if (data && data.length > 0) {
          console.log(`   Sample keys:`, Object.keys(data[0]));
          console.log(`   Sample row:`, JSON.stringify(data[0]).substring(0, 200));
        }
      }
    } catch (e: any) {
      console.log(`⚠️ Exception for ${table}:`, e.message);
    }
  }
}

testAllTables();
