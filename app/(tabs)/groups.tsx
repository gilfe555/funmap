import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useGroups } from '@/hooks/useGroups';
import { Group } from '@/types';

function StarRow({ rating }: { rating: number | null }) {
  const filled = rating ? Math.round(rating) : 0;
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= filled ? 'star' : 'star-outline'}
          size={11}
          color={i <= filled ? '#FFB800' : Colors.textSecondary}
        />
      ))}
      {rating != null && (
        <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
      )}
    </View>
  );
}

function GroupCard({
  group,
  isMember,
  onPress,
  onJoin,
}: {
  group: Group;
  isMember: boolean;
  onPress: () => void;
  onJoin: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName} numberOfLines={1}>
          {group.name}
        </Text>
        <View style={[styles.badge, group.type === 'private' && styles.badgePrivate]}>
          <Text style={styles.badgeText}>
            {group.type === 'public' ? 'Public' : 'Private'}
          </Text>
        </View>
      </View>

      {group.description ? (
        <Text style={styles.cardDesc} numberOfLines={2}>
          {group.description}
        </Text>
      ) : null}

      <View style={styles.cardFooter}>
        <View style={styles.memberCount}>
          <Ionicons name="people-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.memberCountText}>{group.member_count}</Text>
        </View>
        <StarRow rating={group.avg_rating} />
        {!isMember && (
          <Pressable
            style={styles.joinBtn}
            onPress={(e) => {
              e.stopPropagation();
              onJoin();
            }}
          >
            <Text style={styles.joinBtnText}>Join</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

function MyGroupChip({ group, onPress }: { group: Group; onPress: () => void }) {
  return (
    <Pressable style={styles.chip} onPress={onPress}>
      <Text style={styles.chipName} numberOfLines={1}>
        {group.name}
      </Text>
      <View style={styles.chipMeta}>
        <Ionicons name="people-outline" size={11} color={Colors.textSecondary} />
        <Text style={styles.chipCount}>{group.member_count}</Text>
      </View>
    </Pressable>
  );
}

export default function GroupsScreen() {
  const router = useRouter();
  const { myGroups, publicGroups, isLoading, isRefreshing, refresh, joinGroup } = useGroups();
  const [search, setSearch] = useState('');

  const filteredPublic = search.trim()
    ? publicGroups.filter(
        (g) =>
          g.name.toLowerCase().includes(search.toLowerCase()) ||
          g.description?.toLowerCase().includes(search.toLowerCase())
      )
    : publicGroups;

  const filteredMy = search.trim()
    ? myGroups.filter(
        (g) =>
          g.name.toLowerCase().includes(search.toLowerCase()) ||
          g.description?.toLowerCase().includes(search.toLowerCase())
      )
    : myGroups;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Groups</Text>
        <Pressable
          style={styles.gearBtn}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <Ionicons name="settings-outline" size={22} color={Colors.textPrimary} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={16} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search groups…"
          placeholderTextColor={Colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.funGreen} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              tintColor={Colors.funGreen}
            />
          }
          keyboardShouldPersistTaps="handled"
        >
          {/* My Groups */}
          <Text style={styles.sectionLabel}>My Groups</Text>
          {filteredMy.length === 0 ? (
            <Text style={styles.emptyText}>
              {search ? 'No matches' : "You haven't joined any groups yet"}
            </Text>
          ) : (
            <FlatList
              horizontal
              data={filteredMy}
              keyExtractor={(g) => g.id}
              renderItem={({ item }) => (
                <MyGroupChip
                  group={item}
                  onPress={() => router.push(`/group/${item.id}`)}
                />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipList}
              scrollEnabled
            />
          )}

          {/* Discover */}
          <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Discover</Text>
          {filteredPublic.length === 0 ? (
            <Text style={styles.emptyText}>
              {search ? 'No matches' : 'No public groups yet'}
            </Text>
          ) : (
            filteredPublic.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                isMember={false}
                onPress={() => router.push(`/group/${group.id}`)}
                onJoin={() => joinGroup(group.id)}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => router.push('/group/create')}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>
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
  gearBtn: {
    padding: 4,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 10,
  },
  sectionLabelSpaced: {
    marginTop: 24,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  chipList: {
    paddingBottom: 4,
    gap: 10,
  },
  chip: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    minWidth: 120,
    maxWidth: 180,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
    }),
  },
  chipName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  chipMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  badge: {
    backgroundColor: Colors.funGreen + '22',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgePrivate: {
    backgroundColor: Colors.textSecondary + '22',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  cardDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCountText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  ratingText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginLeft: 3,
  },
  joinBtn: {
    backgroundColor: Colors.funGreen,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  joinBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
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
