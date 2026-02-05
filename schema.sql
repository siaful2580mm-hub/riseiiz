
-- ==========================================
-- 1. BASE TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    balance NUMERIC DEFAULT 0,
    role TEXT DEFAULT 'user',
    referral_code TEXT UNIQUE,
    referred_by TEXT, -- This stores the referral code of the person who invited this user
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

-- ==========================================
-- 2. SYSTEM SETTINGS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.system_settings (
    id BIGINT PRIMARY KEY DEFAULT 1,
    notice_text TEXT DEFAULT 'Welcome to Riseii Pro!',
    notice_link TEXT DEFAULT '/notice',
    global_notice TEXT DEFAULT '<h1>Welcome to Riseii Pro</h1><p>Start earning today by completing simple micro-tasks.</p>',
    min_withdrawal NUMERIC DEFAULT 250,
    activation_fee NUMERIC DEFAULT 30,
    referral_reward NUMERIC DEFAULT 5,
    support_url TEXT DEFAULT 'https://t.me/riseiipro',
    banner_ads_code TEXT DEFAULT '',
    is_maintenance BOOLEAN DEFAULT false,
    require_activation BOOLEAN DEFAULT true
);

INSERT INTO public.system_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ==========================================
-- 3. UPDATED ROBUST TRIGGER
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_ref_code TEXT;
    referrer_id UUID;
    ref_bonus NUMERIC;
    input_ref_code TEXT;
BEGIN
    -- 1. Create a unique code for the new user
    new_ref_code := 'RP-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 8));

    -- 2. Fetch current reward settings
    SELECT referral_reward INTO ref_bonus FROM public.system_settings WHERE id = 1;
    IF ref_bonus IS NULL THEN ref_bonus := 5; END IF;

    -- 3. Extract the referral code from user metadata
    -- Supabase stores options.data in raw_user_meta_data
    input_ref_code := UPPER(TRIM(new.raw_user_meta_data->>'referred_by'));
    
    IF input_ref_code = '' THEN input_ref_code := NULL; END IF;

    -- 4. Process Referral Reward if code exists
    IF input_ref_code IS NOT NULL THEN
        -- Find the person who owns this code
        SELECT id INTO referrer_id FROM public.profiles 
        WHERE referral_code = input_ref_code;

        -- If found, credit them
        IF referrer_id IS NOT NULL THEN
            UPDATE public.profiles 
            SET balance = balance + ref_bonus,
                referral_count = referral_count + 1
            WHERE id = referrer_id;

            -- Create a record of this bonus
            INSERT INTO public.transactions (user_id, type, amount, description)
            VALUES (referrer_id, 'bonus', ref_bonus, 'Referral Bonus for ' || COALESCE(new.raw_user_meta_data->>'full_name', 'new member'));
        END IF;
    END IF;

    -- 5. Finalize Profile Creation
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        referral_code, 
        referred_by,
        balance
    )
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Riseii Member'),
        new_ref_code,
        input_ref_code, -- SAVE THE CODE HERE
        10 -- Welcome Bonus for the new user
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 4. POLICIES & PERMISSIONS
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON public.system_settings TO anon, authenticated;
