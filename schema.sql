
-- ==========================================
-- 1. CLEANUP & TYPE FIXES (Run this first)
-- ==========================================

-- Drop the problematic constraint if it exists
ALTER TABLE IF EXISTS public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_referred_by_fkey;

-- Change column type to TEXT
ALTER TABLE IF EXISTS public.profiles 
  ALTER COLUMN referred_by TYPE TEXT;

-- ==========================================
-- 2. BASE TABLES
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
    referred_by TEXT, -- Stores codes like RP-XXXXXX
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
-- 3. TRIGGER FOR NEW USERS
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_ref_code TEXT;
BEGIN
    -- Generate a unique referral code for the new user
    new_ref_code := 'RP-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 8));

    INSERT INTO public.profiles (
        id, email, full_name, referral_code, balance
    )
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Riseii Member'),
        new_ref_code,
        10 -- Welcome Bonus
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 4. RLS POLICIES (Idempotent)
-- ==========================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are public" ON public.profiles;
CREATE POLICY "Profiles are public" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tasks are public" ON public.tasks;
CREATE POLICY "Tasks are public" ON public.tasks FOR SELECT USING (true);

-- Submissions
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own submissions" ON public.submissions;
CREATE POLICY "Users see own submissions" ON public.submissions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can submit tasks" ON public.submissions;
CREATE POLICY "Users can submit tasks" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own transactions" ON public.transactions;
CREATE POLICY "Users see own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

-- Settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Settings are public" ON public.system_settings;
CREATE POLICY "Settings are public" ON public.system_settings FOR SELECT USING (true);

-- Withdrawals
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own withdrawals" ON public.withdrawals;
CREATE POLICY "Users see own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create withdrawals" ON public.withdrawals;
CREATE POLICY "Users can create withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Activations
ALTER TABLE public.activations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own activations" ON public.activations;
CREATE POLICY "Users see own activations" ON public.activations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create activations" ON public.activations;
CREATE POLICY "Users can create activations" ON public.activations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
