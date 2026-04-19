ALTER TABLE users
  ADD COLUMN IF NOT EXISTS ui_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS profile_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE users
SET
  ui_preferences = COALESCE(ui_preferences, '{}'::jsonb),
  profile_metadata = COALESCE(profile_metadata, '{}'::jsonb)
WHERE ui_preferences IS NULL
   OR profile_metadata IS NULL;
