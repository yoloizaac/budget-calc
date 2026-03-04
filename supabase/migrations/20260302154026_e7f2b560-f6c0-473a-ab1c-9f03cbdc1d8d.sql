
-- Create daily_log_photos table
CREATE TABLE public.daily_log_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id uuid NOT NULL REFERENCES public.daily_log(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  storage_path text NOT NULL,
  caption text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_log_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own photos"
  ON public.daily_log_photos
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('daily-log-photos', 'daily-log-photos', true);

-- Storage RLS: users can upload to their own folder
CREATE POLICY "Users can upload own photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'daily-log-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'daily-log-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'daily-log-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Public read for displaying images
CREATE POLICY "Public read for daily log photos"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'daily-log-photos');
