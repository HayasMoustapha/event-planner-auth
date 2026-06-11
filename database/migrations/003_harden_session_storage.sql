ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS access_token TEXT,
  ADD COLUMN IF NOT EXISTS refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS device_info JSONB,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE sessions
SET
  access_token = COALESCE(access_token, id),
  device_info = COALESCE(device_info, '{}'::jsonb),
  created_at = COALESCE(created_at, TO_TIMESTAMP(last_activity / 1000.0)),
  updated_at = COALESCE(updated_at, TO_TIMESTAMP(last_activity / 1000.0)),
  expires_at = COALESCE(expires_at, TO_TIMESTAMP(last_activity / 1000.0) + INTERVAL '24 hours')
WHERE access_token IS NULL
   OR device_info IS NULL
   OR created_at IS NULL
   OR updated_at IS NULL
   OR expires_at IS NULL;

ALTER TABLE personal_access_tokens
  ALTER COLUMN token TYPE TEXT;

CREATE INDEX IF NOT EXISTS idx_sessions_access_token ON sessions(access_token);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_active_expiry ON sessions(is_active, expires_at);
