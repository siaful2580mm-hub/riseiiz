
import { createClient } from '@supabase/supabase-js';

// আপনার সুপাবেস ড্যাশবোর্ড থেকে পাওয়া URL এবং Key এখানে বসান। 
// ভার্সেলে ডেপ্লয় করলে এগুলোকে Environment Variables হিসেবে সেট করা উচিত।
const supabaseUrl = (window as any).process?.env?.SUPABASE_URL || 'https://YOUR_PROJECT_ID.supabase.co';
const supabaseAnonKey = (window as any).process?.env?.SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
