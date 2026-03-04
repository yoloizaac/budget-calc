
CREATE TABLE public.feature_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'feature',
  status text NOT NULL DEFAULT 'submitted',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own suggestions"
  ON public.feature_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own suggestions or admins all"
  ON public.feature_suggestions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Full admins can update suggestions"
  ON public.feature_suggestions FOR UPDATE
  TO authenticated
  USING (get_admin_role(auth.uid()) = 'full');
