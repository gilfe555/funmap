import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Event, EventCluster, MapBounds } from '@/types';
import { clusterEvents } from '@/utils/clustering';

export function useFutureEvents(bounds: MapBounds | null, selectedGroupId: string | null) {
  const [eventClusters, setEventClusters] = useState<EventCluster[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!bounds) return;
    setIsLoading(true);

    const now = new Date().toISOString();

    let query = supabase
      .from('events')
      .select('*, groups(name)')
      .gte('starts_at', now)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .gte('latitude', bounds.minLat)
      .lte('latitude', bounds.maxLat)
      .gte('longitude', bounds.minLng)
      .lte('longitude', bounds.maxLng)
      .order('starts_at')
      .limit(100);

    if (selectedGroupId) {
      query = query.eq('group_id', selectedGroupId);
    }

    const { data } = await query;
    const events = (data ?? []) as Event[];

    setEventClusters(clusterEvents(events));
    setUpcomingEvents(events.slice(0, 20));
    setIsLoading(false);
  }, [
    bounds?.minLat,
    bounds?.maxLat,
    bounds?.minLng,
    bounds?.maxLng,
    selectedGroupId,
  ]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { eventClusters, upcomingEvents, isLoading };
}
