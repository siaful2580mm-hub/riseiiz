
-- ==========================================
-- 1. CLEANUP EVERYTHING
-- ==========================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ==========================================
-- 2. TABLES DEFINITION (Ensure existence)
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

CREATE TABLE IF NOT EXISTS public.transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'earning', 'withdraw', 'bonus', 'activation'
  amount NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 3. CORE TRIGGER FUNCTION
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
    v_referrer_id UUID;
    v_welcome_bonus NUMERIC := 10.00;
    v_referral_bonus NUMERIC := 5.00;
BEGIN
    -- 1. Safely extract metadata
    v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', 'Riseii Member');
    v_ref_id := TRIM(UPPER(COALESCE(new.raw_user_meta_data->>'referral_id', '')));

    -- 2. Generate a unique referral code
    v_new_code := 'RISE-' || UPPER(SUBSTR(MD5(new.id::text || RANDOM()::text), 1, 6));

    -- 3. Insert the profile record with Welcome Bonus
    INSERT INTO public.profiles (
        id, email, full_name, referral_code, referred_by, balance, role
    )
    VALUES (
        new.id, new.email, v_full_name, v_new_code, 
        CASE WHEN v_ref_id = '' THEN NULL ELSE v_ref_id END,
        v_welcome_bonus, 'user'
    );

    -- 4. Log Welcome Bonus Transaction
    INSERT INTO public.transactions (user_id, type, amount, description)
    VALUES (new.id, 'bonus', v_welcome_bonus, 'Welcome Bonus');

    -- 5. Handle Referrer Logic
    IF v_ref_id <> '' THEN
        -- Find referrer
        SELECT id INTO v_referrer_id FROM public.profiles WHERE referral_code = v_ref_id;
        
        IF v_referrer_id IS NOT NULL THEN
            -- Update Referrer Balance and Count
            UPDATE public.profiles 
            SET balance = balance + v_referral_bonus,
                referral_count = referral_count + 1 
            WHERE id = v_referrer_id;

            -- Log Referral Bonus Transaction for Referrer
            INSERT INTO public.transactions (user_id, type, amount, description)
            VALUES (v_referrer_id, 'bonus', v_referral_bonus, 'Referral Bonus (New User: ' || v_full_name || ')');
        END IF;
    END IF;

    RETURN new;
END;
$$;

-- ==========================================
-- 4. RE-BIND TRIGGER
-- ==========================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Reset permissions
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT ALL ON public.transactions TO postgres, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
