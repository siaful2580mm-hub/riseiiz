
-- ==========================================
-- 1. EXTENDED TABLES DEFINITION
-- ==========================================

CREATE TABLE IF NOT EXISTS public.system_settings (
  id BIGINT PRIMARY KEY DEFAULT 1,
  notice_text TEXT,
  notice_link TEXT,
  global_notice TEXT,
  min_withdrawal NUMERIC DEFAULT 250,
  activation_fee NUMERIC DEFAULT 30,
  referral_reward NUMERIC DEFAULT 5,
  support_url TEXT DEFAULT 'https://t.me/riseiipro',
  is_maintenance BOOLEAN DEFAULT false,
  require_activation BOOLEAN DEFAULT true
);

-- Initialize settings if not exists
INSERT INTO public.system_settings (id, notice_text, notice_link, global_notice, support_url)
VALUES (1, 'Welcome to Riseii Pro! Check our latest updates.', '/notice', '<h1>Welcome to Riseii Pro</h1><p>Start your journey as a micro-worker today. Earn by completing simple tasks.</p>', 'https://t.me/riseiipro')
ON CONFLICT (id) DO NOTHING;

-- Ensure profiles has all needed columns (re-run safely)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS support_uid TEXT;

-- ==========================================
-- 2. UPDATED PERMISSIONS
-- ==========================================
GRANT SELECT, UPDATE ON public.system_settings TO authenticated;
GRANT SELECT ON public.system_settings TO anon;
