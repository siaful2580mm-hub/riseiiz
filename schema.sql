
-- 1. Function to generate a random referral code
CREATE OR REPLACE FUNCTION generate_referral_code() RETURNS TEXT AS $$
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

-- 2. Trigger function to create a profile on signup and handle referrals
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    new_ref_code TEXT;
    referrer_code TEXT;
    referrer_exists BOOLEAN;
BEGIN
    -- Generate unique code for new user
    new_ref_code := generate_referral_code();
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_ref_code) LOOP
        new_ref_code := generate_referral_code();
    END LOOP;

    -- Extract referral code from signup metadata
    referrer_code := (new.raw_user_meta_data->>'referral_id');

    -- If referrer exists, validate and update them
    IF referrer_code IS NOT NULL AND referrer_code <> '' THEN
        SELECT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = referrer_code) INTO referrer_exists;
        
        IF referrer_exists THEN
            -- Increment referrer's count
            UPDATE public.profiles 
            SET referral_count = referral_count + 1 
            WHERE referral_code = referrer_code;
        ELSE
            referrer_code := NULL; -- Invalid referral code, set to null
        END IF;
    END IF;

    -- Create the profile
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        referral_code, 
        referred_by,
        balance,
        role
    )
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
        new_ref_code,
        referrer_code,
        0,
        'user'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PROFILES TABLE (Updated for clarity)
CREATE TABLE IF NOT EXISTS profiles (
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

-- SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
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

-- Ensure defaults
INSERT INTO system_settings (id, notice_text, is_maintenance, require_activation)
VALUES (1, 'Welcome to Riseii Pro!', false, true)
ON CONFLICT (id) DO NOTHING;

-- TASKS & SUBMISSIONS
CREATE TABLE IF NOT EXISTS tasks (
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

CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  proof_data TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS activations (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  method TEXT,
  transaction_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT,
  amount NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for setup)
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Settings are viewable by everyone" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Tasks are viewable by everyone" ON tasks FOR SELECT USING (true);
CREATE POLICY "Own data viewable" ON submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own transactions viewable" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow signup" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
