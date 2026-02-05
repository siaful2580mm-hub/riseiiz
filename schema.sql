
-- ==========================================
-- FIX FOR UUID SYNTAX ERROR
-- ==========================================
ALTER TABLE public.profiles 
  ALTER COLUMN referred_by SET DATA TYPE TEXT;

-- Profiles Table (Updated)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    balance NUMERIC DEFAULT 0,
    role TEXT DEFAULT 'user',
    referral_code TEXT UNIQUE,
    referred_by TEXT, -- Explicitly TEXT to store codes like RP-XXXXXX
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

-- Ensure RLS is updated for safe operations
DROP POLICY IF EXISTS "Profiles are public" ON public.profiles;
CREATE POLICY "Profiles are public" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Rest of the tables remain the same
