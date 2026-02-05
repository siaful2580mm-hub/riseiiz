
-- ==========================================
-- 1. CLEANUP EVERYTHING (Force Reset)
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
-- DESIGNED TO NEVER FAIL
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    new_ref_code TEXT;
    input_referrer_code TEXT;
    actual_referrer_code TEXT := NULL;
    v_full_name TEXT;
    v_meta JSONB;
BEGIN
    -- Set search path to public to ensure we hit the right tables
    SET search_path TO public;

    -- 1. Safely handle metadata
    v_meta := COALESCE(new.raw_user_meta_data, '{}'::jsonb);
    v_full_name := COALESCE(v_meta->>'full_name', 'Riseii Member');

    -- 2. Generate unique referral code for the new user
    -- Try a simple approach first
    new_ref_code := 'RISE-' || substr(md5(new.id::text || random()::text), 1, 6);
    
    -- Ensure uniqueness (loop up to 5 times)
    FOR i IN 1..5 LOOP
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_ref_code) THEN
            EXIT;
        END IF;
        new_ref_code := 'RISE-' || substr(md5(new.id::text || i::text || random()::text), 1, 6);
    END LOOP;

    -- 3. Handle Referral Logic (Wrapped in its own block to prevent failures)
    BEGIN
        input_referrer_code := TRIM(UPPER(COALESCE(v_meta->>'referral_id', '')));
        
        IF input_referrer_code <> '' THEN
            -- Check if referrer exists and update their count
            IF EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = input_referrer_code) THEN
                actual_referrer_code := input_referrer_code;
                
                UPDATE public.profiles 
                SET referral_count = referral_count + 1 
                WHERE referral_code = actual_referrer_code;
            END IF;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- If referral logic fails, don't stop the user creation
        actual_referrer_code := NULL;
    END;

    -- 4. Create the profile record
    -- Using security definer and robust insert
    BEGIN
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
            v_full_name,
            new_ref_code,
            actual_referrer_code,
            0,
            'user',
            false,
            false,
            'none',
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);
    EXCEPTION WHEN OTHERS THEN
        -- Last resort: Log error or ignore to allow auth.users creation
    END;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 3. TABLES DEFINITION (Ensure structure)
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

-- ==========================================
-- 4. TRIGGER SETUP
-- ==========================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure proper permissions for trigger to write to public schema
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
