import { Text, Pressable } from 'react-native';
import { useTheme } from '../../constants/theme';

export default function Tag({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  const { colors, fonts } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: active ? colors.borderAccent : colors.border,
        backgroundColor: active ? 'rgba(229,255,58,0.08)' : colors.surface,
        borderRadius: 4,
        paddingHorizontal: 12,
        paddingVertical: 7,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: active ? colors.accent : colors.text }}>
        #{label}
      </Text>
    </Pressable>
  );
}
