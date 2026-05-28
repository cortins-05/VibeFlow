import { Text, Pressable, type ViewStyle } from 'react-native';
import { COLORS, FONTS, glow } from '../../constants/theme';

type Variant = 'accent' | 'secondary' | 'ghost' | 'error';
const C: Record<Variant, string> = {
  accent: COLORS.accent,
  secondary: COLORS.secondary,
  ghost: COLORS.textDim,
  error: COLORS.error,
};

export default function ConsoleButton({
  label,
  onPress,
  variant = 'ghost',
  filled,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  filled?: boolean;
  style?: ViewStyle;
}) {
  const c = C[variant];
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          borderWidth: 1,
          borderColor: c,
          borderRadius: 4,
          paddingHorizontal: 14,
          paddingVertical: 9,
          backgroundColor: filled ? c : 'transparent',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        },
        filled ? glow(c, 14, 0.5) : null,
        style,
      ]}
    >
      <Text style={{ fontFamily: FONTS.monoMed, fontSize: 12, letterSpacing: 1, color: filled ? COLORS.bg : c }}>
        [ {label} ]
      </Text>
    </Pressable>
  );
}
