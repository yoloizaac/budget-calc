
-- Drop all existing permissive policies
DROP POLICY IF EXISTS "Allow all on daily_log" ON public.daily_log;
DROP POLICY IF EXISTS "Allow all on funding" ON public.funding;
DROP POLICY IF EXISTS "Allow all on rent_payments" ON public.rent_payments;
DROP POLICY IF EXISTS "Allow all on settings" ON public.settings;
DROP POLICY IF EXISTS "Allow all on transactions" ON public.transactions;

-- Create new policies requiring authentication
CREATE POLICY "Authenticated users only" ON public.daily_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users only" ON public.funding FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users only" ON public.rent_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users only" ON public.settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users only" ON public.transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
