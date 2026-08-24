import { supabase } from './supabase';

export interface UserProfile {
  id?: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch user profile from Supabase `profiles` table
 */
export const fetchUserProfile = async (emailOrId: string): Promise<UserProfile | null> => {
  if (!emailOrId) return null;
  const cleanStr = emailOrId.toLowerCase().trim();

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`email.eq.${cleanStr},id.eq.${cleanStr}`)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        email: data.email,
        full_name: data.full_name || data.name || cleanStr.split('@')[0],
        avatar_url: data.avatar_url,
        role: data.role || 'student'
      };
    }
  } catch (err) {
    console.warn('Error fetching profile from Supabase:', err);
  }

  return null;
};

/**
 * Sync / Upsert user profile into Supabase `profiles` table
 */
export const syncUserProfile = async (profile: Partial<UserProfile> & { email: string }): Promise<UserProfile> => {
  const cleanEmail = profile.email.toLowerCase().trim();
  const fullName = profile.full_name || cleanEmail.split('@')[0];

  const profilePayload = {
    email: cleanEmail,
    full_name: fullName,
    avatar_url: profile.avatar_url || null,
    role: profile.role || (cleanEmail === 'ntistoria@gmail.com' ? 'admin' : 'student'),
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'email' })
      .select()
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        email: data.email,
        full_name: data.full_name || fullName,
        avatar_url: data.avatar_url,
        role: data.role
      };
    }
  } catch (err) {
    console.warn('Error upserting profile in Supabase:', err);
  }

  return {
    email: cleanEmail,
    full_name: fullName,
    role: profilePayload.role
  };
};
