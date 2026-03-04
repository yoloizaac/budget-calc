
-- Step 1: Add user_id column (nullable initially) to all 5 tables
ALTER TABLE public.daily_log ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.transactions ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.funding ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.rent_payments ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.settings ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Step 2: Backfill existing data to isaaclum1209@gmail.com
UPDATE public.daily_log SET user_id = (SELECT id FROM auth.users WHERE email = 'isaaclum1209@gmail.com' LIMIT 1) WHERE user_id IS NULL;
UPDATE public.transactions SET user_id = (SELECT id FROM auth.users WHERE email = 'isaaclum1209@gmail.com' LIMIT 1) WHERE user_id IS NULL;
UPDATE public.funding SET user_id = (SELECT id FROM auth.users WHERE email = 'isaaclum1209@gmail.com' LIMIT 1) WHERE user_id IS NULL;
UPDATE public.rent_payments SET user_id = (SELECT id FROM auth.users WHERE email = 'isaaclum1209@gmail.com' LIMIT 1) WHERE user_id IS NULL;
UPDATE public.settings SET user_id = (SELECT id FROM auth.users WHERE email = 'isaaclum1209@gmail.com' LIMIT 1) WHERE user_id IS NULL;

-- Step 3: Make user_id NOT NULL
ALTER TABLE public.daily_log ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.transactions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.funding ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.rent_payments ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.settings ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Drop old permissive RLS policies
DROP POLICY IF EXISTS "Authenticated users only" ON public.daily_log;
DROP POLICY IF EXISTS "Authenticated users only" ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users only" ON public.funding;
DROP POLICY IF EXISTS "Authenticated users only" ON public.rent_payments;
DROP POLICY IF EXISTS "Authenticated users only" ON public.settings;

-- Step 5: Create new per-user RLS policies
CREATE POLICY "Users can manage own data" ON public.daily_log FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own data" ON public.transactions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own data" ON public.funding FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own data" ON public.rent_payments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own data" ON public.settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
