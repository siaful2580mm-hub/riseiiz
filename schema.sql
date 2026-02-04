
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  balance NUMERIC DEFAULT 0,
  role TEXT CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES profiles(id),
  referral_count INTEGER DEFAULT 0,
  is_banned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT false,
  kyc_status TEXT CHECK (kyc_status IN ('none', 'pending', 'verified')) DEFAULT 'none',
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

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    -- Standard Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Public profiles are viewable by everyone.') THEN
        CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile.') THEN
        CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
    -- Admin Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can update all profiles.') THEN
        CREATE POLICY "Admins can update all profiles." ON profiles FOR UPDATE USING (
          EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
        );
    END IF;
END $$;

-- ACTIVATIONS
CREATE TABLE IF NOT EXISTS activations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  transaction_id TEXT NOT NULL UNIQUE,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE activations ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activations' AND policyname = 'Users can view their own activations.') THEN
        CREATE POLICY "Users can view their own activations." ON activations FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activations' AND policyname = 'Users can insert their own activations.') THEN
        CREATE POLICY "Users can insert their own activations." ON activations FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activations' AND policyname = 'Admins can manage all activations.') THEN
        CREATE POLICY "Admins can manage all activations." ON activations FOR ALL USING (
          EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
        );
    END IF;
END $$;

-- TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  reward_amount NUMERIC NOT NULL,
  link TEXT,
  proof_type TEXT CHECK (proof_type IN ('image', 'text')) DEFAULT 'image',
  copy_text TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_category_check;
    ALTER TABLE tasks ADD CONSTRAINT tasks_category_check 
    CHECK (category IN ('youtube', 'facebook', 'instagram', 'twitter', 'tiktok', 'other'));

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Tasks are viewable by authenticated users.') THEN
        CREATE POLICY "Tasks are viewable by authenticated users." ON tasks FOR SELECT USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Admins can manage tasks.') THEN
        CREATE POLICY "Admins can manage tasks." ON tasks FOR ALL USING (
          EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
        );
    END IF;
END $$;

-- SUBMISSIONS
CREATE TABLE IF NOT EXISTS submissions (
  id BIGSERIAL PRIMARY KEY,
  task_id BIGINT REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  proof_data TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'submissions' AND policyname = 'Users can view their own submissions.') THEN
        CREATE POLICY "Users can view their own submissions." ON submissions FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'submissions' AND policyname = 'Users can insert their own submissions.') THEN
        CREATE POLICY "Users can insert their own submissions." ON submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'submissions' AND policyname = 'Admins can manage all submissions.') THEN
        CREATE POLICY "Admins can manage all submissions." ON submissions FOR ALL USING (
          EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
        );
    END IF;
END $$;

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('earning', 'withdraw', 'bonus', 'activation')),
  amount NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can view their own transactions.') THEN
        CREATE POLICY "Users can view their own transactions." ON transactions FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Admins can insert transactions.') THEN
        CREATE POLICY "Admins can insert transactions." ON transactions FOR INSERT WITH CHECK (
          EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
        );
    END IF;
END $$;

-- WITHDRAWALS
CREATE TABLE IF NOT EXISTS withdrawals (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL,
  wallet_number TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'withdrawals' AND policyname = 'Users can view own withdrawals.') THEN
        CREATE POLICY "Users can view own withdrawals." ON withdrawals FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'withdrawals' AND policyname = 'Users can insert own withdrawals.') THEN
        CREATE POLICY "Users can insert own withdrawals." ON withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'withdrawals' AND policyname = 'Admins can manage all withdrawals.') THEN
        CREATE POLICY "Admins can manage all withdrawals." ON withdrawals FOR ALL USING (
          EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
        );
    END IF;
END $$;

-- SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  notice_text TEXT,
  notice_link TEXT,
  banner_ads_code TEXT,
  min_withdrawal NUMERIC DEFAULT 250,
  activation_fee NUMERIC DEFAULT 30
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Settings are readable by all.') THEN
        CREATE POLICY "Settings are readable by all." ON system_settings FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Admins can update settings.') THEN
        CREATE POLICY "Admins can update settings." ON system_settings FOR UPDATE USING (
          EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
        );
    END IF;
END $$;

INSERT INTO system_settings (id, notice_text, min_withdrawal, activation_fee)
VALUES (1, 'Welcome to Riseii Pro! Complete tasks to earn.', 250, 30)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    assigned_role TEXT := 'user';
    referrer_id UUID;
    input_ref_code TEXT;
BEGIN
  IF NEW.email = 'rakibulislamrovin@gmail.com' THEN
    assigned_role := 'admin';
  END IF;

  input_ref_code := NEW.raw_user_meta_data->>'referral_id';

  IF input_ref_code IS NOT NULL AND input_ref_code <> '' THEN
    SELECT id INTO referrer_id FROM public.profiles WHERE referral_code = upper(input_ref_code);
  END IF;

  INSERT INTO public.profiles (id, email, full_name, referral_code, role, referred_by)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Member'),
    upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8)),
    assigned_role,
    referrer_id
  );

  IF referrer_id IS NOT NULL THEN
    UPDATE public.profiles SET referral_count = referral_count + 1 WHERE id = referrer_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'rakibulislamrovin@gmail.com';
