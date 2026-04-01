import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification } from '@/types';

const TYPE_ICON: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  new_event: { name: 'calendar', color: Colors.funGreenDark },
  rsvp: { name: 'checkmark-circle', color: '#007AFF' },
  invite: { name: 'person-add', color: '#FF9500' },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotifRow({
  notif,
  onPress,
}: {
  notif: Notification;
  onPress: () => void;
}) {
  const icon = TYPE_ICON[notif.type] ?? TYPE_ICON.new_event;

  return (
    <Pressable
      style={[styles.row, !notif.read && styles.rowUnread]}
      onPress={onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: icon.color + '22' }]}>
        <Ionicons name={icon.name} size={20} color={icon.color} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{notif.title}</Text>
        {notif.body ? (
          <Text style={styles.rowBody} numberOfLines={2}>{notif.body}</Text>
        ) : null}
        <Text style={styles.rowTime}>{timeAgo(notif.created_at)}</Text>
      </View>
      {!notif.read && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

export default function AlertsScreen() {
  const router = useRouter();
  const { notifications, isLoading, markRead, markAllRead } = useNotifications();

  function handlePress(notif: Notification) {
    if (!notif.read) markRead(notif.id);
    if (notif.reference_id) {
      if (notif.type === 'new_event' || notif.type === 'rsvp') {
        router.push(`/event/${notif.reference_id}`);
      }
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        {notifications.some((n) => !n.read) && (
          <Pressable onPress={markAllRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.funGreen} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-outline" size={48} color={Colors.border} />
          <Text style={styles.emptyTitle}>No alerts yet</Text>
          <Text style={styles.emptyText}>
            You'll see group invites, new events, and RSVPs here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          renderItem={({ item }) => (
            <NotifRow notif={item} onPress={() => handlePress(item)} />
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  markAllRead: {
    fontSize: 14,
    color: Colors.funGreenDark,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
    marginBottom: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
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
  rowUnread: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.funGreen,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  rowBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  rowTime: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.funGreen,
    marginTop: 4,
  },
});
