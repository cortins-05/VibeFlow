import { View, Text, type ViewStyle } from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';

export default function StatusLine({
  segments,
  style,
}: {
  segments: { text: string; color?: string }[];
  style?: ViewStyle;
}) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      {segments.map((s, i) => (
        <Text key={i} style={{ fontFamily: FONTS.mono, fontSize: 11, color: s.color ?? COLORS.textDim }}>
          {i > 0 ? '  ·  ' : ''}
          {s.text}
        </Text>
      ))}
    </View>
  );
}
