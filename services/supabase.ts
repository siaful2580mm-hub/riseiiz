
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (window as any).process?.env?.SUPABASE_URL || 'https://YOUR_PROJECT_ID.supabase.co';
const supabaseAnonKey = (window as any).process?.env?.SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

// Check if keys are still placeholders
export const isSupabaseConfigured = 
  supabaseUrl !== 'https://YOUR_PROJECT_ID.supabase.co' && 
  supabaseAnonKey !== 'YOUR_ANON_KEY' &&
  supabaseUrl.startsWith('https://');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
