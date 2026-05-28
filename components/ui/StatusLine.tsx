import { View, Text, type ViewStyle } from 'react-native';
import { useTheme } from '../../constants/theme';

export default function StatusLine({
  segments,
  style,
}: {
  segments: { text: string; color?: string }[];
  style?: ViewStyle;
}) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      {segments.map((s, i) => (
        <Text key={i} style={{ fontFamily: fonts.mono, fontSize: 11, color: s.color ?? colors.textDim }}>
          {i > 0 ? '  ·  ' : ''}
          {s.text}
        </Text>
      ))}
    </View>
  );
}
