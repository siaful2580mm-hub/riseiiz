
-- ==========================================
-- 1. CLEANUP EVERYTHING
-- ==========================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ==========================================
-- 2. CORE TRIGGER FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_full_name TEXT;
    v_ref_id TEXT;
    v_new_code TEXT;
BEGIN
    -- 1. Safely extract metadata
    v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', 'Riseii Member');
    v_ref_id := TRIM(UPPER(COALESCE(new.raw_user_meta_data->>'referral_id', '')));

    -- 2. Generate a unique referral code
    -- Simple random string to avoid complex loops that might time out
    v_new_code := 'RISE-' || UPPER(SUBSTR(MD5(new.id::text || RANDOM()::text), 1, 6));

    -- 3. Insert the profile record
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
            v_new_code,
            CASE WHEN v_ref_id = '' THEN NULL ELSE v_ref_id END,
            0,
            'user',
            false,
            false,
            'none',
            NOW()
        );
    EXCEPTION WHEN OTHERS THEN
        -- If insert fails (e.g. unique constraint), we try one more time with a different code
        v_new_code := 'RISE-' || UPPER(SUBSTR(MD5(new.id::text || 'RETRY' || RANDOM()::text), 1, 6));
        INSERT INTO public.profiles (id, email, full_name, referral_code)
        VALUES (new.id, new.email, v_full_name, v_new_code)
        ON CONFLICT (id) DO NOTHING;
    END;

    -- 4. Update Referrer's count (Completely isolated)
    IF v_ref_id <> '' THEN
        BEGIN
            UPDATE public.profiles 
            SET referral_count = referral_count + 1 
            WHERE referral_code = v_ref_id;
        EXCEPTION WHEN OTHERS THEN
            -- Ignore referrer errors to ensure user creation succeeds
        END;
    END IF;

    RETURN new;
END;
$$;

-- ==========================================
-- 3. TABLES DEFINITION (Safe Check)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  balance NUMERIC DEFAULT 0,
  role TEXT DEFAULT 'user',
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  referral_count INTEGER DEFAULT 0,
  is_banned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT false,
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

-- ==========================================
-- 4. RE-BIND TRIGGER
-- ==========================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Reset permissions
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
