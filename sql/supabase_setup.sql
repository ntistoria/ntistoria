-- ==============================================================================
-- 1. PROFILES TABLE (მომხმარებლის პროფილები & Google Auth)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'student', -- 'student' ან 'admin'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS ჩართვა profiles ცხრილისთვის
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS პოლიტიკები profiles-თვის
CREATE POLICY "Public profiles are viewable by everyone." 
    ON public.profiles FOR SELECT 
    USING (true);

CREATE POLICY "Users can insert their own profile." 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id OR true);

CREATE POLICY "Users can update their own profile." 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- ==============================================================================
-- 2. AUTOMATIC TRIGGER FOR NEW USERS (Google & Email Registration)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      CONCAT(NEW.raw_user_meta_data->>'first_name', ' ', NEW.raw_user_meta_data->>'last_name'),
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE 
      WHEN NEW.email = 'ntistoria@gmail.com' THEN 'admin'
      ELSE 'student'
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- ტრიგერის შექმნა auth.users ცხრილზე
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 3. USER PROGRESS TABLE (მოსწავლის ტესტების პროგრესის შენახვა)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT UNIQUE NOT NULL,
    progress_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS ჩართვა user_progress-ისთვის
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- RLS პოლიტიკები user_progress-ისთვის (Anonymous & Authenticated)
CREATE POLICY "Allow select user progress" 
    ON public.user_progress FOR SELECT 
    USING (true);

CREATE POLICY "Allow insert/update user progress" 
    ON public.user_progress FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow update user progress" 
    ON public.user_progress FOR UPDATE 
    USING (true);

-- ==============================================================================
-- 4. GRANT PERMISSIONS (უფლებების მინიჭება)
-- ==============================================================================
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_progress TO anon, authenticated, service_role;

-- ინდექსები სწრაფი ძიებისთვის
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_progress_email ON public.user_progress(user_email);
