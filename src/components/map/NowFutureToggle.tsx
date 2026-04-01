import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Colors } from '@/constants/colors';

export type MapMode = 'now' | 'future';

interface NowFutureToggleProps {
  value: MapMode;
  onChange: (mode: MapMode) => void;
}

export function NowFutureToggle({ value, onChange }: NowFutureToggleProps) {
  return (
    <View style={styles.pill}>
      <Pressable
        style={[styles.option, value === 'now' && styles.optionActive]}
        onPress={() => onChange('now')}
      >
        <Text style={[styles.optionText, value === 'now' && styles.optionTextActive]}>
          Now
        </Text>
      </Pressable>
      <Pressable
        style={[styles.option, value === 'future' && styles.optionActive]}
        onPress={() => onChange('future')}
      >
        <Text style={[styles.optionText, value === 'future' && styles.optionTextActive]}>
          Future
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 3,
    alignSelf: 'center',
    ...Platform.select({
      android: { elevation: 4 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
    }),
  },
  option: {
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 17,
  },
  optionActive: {
    backgroundColor: Colors.funGreen,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  optionTextActive: {
    color: '#000',
  },
});
