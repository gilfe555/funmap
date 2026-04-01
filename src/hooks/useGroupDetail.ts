import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Group, GroupMember, Event, GroupRole } from '@/types';
import { useAuthContext } from '@/contexts/AuthContext';

export function useGroupDetail(groupId: string) {
  const { session } = useAuthContext();
  const userId = session?.user.id;

  const [group, setGroup] = useState<Group | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [myRole, setMyRole] = useState<GroupRole | null>(null);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [myRsvpIds, setMyRsvpIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!userId || !groupId) return;

    const [groupRes, eventsRes, membersRes, myMemberRes, myRatingRes] = await Promise.all([
      supabase.from('groups').select('*').eq('id', groupId).single(),
      supabase
        .from('events')
        .select('*')
        .eq('group_id', groupId)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at'),
      supabase
        .from('group_members')
        .select('*, profiles(display_name)')
        .eq('group_id', groupId)
        .order('joined_at'),
      supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('group_ratings')
        .select('rating')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    if (groupRes.data) setGroup(groupRes.data as Group);
    if (eventsRes.data) setEvents(eventsRes.data as Event[]);
    if (membersRes.data) setMembers(membersRes.data as GroupMember[]);
    setIsMember(!!myMemberRes.data);
    setMyRole((myMemberRes.data?.role as GroupRole) ?? null);
    setMyRating(myRatingRes.data?.rating ?? null);

    // Fetch my RSVPs for visible events
    if (eventsRes.data && eventsRes.data.length > 0) {
      const eventIds = eventsRes.data.map((e) => e.id);
      const { data: rsvps } = await supabase
        .from('event_rsvps')
        .select('event_id')
        .eq('user_id', userId)
        .in('event_id', eventIds);
      setMyRsvpIds(new Set((rsvps ?? []).map((r) => r.event_id)));
    } else {
      setMyRsvpIds(new Set());
    }

    setIsLoading(false);
  }, [userId, groupId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function joinGroup() {
    if (!userId) return;
    await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: userId, role: 'member' });
    fetchAll();
  }

  async function leaveGroup() {
    if (!userId) return;
    await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);
    setIsMember(false);
    setMyRole(null);
    fetchAll();
  }

  async function rateGroup(rating: number) {
    if (!userId) return;
    await supabase
      .from('group_ratings')
      .upsert({ group_id: groupId, user_id: userId, rating });
    setMyRating(rating);
    fetchAll();
  }

  async function toggleRsvp(eventId: string) {
    if (!userId) return;
    const going = myRsvpIds.has(eventId);
    if (going) {
      await supabase
        .from('event_rsvps')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);
    } else {
      await supabase
        .from('event_rsvps')
        .insert({ event_id: eventId, user_id: userId });
    }
    fetchAll();
  }

  return {
    group,
    events,
    members,
    isMember,
    myRole,
    myRating,
    myRsvpIds,
    isLoading,
    joinGroup,
    leaveGroup,
    rateGroup,
    toggleRsvp,
    refresh: fetchAll,
  };
}
