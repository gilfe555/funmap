import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { FunSignal, Cluster, MapBounds } from '@/types';
import { clusterSignals } from '@/utils/clustering';

export function useHeatmap(bounds: MapBounds | null) {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const signalsMapRef = useRef<Map<string, FunSignal>>(new Map());

  // Fetch signals when bounds change
  useEffect(() => {
    if (!bounds) return;
    fetchSignals(bounds);
  }, [bounds?.minLat, bounds?.maxLat, bounds?.minLng, bounds?.maxLng]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('fun_signals_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fun_signals' },
        (payload) => handleRealtimeEvent(payload)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchSignals(bounds: MapBounds) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('fun_signals')
      .select('*')
      .eq('status', true)
      .gte('expires_at', now)
      .gte('latitude', bounds.minLat)
      .lte('latitude', bounds.maxLat)
      .gte('longitude', bounds.minLng)
      .lte('longitude', bounds.maxLng);

    if (error || !data) return;

    const newMap = new Map<string, FunSignal>();
    for (const signal of data as FunSignal[]) {
      newMap.set(signal.user_id, signal);
    }
    signalsMapRef.current = newMap;
    recompute();
  }

  function handleRealtimeEvent(payload: { eventType: string; new: unknown; old: unknown }) {
    const signal = payload.new as FunSignal | null;
    const oldSignal = payload.old as { user_id?: string } | null;

    if (payload.eventType === 'DELETE' && oldSignal?.user_id) {
      signalsMapRef.current.delete(oldSignal.user_id);
    } else if (signal) {
      if (signal.status && signal.expires_at && new Date(signal.expires_at) > new Date()) {
        signalsMapRef.current.set(signal.user_id, signal);
      } else {
        signalsMapRef.current.delete(signal.user_id);
      }
    }

    recompute();
  }

  function recompute() {
    const signals = Array.from(signalsMapRef.current.values());
    setClusters(clusterSignals(signals));
  }

  return { clusters };
}
