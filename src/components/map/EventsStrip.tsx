import { ScrollView, Pressable, Text, StyleSheet, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Event } from '@/types';

interface EventsStripProps {
  events: Event[];
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatShort(iso: string) {
  const d = new Date(iso);
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = d.getDate();
  const hours = pad(d.getHours());
  const mins = pad(d.getMinutes());
  return `${month} ${day} · ${hours}:${mins}`;
}

export function EventsStrip({ events }: EventsStripProps) {
  const router = useRouter();

  if (events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No upcoming events in this area</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {events.map((event) => (
        <Pressable
          key={event.id}
          style={styles.card}
          onPress={() => router.push(`/event/${event.id}`)}
        >
          <Text style={styles.cardTime}>{formatShort(event.starts_at)}</Text>
          <Text style={styles.cardTitle} numberOfLines={2}>{event.title}</Text>
          {event.location_name && (
            <View style={styles.cardLocation}>
              <Ionicons name="location-outline" size={11} color={Colors.textSecondary} />
              <Text style={styles.cardLocationText} numberOfLines={1}>
                {event.location_name}
              </Text>
            </View>
          )}
          <View style={styles.cardFooter}>
            <Ionicons name="checkmark-circle-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.cardRsvp}>{event.rsvp_count} going</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    gap: 10,
    paddingVertical: 8,
  },
  emptyContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  card: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    ...Platform.select({
      android: { elevation: 3 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
    }),
  },
  cardTime: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.funGreenDark,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 18,
    marginBottom: 4,
  },
  cardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 6,
  },
  cardLocationText: {
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardRsvp: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
