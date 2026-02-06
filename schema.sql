
-- ==========================================
-- 1. CLEANUP & TYPE FIXES
-- ==========================================
ALTER TABLE IF EXISTS public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_referred_by_fkey;

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
    balance NUMERIC DEFAULT 15,
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

-- (Transactions table definition assuming it exists or needs creating)
CREATE TABLE IF NOT EXISTS public.transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT,
    amount NUMERIC,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- System Settings
CREATE TABLE IF NOT EXISTS public.system_settings (
    id BIGINT PRIMARY KEY DEFAULT 1,
    notice_text TEXT DEFAULT 'Welcome to Riseii Pro!',
    notice_link TEXT DEFAULT '/notice',
    global_notice TEXT DEFAULT '<h1>Welcome</h1>',
    min_withdrawal NUMERIC DEFAULT 250,
    activation_fee NUMERIC DEFAULT 30,
    referral_reward NUMERIC DEFAULT 15,
    support_url TEXT DEFAULT 'https://t.me/riseiipro',
    banner_ads_code TEXT DEFAULT '',
    is_maintenance BOOLEAN DEFAULT false,
    require_activation BOOLEAN DEFAULT true
);

-- ==========================================
-- 3. DATABASE FUNCTIONS (RPC)
-- ==========================================

-- Function to safely apply referral code (Bypasses RLS for balance update)
CREATE OR REPLACE FUNCTION public.apply_referral(target_user_id UUID, ref_code TEXT, bonus_amount NUMERIC)
RETURNS VOID AS $$
DECLARE
    referrer_id UUID;
    target_email TEXT;
BEGIN
    -- Find referrer
    SELECT id INTO referrer_id FROM public.profiles WHERE referral_code = ref_code;
    
    IF referrer_id IS NULL THEN
        RAISE EXCEPTION 'Invalid referral code';
    END IF;
    
    IF referrer_id = target_user_id THEN
        RAISE EXCEPTION 'Cannot use own referral code';
    END IF;

    -- Get target user email for logging
    SELECT email INTO target_email FROM public.profiles WHERE id = target_user_id;

    -- Update Referree (Current User)
    UPDATE public.profiles 
    SET balance = balance + bonus_amount,
        referred_by = ref_code
    WHERE id = target_user_id;

    -- Update Referrer
    UPDATE public.profiles 
    SET balance = balance + bonus_amount,
        referral_count = referral_count + 1
    WHERE id = referrer_id;

    -- Log transactions
    INSERT INTO public.transactions (user_id, type, amount, description)
    VALUES 
    (target_user_id, 'bonus', bonus_amount, 'Bonus for joining via ' || ref_code),
    (referrer_id, 'bonus', bonus_amount, 'Referral bonus for inviting ' || target_email);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_ref_code TEXT;
BEGIN
    new_ref_code := 'RP-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 8));

    INSERT INTO public.profiles (
        id, email, full_name, referral_code, balance
    )
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Riseii Member'),
        new_ref_code,
        15
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 4. RLS POLICIES
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are public" ON public.profiles;
CREATE POLICY "Profiles are public" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (
  auth.jwt() ->> 'email' = 'rakibulislamrovin@gmail.com'
);

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
