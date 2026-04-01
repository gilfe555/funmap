-- FunMap: Notifications for Groups Phase
-- Run after 003_invite_policy.sql

-- ============================================================
-- notifications table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL CHECK (type IN ('new_event', 'rsvp', 'invite')),
  title        TEXT        NOT NULL,
  body         TEXT,
  reference_id UUID,       -- event_id or group_id depending on type
  read         BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_unread ON public.notifications (user_id, read) WHERE read = false;

-- ============================================================
-- Trigger: notify group members when a new event is created
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_new_event()
RETURNS TRIGGER AS $$
DECLARE
  grp_name TEXT;
BEGIN
  SELECT name INTO grp_name FROM public.groups WHERE id = NEW.group_id;

  INSERT INTO public.notifications (user_id, type, title, body, reference_id)
  SELECT
    gm.user_id,
    'new_event',
    'New event in ' || grp_name,
    NEW.title,
    NEW.id
  FROM public.group_members gm
  WHERE gm.group_id = NEW.group_id
    AND gm.user_id != NEW.created_by;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_new_event
  AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_event();

-- ============================================================
-- Trigger: notify event creator when someone RSVPs
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_new_rsvp()
RETURNS TRIGGER AS $$
DECLARE
  evt_creator UUID;
  evt_title   TEXT;
  rsvper_name TEXT;
BEGIN
  SELECT created_by, title INTO evt_creator, evt_title
  FROM public.events WHERE id = NEW.event_id;

  SELECT display_name INTO rsvper_name
  FROM public.profiles WHERE id = NEW.user_id;

  -- Don't notify if creator is RSVPing their own event
  IF evt_creator IS DISTINCT FROM NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, body, reference_id)
    VALUES (
      evt_creator,
      'rsvp',
      evt_title,
      COALESCE(rsvper_name, 'Someone') || ' is going!',
      NEW.event_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_new_rsvp
  AFTER INSERT ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_rsvp();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_update_own_notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow triggers (SECURITY DEFINER functions) to insert
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT INSERT ON public.notifications TO postgres;
