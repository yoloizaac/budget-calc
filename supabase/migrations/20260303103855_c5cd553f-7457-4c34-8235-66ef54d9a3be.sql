
-- Admin users table
CREATE TABLE public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('full', 'viewer'))
);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Seed initial admins
INSERT INTO public.admin_users (email, role) VALUES
  ('isaaclum1209@gmail.com', 'full'),
  ('yoloizaac@gmail.com', 'viewer');

-- Security definer function to check admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.email = (SELECT email FROM auth.users WHERE id = _user_id)
  )
$$;

-- Security definer function to get admin role
CREATE OR REPLACE FUNCTION public.get_admin_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT au.role FROM public.admin_users au
  WHERE au.email = (SELECT email FROM auth.users WHERE id = _user_id)
$$;

-- Admin users RLS: only full admins can manage
CREATE POLICY "Admins can view admin_users"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Full admins can insert admin_users"
  ON public.admin_users FOR INSERT
  TO authenticated
  WITH CHECK (public.get_admin_role(auth.uid()) = 'full');

CREATE POLICY "Full admins can delete admin_users"
  ON public.admin_users FOR DELETE
  TO authenticated
  USING (public.get_admin_role(auth.uid()) = 'full');

-- Bug reports table
CREATE TABLE public.bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  bug_type text NOT NULL DEFAULT 'other' CHECK (bug_type IN ('ui', 'data', 'crash', 'performance', 'other')),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own bug reports"
  ON public.bug_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own bug reports"
  ON public.bug_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Full admins can update bug reports"
  ON public.bug_reports FOR UPDATE
  TO authenticated
  USING (public.get_admin_role(auth.uid()) = 'full');

-- User activity table
CREATE TABLE public.user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  user_email text,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  session_count integer NOT NULL DEFAULT 1
);
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can upsert own activity"
  ON public.user_activity FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity"
  ON public.user_activity FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity"
  ON public.user_activity FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()) OR auth.uid() = user_id);
