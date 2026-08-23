import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vqkpacwswksgvhuczrbw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxa3BhY3dzd2tzZ3ZodWN6cmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwODQ2MzAsImV4cCI6MjEwMjY2MDYzMH0.WFqrSJvxnJyelW1kCWYZGg3I5M54Vbrm3McFPuA_zsg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findTables() {
  console.log('=== SEARCHING FOR ALL PUBLIC TABLES IN SUPABASE ===');

  // Fetch OpenApi schema from Supabase PostgREST endpoint directly
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });

    if (res.ok) {
      const openApi = await res.json();
      console.log('OpenAPI definitions found:', Object.keys(openApi.definitions || {}));
      console.log('OpenAPI paths found:', Object.keys(openApi.paths || {}));
    } else {
      console.log('REST v1 info response status:', res.status, await res.text());
    }
  } catch (e: any) {
    console.error('Error fetching OpenAPI spec:', e.message);
  }
}

findTables();
