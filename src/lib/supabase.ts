import { createClient } from '@supabase/supabase-js';

const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const envSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!envSupabaseUrl || !envSupabaseAnonKey) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL ან VITE_SUPABASE_ANON_KEY არ არის განსაზღვრული .env ფაილში. გთხოვთ გაუწეროთ გარემოს ცვლადები.'
  );
}

const supabaseUrl = envSupabaseUrl || 'https://enjnwxpzafroxapksdlt.supabase.co';
const supabaseAnonKey = envSupabaseAnonKey || 'sb_publishable_dpO82-UPWGqkk2Z5eJ2SAA_-119eWfN';

if (!/^https?:\/\/.+/i.test(supabaseUrl)) {
  throw new Error('[Supabase] არასწორი VITE_SUPABASE_URL ფორმატი.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});
