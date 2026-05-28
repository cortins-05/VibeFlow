import { View, Text } from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';

export default function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12, marginTop: 8 }}>
      <Text style={{ fontFamily: FONTS.monoMed, fontSize: 12, letterSpacing: 2, color: COLORS.accent }}>
        [ {label.toUpperCase()} ]
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border, marginHorizontal: 10 }} />
      {count != null ? (
        <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textDim }}>
          [{String(count).padStart(2, '0')}]
        </Text>
      ) : null}
    </View>
  );
}
