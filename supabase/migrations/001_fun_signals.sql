-- FunMap: Core schema for MVP
-- Run this in Supabase SQL Editor (Project > SQL Editor > New Query)

-- ============================================================
-- fun_signals: one row per user, upserted on each toggle
-- ============================================================
CREATE TABLE IF NOT EXISTS public.fun_signals (
  user_id      UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude     DOUBLE PRECISION NOT NULL DEFAULT 0,
  longitude    DOUBLE PRECISION NOT NULL DEFAULT 0,
  status       BOOLEAN     NOT NULL DEFAULT false,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NULL
);

-- Index to speed up spatial queries on active signals
CREATE INDEX IF NOT EXISTS fun_signals_active_location
  ON public.fun_signals (latitude, longitude)
  WHERE status = true;

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.fun_signals ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read signals that are currently active
CREATE POLICY "anyone_can_read_active_signals"
  ON public.fun_signals
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND status = true
    AND expires_at > NOW()
  );

-- Users can insert, update, or delete only their own row
CREATE POLICY "users_manage_own_signal"
  ON public.fun_signals
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Realtime: enable for this table
-- (You also need to enable replication in Supabase Dashboard >
--  Database > Replication)
-- ============================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fun_signals TO authenticated;
