import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { FUN_TIMEOUT_MS } from '@/constants/config';

interface FunSignalState {
  isOn: boolean;
  expiresAt: string | null;
}

export function useFunSignal() {
  const { session } = useAuth();
  const [state, setState] = useState<FunSignalState>({ isOn: false, expiresAt: null });
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load existing signal on mount
  useEffect(() => {
    if (!session?.user) return;
    loadCurrentSignal();
  }, [session]);

  // Check expiry when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [state.expiresAt]);

  function handleAppStateChange(nextState: AppStateStatus) {
    if (nextState === 'active' && state.expiresAt) {
      if (new Date(state.expiresAt) <= new Date()) {
        setState({ isOn: false, expiresAt: null });
      }
    }
  }

  async function loadCurrentSignal() {
    if (!session?.user) return;
    const { data } = await supabase
      .from('fun_signals')
      .select('status, expires_at')
      .eq('user_id', session.user.id)
      .single();

    if (data && data.status && data.expires_at && new Date(data.expires_at) > new Date()) {
      const msLeft = new Date(data.expires_at).getTime() - Date.now();
      setState({ isOn: true, expiresAt: data.expires_at });
      scheduleAutoOff(msLeft);
    }
  }

  function scheduleAutoOff(msLeft: number) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      turnOff();
    }, msLeft);
  }

  const toggleFun = useCallback(async (latitude: number, longitude: number) => {
    if (!session?.user) return;
    if (state.isOn) {
      await turnOff();
      return;
    }

    setIsLoading(true);
    const expiresAt = new Date(Date.now() + FUN_TIMEOUT_MS).toISOString();

    const { error } = await supabase.from('fun_signals').upsert({
      user_id: session.user.id,
      latitude,
      longitude,
      status: true,
      updated_at: new Date().toISOString(),
      expires_at: expiresAt,
    });

    setIsLoading(false);

    if (!error) {
      setState({ isOn: true, expiresAt });
      scheduleAutoOff(FUN_TIMEOUT_MS);
    }
  }, [session, state.isOn]);

  const turnOff = useCallback(async () => {
    if (!session?.user) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const { error } = await supabase.from('fun_signals').upsert({
      user_id: session.user.id,
      latitude: 0,
      longitude: 0,
      status: false,
      updated_at: new Date().toISOString(),
      expires_at: null,
    });

    if (!error) {
      setState({ isOn: false, expiresAt: null });
    }
  }, [session]);

  return { isOn: state.isOn, isLoading, toggleFun };
}
