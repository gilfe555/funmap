import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';

interface UserResult {
  id: string;
  display_name: string | null;
  invited: boolean;
}

function initials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function InviteUsersScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();

  const [groupName, setGroupName] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [existingMemberIds, setExistingMemberIds] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch group name + existing members on mount
  useEffect(() => {
    if (!groupId) return;

    Promise.all([
      supabase.from('groups').select('name').eq('id', groupId).single(),
      supabase.from('group_members').select('user_id').eq('group_id', groupId),
    ]).then(([groupRes, membersRes]) => {
      if (groupRes.data) setGroupName(groupRes.data.name);
      if (membersRes.data) {
        setExistingMemberIds(new Set(membersRes.data.map((m) => m.user_id)));
      }
    });
  }, [groupId]);

  const searchUsers = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name')
        .ilike('display_name', `%${q.trim()}%`)
        .limit(25);

      // Get current user to exclude self
      const { data: { user } } = await supabase.auth.getUser();

      const mapped: UserResult[] = (data ?? [])
        .filter((p) => p.id !== user?.id)
        .map((p) => ({
          id: p.id,
          display_name: p.display_name,
          invited: existingMemberIds.has(p.id),
        }));

      setResults(mapped);
      setIsSearching(false);
    },
    [existingMemberIds]
  );

  function handleQueryChange(text: string) {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchUsers(text), 350);
  }

  async function handleInvite(userId: string) {
    // Optimistically update UI
    setResults((prev) =>
      prev.map((r) => (r.id === userId ? { ...r, invited: true } : r))
    );
    setExistingMemberIds((prev) => new Set([...prev, userId]));

    await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: userId, role: 'member' });

    // Notify the invited user
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'invite',
        title: `You were invited to ${groupName || 'a group'}`,
        body: 'Tap to view the group.',
        reference_id: groupId,
      });
  }

  function renderUser({ item }: { item: UserResult }) {
    return (
      <View style={styles.userRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(item.display_name)}</Text>
        </View>
        <Text style={styles.userName} numberOfLines={1}>
          {item.display_name ?? 'User'}
        </Text>
        {item.invited ? (
          <View style={styles.invitedBadge}>
            <Ionicons name="checkmark" size={14} color={Colors.funGreenDark} />
            <Text style={styles.invitedText}>Invited</Text>
          </View>
        ) : (
          <Pressable style={styles.inviteBtn} onPress={() => handleInvite(item.id)}>
            <Text style={styles.inviteBtnText}>Invite</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Invite People</Text>
          {groupName ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {groupName}
            </Text>
          ) : null}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={16} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name…"
          placeholderTextColor={Colors.textSecondary}
          value={query}
          onChangeText={handleQueryChange}
          autoFocus
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {isSearching && <ActivityIndicator size="small" color={Colors.textSecondary} />}
      </View>

      {/* Results */}
      {query.trim() === '' ? (
        <View style={styles.hint}>
          <Ionicons name="person-add-outline" size={40} color={Colors.border} />
          <Text style={styles.hintText}>Search for people to invite</Text>
        </View>
      ) : results.length === 0 && !isSearching ? (
        <View style={styles.hint}>
          <Text style={styles.hintText}>No users found for "{query}"</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
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
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  headerSpacer: {
    width: 32,
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
  hint: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 80,
  },
  hintText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
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
  userName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  inviteBtn: {
    backgroundColor: Colors.funGreen,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  inviteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  invitedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.funGreen + '22',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  invitedText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.funGreenDark,
  },
});
