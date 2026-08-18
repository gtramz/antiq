-- LOCAL / DEV ONLY — creates schema antiq_dev.
-- Never ALTER / INSERT / UPDATE public.* from this file.
-- In production the app uses public.users (existing).

CREATE SCHEMA IF NOT EXISTS antiq_dev;

CREATE TABLE IF NOT EXISTS antiq_dev.users (
  id SERIAL PRIMARY KEY,
  username TEXT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  artist_name TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  name TEXT,
  role TEXT CHECK (role IS NULL OR role IN ('artist', 'investor')),
  antiq_user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS antiq_dev_users_email_idx ON antiq_dev.users (email);
CREATE INDEX IF NOT EXISTS antiq_dev_users_role_idx ON antiq_dev.users (role);

-- Future: artist analytics event store (not migrated yet).
-- GET /api/artists/[id]/analytics will aggregate these into ArtistAnalytics.
-- CREATE TABLE IF NOT EXISTS antiq_dev.analytics_events (
--   id SERIAL PRIMARY KEY,
--   artist_id TEXT NOT NULL,
--   project_id TEXT,
--   kind TEXT NOT NULL CHECK (kind IN ('view_profile', 'view_project', 'fund')),
--   actor_user_id TEXT,
--   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );
