import { ScrollView, Pressable, Text, StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Group } from '@/types';

interface GroupFilterChipsProps {
  groups: Group[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function GroupFilterChips({ groups, selectedId, onSelect }: GroupFilterChipsProps) {
  if (groups.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      <Chip
        label="All Groups"
        active={selectedId === null}
        onPress={() => onSelect(null)}
      />
      {groups.map((g) => (
        <Chip
          key={g.id}
          label={g.name}
          active={selectedId === g.id}
          onPress={() => onSelect(g.id)}
        />
      ))}
    </ScrollView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.funGreen,
    borderColor: Colors.funGreen,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: '#000',
    fontWeight: '700',
  },
});
