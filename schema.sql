
-- ==========================================
-- 1. BASE TABLES
-- ==========================================

-- Profiles Table
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
    kyc_full_name TEXT,
    kyc_id_number TEXT,
    kyc_document_url TEXT,
    kyc_age INTEGER,
    kyc_dob DATE,
    kyc_address TEXT,
    kyc_phone TEXT,
    kyc_profession TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'other',
    reward_amount NUMERIC DEFAULT 0,
    link TEXT,
    proof_type TEXT DEFAULT 'image',
    copy_text TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Submissions Table
CREATE TABLE IF NOT EXISTS public.submissions (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    proof_data TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT, -- 'earning', 'withdraw', 'bonus', 'activation'
    amount NUMERIC,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Withdrawals Table
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC,
    method TEXT,
    wallet_number TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activations Table
CREATE TABLE IF NOT EXISTS public.activations (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    method TEXT,
    transaction_id TEXT UNIQUE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- System Settings
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
-- 2. ROBUST TRIGGER FOR NEW USERS
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_ref_code TEXT;
    referrer_id UUID;
    ref_bonus NUMERIC;
    extracted_ref_code TEXT;
BEGIN
    -- 1. Generate unique referral code for the new user
    new_ref_code := 'RP-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 8));

    -- 2. Get Reward Settings
    SELECT referral_reward INTO ref_bonus FROM public.system_settings WHERE id = 1;
    IF ref_bonus IS NULL THEN ref_bonus := 5; END IF;

    -- 3. Extract referral code from metadata safely
    extracted_ref_code := UPPER(TRIM(new.raw_user_meta_data->>'referred_by'));
    IF extracted_ref_code = '' THEN extracted_ref_code := NULL; END IF;

    -- 4. Create the Profile First (To satisfy FK constraints in transactions)
    INSERT INTO public.profiles (
        id, email, full_name, referral_code, referred_by, balance
    )
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Riseii Member'),
        new_ref_code,
        extracted_ref_code,
        10 -- Joining Bonus
    );

    -- 5. If referred, process bonus
    IF extracted_ref_code IS NOT NULL THEN
        SELECT id INTO referrer_id FROM public.profiles WHERE referral_code = extracted_ref_code;
        
        IF referrer_id IS NOT NULL THEN
            -- Update Referrer
            UPDATE public.profiles 
            SET balance = balance + ref_bonus,
                referral_count = referral_count + 1
            WHERE id = referrer_id;

            -- Log Transaction for Referrer
            INSERT INTO public.transactions (user_id, type, amount, description)
            VALUES (referrer_id, 'bonus', ref_bonus, 'Referral Reward for inviting ' || new.email);
        END IF;
    END IF;

    RETURN new;
EXCEPTION WHEN OTHERS THEN
    -- Fallback: Ensure user is created even if referral logic fails
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 3. RLS POLICIES
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are public" ON public.profiles;
CREATE POLICY "Profiles are public" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tasks are public" ON public.tasks FOR SELECT USING (true);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own submissions" ON public.submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can submit tasks" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings are public" ON public.system_settings FOR SELECT USING (true);

-- Admin Privileges (Service Role / Manual Override)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
