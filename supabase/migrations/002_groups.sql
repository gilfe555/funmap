-- FunMap: Groups Phase schema
-- Run this in Supabase SQL Editor after 001_fun_signals.sql

-- ============================================================
-- profiles: display name for users (auto-created on signup)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, split_part(NEW.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_create_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_user();

-- ============================================================
-- groups
-- ============================================================
CREATE TABLE IF NOT EXISTS public.groups (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  description  TEXT,
  type         TEXT        NOT NULL DEFAULT 'public' CHECK (type IN ('public', 'private')),
  member_count INTEGER     NOT NULL DEFAULT 0,
  avg_rating   NUMERIC(3,2),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- group_members
-- ============================================================
CREATE TABLE IF NOT EXISTS public.group_members (
  group_id  UUID        NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      TEXT        NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS group_members_user_id ON public.group_members (user_id);

-- ============================================================
-- events
-- ============================================================
CREATE TABLE IF NOT EXISTS public.events (
  id            UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id      UUID             NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_by    UUID             NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT             NOT NULL,
  description   TEXT,
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION,
  location_name TEXT,
  starts_at     TIMESTAMPTZ      NOT NULL,
  rsvp_count    INTEGER          NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS events_group_id  ON public.events (group_id);
CREATE INDEX IF NOT EXISTS events_starts_at ON public.events (starts_at);

-- ============================================================
-- event_rsvps
-- ============================================================
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  event_id   UUID        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS event_rsvps_user_id ON public.event_rsvps (user_id);

-- ============================================================
-- group_ratings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.group_ratings (
  group_id   UUID     NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id    UUID     NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- ============================================================
-- Triggers: maintain member_count
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.groups SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_group_member_count
  AFTER INSERT OR DELETE ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();

-- ============================================================
-- Triggers: maintain rsvp_count
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_event_rsvp_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.events SET rsvp_count = rsvp_count + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.events SET rsvp_count = GREATEST(0, rsvp_count - 1) WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_event_rsvp_count
  AFTER INSERT OR DELETE ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.update_event_rsvp_count();

-- ============================================================
-- Triggers: maintain avg_rating on groups
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_group_avg_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_group_id UUID;
BEGIN
  target_group_id := COALESCE(NEW.group_id, OLD.group_id);
  UPDATE public.groups
  SET avg_rating = (
    SELECT AVG(rating)::NUMERIC(3,2)
    FROM public.group_ratings
    WHERE group_id = target_group_id
  )
  WHERE id = target_group_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_group_avg_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.group_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_group_avg_rating();

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_ratings ENABLE ROW LEVEL SECURITY;

-- profiles: anyone authenticated can read; users manage their own
CREATE POLICY "authenticated_read_profiles"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "users_manage_own_profile"
  ON public.profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- groups: public groups visible to all authenticated; private only if member or creator
CREATE POLICY "authenticated_read_groups"
  ON public.groups FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      type = 'public'
      OR created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.group_members
        WHERE group_id = groups.id AND user_id = auth.uid()
      )
    )
  );

CREATE POLICY "authenticated_create_group"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "admin_update_group"
  ON public.groups FOR UPDATE
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = groups.id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- group_members: visible to group members; users manage their own membership
CREATE POLICY "members_read_memberships"
  ON public.group_members FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.group_members gm2
        WHERE gm2.group_id = group_members.group_id AND gm2.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "users_join_groups"
  ON public.group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_leave_groups"
  ON public.group_members FOR DELETE
  USING (auth.uid() = user_id);

-- events: visible if group is public or user is a member
CREATE POLICY "authenticated_read_events"
  ON public.events FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_id AND (
        g.type = 'public'
        OR EXISTS (
          SELECT 1 FROM public.group_members gm
          WHERE gm.group_id = g.id AND gm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "members_create_events"
  ON public.events FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = events.group_id AND user_id = auth.uid()
    )
  );

-- event_rsvps: authenticated can read; users manage their own
CREATE POLICY "authenticated_read_rsvps"
  ON public.event_rsvps FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "users_manage_own_rsvps"
  ON public.event_rsvps FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- group_ratings: authenticated can read; group members can rate
CREATE POLICY "authenticated_read_ratings"
  ON public.group_ratings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "members_rate_groups"
  ON public.group_ratings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_ratings.group_id AND user_id = auth.uid()
    )
  );

-- ============================================================
-- Grants
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_rsvps   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_ratings TO authenticated;
