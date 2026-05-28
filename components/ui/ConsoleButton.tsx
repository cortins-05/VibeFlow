import { Text, Pressable, type ViewStyle } from 'react-native';
import { useTheme, glow } from '../../constants/theme';

type Variant = 'accent' | 'secondary' | 'ghost' | 'error';

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
  const { colors, fonts } = useTheme();
  const C: Record<Variant, string> = {
    accent: colors.accent,
    secondary: colors.secondary,
    ghost: colors.textDim,
    error: colors.error,
  };
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
      <Text style={{ fontFamily: fonts.monoMed, fontSize: 12, letterSpacing: 1, color: filled ? colors.bg : c }}>
        [ {label} ]
      </Text>
    </Pressable>
  );
}
