import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Group } from '@/types';
import { useAuthContext } from '@/contexts/AuthContext';

export function useGroups() {
  const { session } = useAuthContext();
  const userId = session?.user.id;

  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchGroups = useCallback(async () => {
    if (!userId) return;

    // Fetch my group IDs first
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);

    const myGroupIds = (memberships ?? []).map((m) => m.group_id);

    // Fetch my groups and all public groups in parallel
    const [myRes, publicRes] = await Promise.all([
      myGroupIds.length > 0
        ? supabase
            .from('groups')
            .select('*')
            .in('id', myGroupIds)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
      supabase
        .from('groups')
        .select('*')
        .eq('type', 'public')
        .order('member_count', { ascending: false }),
    ]);

    const myGroupsData = (myRes.data ?? []) as Group[];
    const allPublic = (publicRes.data ?? []) as Group[];

    const myGroupIdSet = new Set(myGroupIds);
    const discoverGroups = allPublic.filter((g) => !myGroupIdSet.has(g.id));

    setMyGroups(myGroupsData);
    setPublicGroups(discoverGroups);
    setIsLoading(false);
    setIsRefreshing(false);
  }, [userId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  async function joinGroup(groupId: string) {
    if (!userId) return;
    await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: userId, role: 'member' });
    fetchGroups();
  }

  async function createGroup(data: {
    name: string;
    description: string;
    type: 'public' | 'private';
  }): Promise<{ group: Group | null; error: Error | null }> {
    if (!userId) return { group: null, error: new Error('Not authenticated') };

    const { data: group, error } = await supabase
      .from('groups')
      .insert({ ...data, created_by: userId })
      .select()
      .single();

    if (error || !group) return { group: null, error: error as Error };

    // Add creator as admin
    await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: userId, role: 'admin' });

    fetchGroups();
    return { group: group as Group, error: null };
  }

  function refresh() {
    setIsRefreshing(true);
    fetchGroups();
  }

  return { myGroups, publicGroups, isLoading, isRefreshing, refresh, joinGroup, createGroup };
}
