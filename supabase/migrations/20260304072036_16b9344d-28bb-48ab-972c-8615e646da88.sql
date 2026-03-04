
CREATE TABLE public.transaction_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id uuid NOT NULL,
  user_id uuid NOT NULL,
  storage_path text NOT NULL,
  caption text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.transaction_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own transaction photos"
ON public.transaction_photos
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
