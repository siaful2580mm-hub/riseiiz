
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cetmeibdbnxoqfnrrdzn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNldG1laWJkYm54b3FmbnJyZHpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDE5MDYsImV4cCI6MjA4NTc3NzkwNn0.30liUik1etEB2mLedQhskQz5Zw-mxKJJ0KbMa9fVtBs';

// Configuration check
// Add explicit string casts to avoid TypeScript errors regarding non-overlapping literal types
export const isSupabaseConfigured = 
  (supabaseUrl as string) !== 'https://YOUR_PROJECT_ID.supabase.co' && 
  (supabaseAnonKey as string) !== 'YOUR_ANON_KEY' &&
  supabaseUrl.startsWith('https://');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
