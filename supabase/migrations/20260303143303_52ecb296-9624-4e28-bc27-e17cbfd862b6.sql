
-- Make daily-log-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'daily-log-photos';

-- Remove anonymous read policy
DROP POLICY IF EXISTS "Public read for daily log photos" ON storage.objects;

-- Add authenticated-only read policy scoped to user's own folder
CREATE POLICY "Authenticated users can read own photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'daily-log-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
