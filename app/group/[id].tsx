import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useGroupDetail } from '@/hooks/useGroupDetail';
import { Event, GroupMember } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function initials(name: string | null | undefined) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── Sub-components ───────────────────────────────────────────

function StarRating({
  value,
  onRate,
}: {
  value: number | null;
  onRate?: (r: number) => void;
}) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Pressable key={i} onPress={() => onRate?.(i)} disabled={!onRate}>
          <Ionicons
            name={value != null && i <= value ? 'star' : 'star-outline'}
            size={onRate ? 26 : 13}
            color={value != null && i <= value ? '#FFB800' : Colors.border}
          />
        </Pressable>
      ))}
    </View>
  );
}

function EventCard({
  event,
  going,
  onToggleRsvp,
}: {
  event: Event;
  going: boolean;
  onToggleRsvp: () => void;
}) {
  return (
    <View style={styles.eventCard}>
      <View style={styles.eventTimeBox}>
        <Text style={styles.eventDay}>{formatDate(event.starts_at)}</Text>
        <Text style={styles.eventTime}>{formatTime(event.starts_at)}</Text>
      </View>

      <View style={styles.eventContent}>
        <Text style={styles.eventTitle}>{event.title}</Text>

        {event.location_name ? (
          <View style={styles.eventMeta}>
            <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.eventMetaText} numberOfLines={1}>
              {event.location_name}
            </Text>
          </View>
        ) : null}

        {event.description ? (
          <Text style={styles.eventDesc} numberOfLines={2}>
            {event.description}
          </Text>
        ) : null}

        <View style={styles.eventFooter}>
          <View style={styles.rsvpCount}>
            <Ionicons name="checkmark-circle-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.rsvpCountText}>{event.rsvp_count} going</Text>
          </View>
          <Pressable
            style={[styles.rsvpBtn, going && styles.rsvpBtnGoing]}
            onPress={onToggleRsvp}
          >
            <Text style={[styles.rsvpBtnText, going && styles.rsvpBtnTextGoing]}>
              {going ? '✓ Going' : 'Going?'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function MemberRow({ member }: { member: GroupMember }) {
  const name = member.profiles?.display_name ?? 'Member';
  const joinDate = new Date(member.joined_at).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={styles.memberRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials(name)}</Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{name}</Text>
        <Text style={styles.memberJoined}>Joined {joinDate}</Text>
      </View>
      {member.role === 'admin' && (
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Admin</Text>
        </View>
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'events' | 'members'>('events');

  const {
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
  } = useGroupDetail(id);

  function handleLeave() {
    Alert.alert('Leave group', `Leave ${group?.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => {
          leaveGroup();
          router.back();
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.funGreen} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Group not found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Nav bar */}
      <View style={styles.navbar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.navTitle} numberOfLines={1}>
          {group.name}
        </Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Group info card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.groupName}>{group.name}</Text>
            <View style={[styles.badge, group.type === 'private' && styles.badgePrivate]}>
              <Text style={styles.badgeText}>
                {group.type === 'public' ? 'Public' : 'Private'}
              </Text>
            </View>
          </View>

          {group.description ? (
            <Text style={styles.groupDesc}>{group.description}</Text>
          ) : null}

          <View style={styles.infoMeta}>
            <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.infoMetaText}>{group.member_count} members</Text>
            {group.avg_rating != null && (
              <>
                <Ionicons name="star" size={13} color="#FFB800" style={styles.metaStar} />
                <Text style={styles.infoMetaText}>{group.avg_rating.toFixed(1)}</Text>
              </>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            {isMember ? (
              <Pressable style={styles.leaveBtn} onPress={handleLeave}>
                <Text style={styles.leaveBtnText}>Leave</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.joinBtn} onPress={joinGroup}>
                <Text style={styles.joinBtnText}>Join</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Fun Meter (rating) — only if member */}
        {isMember && (
          <View style={styles.ratingCard}>
            <Text style={styles.ratingLabel}>Fun Meter</Text>
            <Text style={styles.ratingHint}>How fun is this group?</Text>
            <StarRating value={myRating} onRate={rateGroup} />
          </View>
        )}

        {/* Tab switcher */}
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tab, activeTab === 'events' && styles.tabActive]}
            onPress={() => setActiveTab('events')}
          >
            <Text style={[styles.tabText, activeTab === 'events' && styles.tabTextActive]}>
              Events
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'members' && styles.tabActive]}
            onPress={() => setActiveTab('members')}
          >
            <Text style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}>
              Members
            </Text>
          </Pressable>
        </View>

        {/* Tab content */}
        {activeTab === 'events' ? (
          events.length === 0 ? (
            <View style={styles.tabEmpty}>
              <Ionicons name="calendar-outline" size={36} color={Colors.border} />
              <Text style={styles.tabEmptyText}>No upcoming events</Text>
            </View>
          ) : (
            events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                going={myRsvpIds.has(event.id)}
                onToggleRsvp={() => toggleRsvp(event.id)}
              />
            ))
          )
        ) : members.length === 0 ? (
          <View style={styles.tabEmpty}>
            <Text style={styles.tabEmptyText}>No members yet</Text>
          </View>
        ) : (
          members.map((m) => <MemberRow key={m.user_id} member={m} />)
        )}
      </ScrollView>

      {/* FAB: create event (members only) */}
      {isMember && (
        <Pressable
          style={styles.fab}
          onPress={() =>
            Alert.alert(
              'Create Event',
              'Create Event screen is coming in the next release.',
              [{ text: 'OK' }]
            )
          }
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </Pressable>
      )}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  infoCard: {
    backgroundColor: Colors.background,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
    }),
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  groupName: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  badge: {
    backgroundColor: Colors.funGreen + '22',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgePrivate: {
    backgroundColor: Colors.textSecondary + '22',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  groupDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  infoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 14,
  },
  infoMetaText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginRight: 6,
  },
  metaStar: {
    marginLeft: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  joinBtn: {
    flex: 1,
    backgroundColor: Colors.funGreen,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  joinBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  leaveBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  leaveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.error,
  },
  ratingCard: {
    backgroundColor: Colors.background,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
    }),
  },
  ratingLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  ratingHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  starRow: {
    flexDirection: 'row',
    gap: 4,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.funGreen,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  tabEmpty: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 10,
  },
  tabEmptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
    }),
  },
  eventTimeBox: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.funGreen + '22',
    borderRadius: 10,
    paddingVertical: 8,
  },
  eventDay: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.funGreenDark,
    textAlign: 'center',
  },
  eventTime: {
    fontSize: 10,
    color: Colors.funGreenDark,
    textAlign: 'center',
    marginTop: 2,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
  },
  eventMetaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  eventDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rsvpCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  rsvpCountText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  rsvpBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rsvpBtnGoing: {
    backgroundColor: Colors.funGreen,
    borderColor: Colors.funGreen,
  },
  rsvpBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  rsvpBtnTextGoing: {
    color: '#000',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.funGreen + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.funGreenDark,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  memberJoined: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  roleBadge: {
    backgroundColor: Colors.funGreen + '22',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.funGreenDark,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.funGreenDark,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      android: { elevation: 6 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
    }),
  },
});
