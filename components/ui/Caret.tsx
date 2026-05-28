import { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { COLORS, glow } from '../../constants/theme';

export default function Caret({ size = 16, color = COLORS.accent }: { size?: number; color?: string }) {
  const op = useSharedValue(1);
  useEffect(() => {
    op.value = withRepeat(withTiming(0.15, { duration: 600 }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: op.value }));
  return (
    <Animated.View
      style={[style, { width: size * 0.55, height: size, backgroundColor: color, marginLeft: 4 }, glow(color, 8, 0.5)]}
    />
  );
}
