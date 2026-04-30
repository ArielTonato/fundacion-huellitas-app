import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@src/theme/colors';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface PinOverlayProps {
  isMoving: boolean;
}

export function PinOverlay({ isMoving }: PinOverlayProps): React.JSX.Element {
  const lift = useSharedValue(0);
  const shadowScale = useSharedValue(1);

  useEffect(() => {
    lift.value = withSpring(isMoving ? -10 : 0, { damping: 12, stiffness: 180 });
    shadowScale.value = withSpring(isMoving ? 0.7 : 1, { damping: 14, stiffness: 200 });
  }, [isMoving, lift, shadowScale]);

  const pinStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shadowScale.value }],
    opacity: 0.25 + (1 - shadowScale.value) * -0.15,
  }));

  return (
    <View pointerEvents="none" style={styles.container}>
      <View style={styles.stack}>
        <Animated.View style={[styles.pin, pinStyle]}>
          <Ionicons name="location-sharp" size={42} color={Colors.primary} />
        </Animated.View>
        <Animated.View style={[styles.shadow, shadowStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  stack: {
    alignItems: 'center',
    // Offset upward so the pin tip points to the exact center of the map.
    marginBottom: 42,
  },
  pin: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 999,
    height: 6,
    marginTop: 2,
    width: 18,
  },
});
