
-- ==========================================
-- 1. SYSTEM SETTINGS SCHEMA UPDATE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.system_settings (
  id BIGINT PRIMARY KEY DEFAULT 1,
  notice_text TEXT,
  notice_link TEXT,
  global_notice TEXT,
  min_withdrawal NUMERIC DEFAULT 250,
  activation_fee NUMERIC DEFAULT 30,
  is_maintenance BOOLEAN DEFAULT false,
  require_activation BOOLEAN DEFAULT true
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='system_settings' AND column_name='support_url') THEN
        ALTER TABLE public.system_settings ADD COLUMN support_url TEXT DEFAULT 'https://t.me/riseiipro';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='system_settings' AND column_name='referral_reward') THEN
        ALTER TABLE public.system_settings ADD COLUMN referral_reward NUMERIC DEFAULT 5;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='system_settings' AND column_name='banner_ads_code') THEN
        ALTER TABLE public.system_settings ADD COLUMN banner_ads_code TEXT DEFAULT '<div style="padding: 20px; text-align: center; color: #444; border: 2px dashed #333; border-radius: 15px;">Your Ad Script Here</div>';
    END IF;
END $$;

-- Initialize or Update the default settings record
INSERT INTO public.system_settings (id, notice_text, notice_link, global_notice, support_url, min_withdrawal, activation_fee)
VALUES (1, 'Welcome to Riseii Pro! Check our latest updates.', '/notice', '<h1>Welcome</h1><p>Start earning today!</p>', 'https://t.me/riseiipro', 250, 30)
ON CONFLICT (id) DO UPDATE SET
  support_url = EXCLUDED.support_url,
  min_withdrawal = EXCLUDED.min_withdrawal,
  activation_fee = EXCLUDED.activation_fee;

-- ==========================================
-- 2. TASK SCHEMA UPDATE (is_featured)
-- ==========================================
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='is_featured') THEN
        ALTER TABLE public.tasks ADD COLUMN is_featured BOOLEAN DEFAULT false;
    END IF;
END $$;

-- ==========================================
-- 3. SAMPLE DATA FOR FB WORK & TRUST
-- ==========================================
INSERT INTO public.tasks (title, description, category, reward_amount, link, proof_type, copy_text, is_active, is_featured)
VALUES ('Facebook Post (Share Our Site)', 'আমাদের সাইট সম্পর্কে একটি পোস্ট আপনার ফেসবুক ওয়ালে শেয়ার করুন। পোস্টটি পাবলিক হতে হবে। স্ক্রিনশট প্রমান হিসেবে জমা দিন।', 'facebook', 15, 'https://riseiipro.vercel.app', 'image', 'Riseii Pro-তে কাজ করে প্রতিদিন দারুণ ইনকাম করছি! আপনারাও আজই যোগ দিন।', true, true)
ON CONFLICT DO NOTHING;

-- ==========================================
-- 4. PERMISSIONS
-- ==========================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.system_settings TO anon, authenticated;
GRANT UPDATE ON public.system_settings TO authenticated;
