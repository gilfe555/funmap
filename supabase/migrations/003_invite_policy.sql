-- FunMap: Allow group admins to add members (for invite flow)
-- Run this after 002_groups.sql

-- Admins can insert group_members rows for other users (inviting them)
CREATE POLICY "admins_invite_members"
  ON public.group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.role = 'admin'
    )
  );
