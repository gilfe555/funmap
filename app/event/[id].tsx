import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { Event } from '@/types';

interface EventDetail extends Event {
  groups: { name: string } | null;
  creator_name: string | null;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [going, setGoing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const [eventRes, rsvpRes] = await Promise.all([
      supabase
        .from('events')
        .select('*, groups(name)')
        .eq('id', id)
        .single(),
      supabase
        .from('event_rsvps')
        .select('event_id')
        .eq('event_id', id)
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    if (eventRes.data) {
      // Fetch creator profile separately
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', eventRes.data.created_by)
        .maybeSingle();

      setEvent({
        ...(eventRes.data as Event & { groups: { name: string } | null }),
        creator_name: profile?.display_name ?? null,
      });
    }

    setGoing(!!rsvpRes.data);
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  async function toggleRsvp() {
    if (!userId || !event) return;

    if (going) {
      await supabase
        .from('event_rsvps')
        .delete()
        .eq('event_id', id)
        .eq('user_id', userId);
      setGoing(false);
      setEvent((e) => e ? { ...e, rsvp_count: Math.max(0, e.rsvp_count - 1) } : e);
    } else {
      await supabase
        .from('event_rsvps')
        .insert({ event_id: id, user_id: userId });
      setGoing(true);
      setEvent((e) => e ? { ...e, rsvp_count: e.rsvp_count + 1 } : e);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.funGreen} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Event not found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Nav */}
      <View style={styles.navbar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.navTitle} numberOfLines={1}>Event</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Group tag */}
        {event.groups?.name && (
          <View style={styles.groupChip}>
            <Ionicons name="people-outline" size={13} color={Colors.funGreenDark} />
            <Text style={styles.groupChipText}>{event.groups.name}</Text>
          </View>
        )}

        {/* Title */}
        <Text style={styles.title}>{event.title}</Text>

        {/* Date & Time */}
        <View style={styles.row}>
          <View style={styles.iconBox}>
            <Ionicons name="calendar-outline" size={20} color={Colors.funGreenDark} />
          </View>
          <Text style={styles.rowText}>{formatDateTime(event.starts_at)}</Text>
        </View>

        {/* Location */}
        {event.location_name && (
          <View style={styles.row}>
            <View style={styles.iconBox}>
              <Ionicons name="location-outline" size={20} color={Colors.funGreenDark} />
            </View>
            <Text style={styles.rowText}>{event.location_name}</Text>
          </View>
        )}

        {/* Organizer */}
        {event.creator_name && (
          <View style={styles.row}>
            <View style={styles.iconBox}>
              <Ionicons name="person-outline" size={20} color={Colors.funGreenDark} />
            </View>
            <Text style={styles.rowText}>Organised by {event.creator_name}</Text>
          </View>
        )}

        {/* Attendees */}
        <View style={styles.row}>
          <View style={styles.iconBox}>
            <Ionicons name="checkmark-circle-outline" size={20} color={Colors.funGreenDark} />
          </View>
          <Text style={styles.rowText}>{event.rsvp_count} going</Text>
        </View>

        {/* Description */}
        {event.description && (
          <View style={styles.descCard}>
            <Text style={styles.descLabel}>About</Text>
            <Text style={styles.descText}>{event.description}</Text>
          </View>
        )}

        {/* RSVP */}
        <Pressable
          style={[styles.rsvpBtn, going && styles.rsvpBtnGoing]}
          onPress={toggleRsvp}
        >
          <Ionicons
            name={going ? 'checkmark-circle' : 'add-circle-outline'}
            size={20}
            color={going ? '#000' : Colors.textPrimary}
          />
          <Text style={[styles.rsvpBtnText, going && styles.rsvpBtnTextGoing]}>
            {going ? "You're going!" : "Going?"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    padding: 4,
  },
  navTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  navSpacer: {
    width: 32,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.funGreen + '22',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
    marginBottom: 12,
  },
  groupChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.funGreenDark,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 20,
    lineHeight: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.funGreen + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
    paddingTop: 7,
  },
  descCard: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    ...Platform.select({
      android: { elevation: 1 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
    }),
  },
  descLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  descText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  rsvpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  rsvpBtnGoing: {
    backgroundColor: Colors.funGreen,
    borderColor: Colors.funGreen,
  },
  rsvpBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  rsvpBtnTextGoing: {
    color: '#000',
  },
});
