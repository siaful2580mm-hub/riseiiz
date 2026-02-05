
-- PROFILES TABLE
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

-- Ensure all profile columns exist (MIGRATION)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_age INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_dob DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_profession TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_id_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_document_url TEXT;

-- SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  notice_text TEXT,
  notice_link TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Robust MIGRATION: Add missing columns individually
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS global_notice TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS banner_ads_code TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS min_withdrawal NUMERIC DEFAULT 250;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS activation_fee NUMERIC DEFAULT 30;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS is_maintenance BOOLEAN DEFAULT false;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS require_activation BOOLEAN DEFAULT true;

-- Default Settings (Upsert)
-- We only insert if id=1 doesn't exist, otherwise we update columns if they are null
INSERT INTO system_settings (id, notice_text, notice_link, global_notice, is_maintenance, require_activation)
VALUES (1, 'Welcome to Riseii Pro!', '/notice', '<h1>Platform Rules</h1><p>Welcome to our global notice page. Please follow all instructions carefully.</p>', false, true)
ON CONFLICT (id) DO UPDATE SET
  notice_text = EXCLUDED.notice_text,
  notice_link = EXCLUDED.notice_link,
  global_notice = COALESCE(system_settings.global_notice, EXCLUDED.global_notice),
  is_maintenance = COALESCE(system_settings.is_maintenance, EXCLUDED.is_maintenance),
  require_activation = COALESCE(system_settings.require_activation, EXCLUDED.require_activation);

-- TASKS TABLE
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  reward_amount NUMERIC NOT NULL,
  link TEXT,
  proof_type TEXT,
  copy_text TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  proof_data TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- WITHDRAWALS TABLE
CREATE TABLE IF NOT EXISTS withdrawals (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  method TEXT,
  wallet_number TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ACTIVATIONS TABLE
CREATE TABLE IF NOT EXISTS activations (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  method TEXT,
  transaction_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT,
  amount NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Select Policies (Using DO block to make it idempotent)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public profiles are viewable by everyone') THEN
        CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Settings are viewable by everyone') THEN
        CREATE POLICY "Settings are viewable by everyone" ON system_settings FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Active tasks are viewable by everyone') THEN
        CREATE POLICY "Active tasks are viewable by everyone" ON tasks FOR SELECT USING (is_active = true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own submissions') THEN
        CREATE POLICY "Users can view own submissions" ON submissions FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own withdrawals') THEN
        CREATE POLICY "Users can view own withdrawals" ON withdrawals FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own transactions') THEN
        CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert submissions') THEN
        CREATE POLICY "Users can insert submissions" ON submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can do anything') THEN
        CREATE POLICY "Admins can do anything" ON system_settings FOR ALL USING (
          EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
        );
    END IF;
END $$;
