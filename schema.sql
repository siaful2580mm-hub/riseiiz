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

-- Safety: DROP and CREATE Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile." ON profiles;
CREATE POLICY "Users can insert own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  reward_amount NUMERIC NOT NULL,
  link TEXT,
  proof_type TEXT DEFAULT 'image',
  copy_text TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tasks are viewable by everyone" ON tasks;
CREATE POLICY "Tasks are viewable by everyone" ON tasks FOR SELECT USING (true);

-- SUBMISSIONS
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  proof_data TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own submissions" ON submissions;
CREATE POLICY "Users can view own submissions" ON submissions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own submissions" ON submissions;
CREATE POLICY "Users can insert own submissions" ON submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- WITHDRAWALS
CREATE TABLE IF NOT EXISTS withdrawals (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL,
  wallet_number TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own withdrawals" ON withdrawals;
CREATE POLICY "Users can view own withdrawals" ON withdrawals FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own withdrawals" ON withdrawals;
CREATE POLICY "Users can insert own withdrawals" ON withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ACTIVATIONS
CREATE TABLE IF NOT EXISTS activations (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  transaction_id TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE activations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own activations" ON activations;
CREATE POLICY "Users can view own activations" ON activations FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own activations" ON activations;
CREATE POLICY "Users can insert own activations" ON activations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('earning', 'withdraw', 'bonus', 'activation')),
  amount NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);

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

DROP POLICY IF EXISTS "Settings are readable by all." ON system_settings;
CREATE POLICY "Settings are readable by all." ON system_settings FOR SELECT USING (true);

-- INITIAL DATA
INSERT INTO system_settings (id, notice_text, notice_link, min_withdrawal, activation_fee)
VALUES (1, 'Riseii Pro-তে স্বাগতম! নিয়মিত কাজ করে বড় পুরস্কার জিতুন।', 'https://t.me/riseiipro', 250, 30)
ON CONFLICT (id) DO UPDATE SET notice_text = EXCLUDED.notice_text;

-- Sample tasks to ensure content exists
INSERT INTO tasks (title, description, category, reward_amount, link, proof_type)
VALUES 
('আমাদের ফেসবুক পেজ লাইক দিন', 'পেজ লাইক করে স্ক্রিনশট আপলোড করুন।', 'facebook', 5.00, 'https://facebook.com', 'image'),
('ইউটিউব চ্যানেল সাবস্ক্রাইব', 'চ্যানেলটি সাবস্ক্রাইব করে স্ক্রিনশট দিন।', 'youtube', 10.00, 'https://youtube.com', 'image'),
('ইনস্টাগ্রাম ফলো করুন', 'আমাদের ইনস্টাগ্রাম প্রোফাইল ফলো করে আপনার ইউজারনেম দিন।', 'instagram', 5.00, 'https://instagram.com', 'text')
ON CONFLICT DO NOTHING;

-- TRIGGER FUNCTION FOR NEW USERS (IMPROVED)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  target_referrer_id UUID;
  new_code TEXT;
  is_unique BOOLEAN := false;
BEGIN
  -- Search for referrer
  IF (NEW.raw_user_meta_data->>'referral_id') IS NOT NULL AND (NEW.raw_user_meta_data->>'referral_id') <> '' THEN
    SELECT id INTO target_referrer_id FROM public.profiles WHERE referral_code = upper(NEW.raw_user_meta_data->>'referral_id') LIMIT 1;
  END IF;

  -- Generate unique referral code
  WHILE NOT is_unique LOOP
    new_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
    SELECT NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_code) INTO is_unique;
  END LOOP;

  -- Create Profile
  INSERT INTO public.profiles (id, email, full_name, role, referral_code, referred_by)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Member'), 
    CASE WHEN NEW.email = 'rakibulislamrovin@gmail.com' THEN 'admin' ELSE 'user' END, 
    new_code, 
    target_referrer_id
  ) ON CONFLICT (id) DO NOTHING;

  -- Update referrer count if valid
  IF target_referrer_id IS NOT NULL THEN
    UPDATE public.profiles SET referral_count = referral_count + 1 WHERE id = target_referrer_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();