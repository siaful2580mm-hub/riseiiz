
-- ==========================================
-- 1. CLEANUP EVERYTHING (Absolute Reset)
-- ==========================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.generate_referral_code() CASCADE;

-- ==========================================
-- 2. CORE FUNCTIONS
-- ==========================================

-- Function to generate a random unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code() 
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := 'RISE-';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for automatic profile creation on signup
-- Improved robustness and error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    new_ref_code TEXT;
    input_referrer_code TEXT;
    actual_referrer_code TEXT := NULL;
    referrer_exists BOOLEAN := false;
BEGIN
    -- 1. Generate unique referral code for the new user
    -- We use a loop and a retry mechanism
    FOR i IN 1..5 LOOP
        new_ref_code := public.generate_referral_code();
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_ref_code);
    END LOOP;

    -- 2. Get referrer code from signup metadata
    -- Sanitize: trim and uppercase
    input_referrer_code := TRIM(UPPER(new.raw_user_meta_data->>'referral_id'));

    -- 3. If a referrer code was provided, validate it
    IF input_referrer_code IS NOT NULL AND input_referrer_code <> '' THEN
        SELECT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = input_referrer_code) INTO referrer_exists;
        
        IF referrer_exists THEN
            actual_referrer_code := input_referrer_code;
            
            -- Increment referrer's count
            UPDATE public.profiles 
            SET referral_count = referral_count + 1 
            WHERE referral_code = actual_referrer_code;
        END IF;
    END IF;

    -- 4. Create the profile record
    -- We use SECURITY DEFINER to bypass RLS during signup
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        referral_code, 
        referred_by,
        balance,
        role,
        is_active,
        is_banned,
        kyc_status,
        created_at
    )
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Member'),
        new_ref_code,
        actual_referrer_code,
        0,
        'user',
        false,
        false,
        'none',
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN new;
EXCEPTION WHEN OTHERS THEN
    -- If any error happens, WE MUST STILL RETURN 'new'
    -- This ensures the auth.users record is created even if profiles fail
    -- This is a failsafe to prevent the 'Database error' blocking the user
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 3. TABLES DEFINITION (with IF NOT EXISTS)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  balance NUMERIC DEFAULT 0,
  role TEXT CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  referral_count INTEGER DEFAULT 0,
  is_banned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT false,
  kyc_status TEXT CHECK (kyc_status IN ('none', 'pending', 'verified', 'rejected')) DEFAULT 'none',
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

CREATE TABLE IF NOT EXISTS public.system_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  notice_text TEXT,
  notice_link TEXT,
  global_notice TEXT,
  banner_ads_code TEXT,
  min_withdrawal NUMERIC DEFAULT 250,
  activation_fee NUMERIC DEFAULT 30,
  is_maintenance BOOLEAN DEFAULT false,
  require_activation BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.system_settings (id, notice_text, is_maintenance, require_activation)
VALUES (1, 'Welcome to Riseii Pro!', false, true)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  reward_amount NUMERIC NOT NULL,
  link TEXT,
  proof_type TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.submissions (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  proof_data TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.activations (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  method TEXT,
  transaction_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT,
  amount NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.withdrawals (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  method TEXT,
  wallet_number TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 4. TRIGGER SETUP
-- ==========================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 5. RLS & POLICIES
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow insert on signup" ON public.profiles;
CREATE POLICY "Allow insert on signup" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Settings viewable by all" ON public.system_settings;
CREATE POLICY "Settings viewable by all" ON public.system_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Tasks viewable by all" ON public.tasks;
CREATE POLICY "Tasks viewable by all" ON public.tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Own submissions" ON public.submissions;
CREATE POLICY "Own submissions" ON public.submissions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Insert submissions" ON public.submissions;
CREATE POLICY "Insert submissions" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Own transactions" ON public.transactions;
CREATE POLICY "Own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Own withdrawals" ON public.withdrawals;
CREATE POLICY "Own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Own activations" ON public.activations;
CREATE POLICY "Own activations" ON public.activations FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins full access" ON public.system_settings;
CREATE POLICY "Admins full access" ON public.system_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin')
);
