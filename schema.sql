
-- ==========================================
-- 1. BASE TABLES
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
-- 3. ROBUST TRIGGER FOR AUTO PROFILE & REFERRAL
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_ref_code TEXT;
    referrer_id UUID;
    ref_bonus NUMERIC;
    extracted_ref_code TEXT;
BEGIN
    -- 1. Generate unique referral code for the new user (RP-XXXXX)
    new_ref_code := 'RP-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 8));

    -- 2. Get settings
    SELECT referral_reward INTO ref_bonus FROM public.system_settings WHERE id = 1;
    IF ref_bonus IS NULL THEN ref_bonus := 5; END IF;

    -- 3. Robustly extract referral code from metadata
    -- Trying multiple potential keys for better compatibility
    extracted_ref_code := COALESCE(
        new.raw_user_meta_data->>'referred_by',
        new.raw_user_meta_data->>'referral_id',
        new.raw_user_meta_data->>'referrer'
    );
    
    -- Clean the extracted code
    IF extracted_ref_code IS NOT NULL THEN
        extracted_ref_code := UPPER(TRIM(extracted_ref_code));
        IF extracted_ref_code = '' THEN extracted_ref_code := NULL; END IF;
    END IF;

    -- 4. Handle Referrer Reward Logic
    IF extracted_ref_code IS NOT NULL THEN
        -- Find the referrer profile
        SELECT id INTO referrer_id FROM public.profiles 
        WHERE referral_code = extracted_ref_code;

        IF referrer_id IS NOT NULL THEN
            -- Update Referrer Balance and Count
            UPDATE public.profiles 
            SET balance = balance + ref_bonus,
                referral_count = referral_count + 1
            WHERE id = referrer_id;

            -- Log Transaction for Referrer
            INSERT INTO public.transactions (user_id, type, amount, description)
            VALUES (referrer_id, 'bonus', ref_bonus, 'Referral Reward for: ' || COALESCE(new.raw_user_meta_data->>'full_name', 'new user'));
        END IF;
    END IF;

    -- 5. Create the Profile record
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
        extracted_ref_code, -- Save the clean referral code
        10 -- Give joining bonus (optional)
    );

    RETURN new;
EXCEPTION WHEN OTHERS THEN
    -- Safety Fallback: Ensure user can still log in even if referral logic fails
    INSERT INTO public.profiles (id, email, full_name, referral_code)
    VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', 'Member'), 'RP-' || SUBSTRING(new.id::TEXT, 1, 8));
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 4. POLICIES (Idempotent)
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON public.system_settings TO anon, authenticated;
