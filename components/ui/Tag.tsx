import { Text, Pressable } from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';

export default function Tag({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: active ? COLORS.borderAccent : COLORS.border,
        backgroundColor: active ? 'rgba(229,255,58,0.08)' : COLORS.surface,
        borderRadius: 4,
        paddingHorizontal: 12,
        paddingVertical: 7,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text style={{ fontFamily: FONTS.mono, fontSize: 12, color: active ? COLORS.accent : COLORS.text }}>
        #{label}
      </Text>
    </Pressable>
  );
}
