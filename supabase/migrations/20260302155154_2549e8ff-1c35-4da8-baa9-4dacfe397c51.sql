
-- Fix: allow each user to have one entry per date (was UNIQUE on date alone)
ALTER TABLE daily_log DROP CONSTRAINT IF EXISTS daily_log_date_key;
ALTER TABLE daily_log ADD CONSTRAINT daily_log_date_user_key UNIQUE (date, user_id);

-- Drop FK to auth.users per project guidelines
ALTER TABLE daily_log DROP CONSTRAINT IF EXISTS daily_log_user_id_fkey;
