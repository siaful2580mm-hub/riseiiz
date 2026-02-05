
-- ==========================================
-- 1. BASE TABLES (IF NOT EXIST)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    balance NUMERIC DEFAULT 0,
    role TEXT DEFAULT 'user',
    referral_code TEXT UNIQUE,
    referred_by TEXT,
    referral_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT false,
    is_banned BOOLEAN DEFAULT false,
    kyc_status TEXT DEFAULT 'none',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT,
    amount NUMERIC,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. SYSTEM SETTINGS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.system_settings (
    id BIGINT PRIMARY KEY DEFAULT 1,
    notice_text TEXT DEFAULT 'Welcome to Riseii Pro!',
    notice_link TEXT DEFAULT '/notice',
    global_notice TEXT DEFAULT '<h1>Welcome</h1>',
    min_withdrawal NUMERIC DEFAULT 250,
    activation_fee NUMERIC DEFAULT 30,
    referral_reward NUMERIC DEFAULT 5,
    support_url TEXT DEFAULT 'https://t.me/riseiipro',
    banner_ads_code TEXT DEFAULT '',
    is_maintenance BOOLEAN DEFAULT false,
    require_activation BOOLEAN DEFAULT true
);

INSERT INTO public.system_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ==========================================
-- 3. TRIGGER FOR AUTO PROFILE & REFERRAL
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_ref_code TEXT;
    referrer_id UUID;
    ref_bonus NUMERIC;
BEGIN
    -- Generate unique referral code (RP-XXXXX)
    new_ref_code := 'RP-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 8));

    -- Get referral reward amount from settings
    SELECT referral_reward INTO ref_bonus FROM public.system_settings WHERE id = 1;
    IF ref_bonus IS NULL THEN ref_bonus := 5; END IF;

    -- Handle Referral Logic
    IF (new.raw_user_meta_data->>'referred_by') IS NOT NULL AND (new.raw_user_meta_data->>'referred_by') <> '' THEN
        -- Find the user who owns this referral code
        SELECT id INTO referrer_id FROM public.profiles 
        WHERE referral_code = UPPER(TRIM(new.raw_user_meta_data->>'referred_by'));

        IF referrer_id IS NOT NULL THEN
            -- Give reward to referrer
            UPDATE public.profiles 
            SET balance = balance + ref_bonus,
                referral_count = referral_count + 1
            WHERE id = referrer_id;

            -- Record transaction for referrer
            INSERT INTO public.transactions (user_id, type, amount, description)
            VALUES (referrer_id, 'bonus', ref_bonus, 'Referral Bonus for new member: ' || (new.raw_user_meta_data->>'full_name'));
        END IF;
    END IF;

    -- Create the new profile
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        referral_code, 
        referred_by,
        balance
    )
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Member'),
        new_ref_code,
        UPPER(TRIM(new.raw_user_meta_data->>'referred_by')),
        10 -- Welcome bonus for the new user
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 4. TASKS & PERMISSIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    reward_amount NUMERIC DEFAULT 0,
    link TEXT,
    proof_type TEXT DEFAULT 'image',
    copy_text TEXT,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.tasks (title, description, category, reward_amount, link, proof_type, copy_text, is_active, is_featured)
VALUES ('Facebook Post (Official Promo)', 'আমাদের সাইট নিয়ে ফেসবুকে একটি পাবলিক পোস্ট করুন। পোস্টের স্ক্রিনশট প্রুফ হিসেবে জমা দিন।', 'facebook', 15, 'https://riseiipro.vercel.app', 'image', 'Riseii Pro-তে কাজ শুরু করলাম! আপনারাও যোগ দিন এবং প্রতিদিন ইনকাম করুন।', true, true)
ON CONFLICT DO NOTHING;

-- Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON public.system_settings TO anon, authenticated;
