import { useRef, useEffect } from 'react';
import {
  Animated,
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  View,
} from 'react-native';
import { Colors } from '@/constants/colors';

interface FunToggleProps {
  isOn: boolean;
  isLoading: boolean;
  onPress: () => void;
}

const PILL_WIDTH = 140;
const PILL_HEIGHT = 56;
const DOT_SIZE = 44;
const DOT_MARGIN = 6;
const DOT_OFF = DOT_MARGIN;
const DOT_ON = PILL_WIDTH - DOT_SIZE - DOT_MARGIN;

export function FunToggle({ isOn, isLoading, onPress }: FunToggleProps) {
  const dotAnim = useRef(new Animated.Value(isOn ? DOT_ON : DOT_OFF)).current;
  const colorAnim = useRef(new Animated.Value(isOn ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(dotAnim, {
        toValue: isOn ? DOT_ON : DOT_OFF,
        useNativeDriver: false,
        damping: 18,
        stiffness: 220,
      }),
      Animated.timing(colorAnim, {
        toValue: isOn ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isOn]);

  function handlePressIn() {
    Animated.spring(scaleAnim, {
      toValue: 0.94,
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
    <Animated.View style={[styles.shadow, { transform: [{ scale: scaleAnim }] }]}>
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
            <>
              {/* Sliding white dot */}
              <Animated.View style={[styles.dot, { left: dotAnim }]} />
              {/* Centered label */}
              <View style={styles.labelContainer} pointerEvents="none">
                <Text style={styles.label}>Fun</Text>
              </View>
            </>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    ...Platform.select({
      android: { elevation: 8 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
    }),
  },
  pill: {
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: '#FFFFFF',
    top: (PILL_HEIGHT - DOT_SIZE) / 2,
    ...Platform.select({
      android: { elevation: 3 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
    }),
  },
  labelContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
