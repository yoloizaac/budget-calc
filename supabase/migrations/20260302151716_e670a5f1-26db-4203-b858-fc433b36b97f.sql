
-- Add an id column as new PK, drop old PK on key, add unique per user
ALTER TABLE public.settings DROP CONSTRAINT settings_pkey;
ALTER TABLE public.settings ADD COLUMN id UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.settings ADD PRIMARY KEY (id);
ALTER TABLE public.settings ADD CONSTRAINT settings_user_key_unique UNIQUE (user_id, key);
