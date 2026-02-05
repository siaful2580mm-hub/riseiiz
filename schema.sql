-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CRITICAL: Grant permissions to auth admin for triggers
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;

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

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- TRIGGER FUNCTION (Corrected Syntax)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  target_referrer_id UUID;
  new_code TEXT;
BEGIN
  -- 1. Try to find the referrer safely
  BEGIN
    IF (NEW.raw_user_meta_data->>'referral_id') IS NOT NULL AND (NEW.raw_user_meta_data->>'referral_id') <> '' THEN
      SELECT id INTO target_referrer_id 
      FROM public.profiles 
      WHERE referral_code = upper(trim(NEW.raw_user_meta_data->>'referral_id')) 
      LIMIT 1;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    target_referrer_id := NULL;
  END;

  -- 2. Generate referral code
  new_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));

  -- 3. Insert the profile
  INSERT INTO public.profiles (id, email, full_name, role, referral_code, referred_by)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Member'), 
    CASE WHEN NEW.email = 'rakibulislamrovin@gmail.com' THEN 'admin' ELSE 'user' END, 
    new_code, 
    target_referrer_id
  );

  -- 4. Increment referral count safely (if update fails, user is still created)
  IF target_referrer_id IS NOT NULL THEN
    BEGIN
      UPDATE public.profiles SET referral_count = referral_count + 1 WHERE id = target_referrer_id;
    EXCEPTION WHEN OTHERS THEN
      -- Silently fail to ensure the primary user is created even if referral update fails
      NULL;
    END; -- Corrected: END instead of END IF for BEGIN block
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();