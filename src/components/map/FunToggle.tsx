import { useRef, useEffect } from 'react';
import {
  Animated,
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Colors } from '@/constants/colors';

interface FunToggleProps {
  isOn: boolean;
  isLoading: boolean;
  onPress: () => void;
}

export function FunToggle({ isOn, isLoading, onPress }: FunToggleProps) {
  const widthAnim = useRef(new Animated.Value(120)).current;
  const colorAnim = useRef(new Animated.Value(isOn ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(colorAnim, {
        toValue: isOn ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isOn]);

  function handlePressIn() {
    Animated.spring(scaleAnim, {
      toValue: 0.93,
      useNativeDriver: true,
      damping: 15,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 12,
    }).start();
  }

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.toggleOff, Colors.funGreen],
  });

  return (
    <Animated.View
      style={[
        styles.shadow,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isLoading}
        accessibilityLabel={isOn ? 'Turn fun off' : 'Mark as having fun'}
        accessibilityRole="button"
      >
        <Animated.View style={[styles.pill, { backgroundColor }]}>
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.label}>Fun</Text>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
    }),
  },
  pill: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
