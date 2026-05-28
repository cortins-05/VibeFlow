import { View, Text } from 'react-native';
import { useTheme } from '../../constants/theme';

export default function SectionHeader({ label, count }: { label: string; count?: number }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12, marginTop: 8 }}>
      <Text style={{ fontFamily: fonts.monoMed, fontSize: 12, letterSpacing: 2, color: colors.accent }}>
        [ {label.toUpperCase()} ]
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border, marginHorizontal: 10 }} />
      {count != null ? (
        <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim }}>
          [{String(count).padStart(2, '0')}]
        </Text>
      ) : null}
    </View>
  );
}
