import { View, Text } from 'react-native';
import { COLORS, FONTS, glow } from '../../constants/theme';

// Placeholder spectrum. Plan 2 replaces internals with real FFT-driven bars.
export default function VisualizerView({ size }: { size: number }) {
  const bars = [0.3, 0.7, 0.45, 0.9, 0.55, 0.8, 0.4, 0.65, 0.5, 0.75, 0.35, 0.85];
  return (
    <View style={{ width: size, alignSelf: 'center' }}>
      <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textDim, marginBottom: 6 }}>
        ┌─ spectrum ── <Text style={{ color: COLORS.secondary }}>[placeholder]</Text> ──┐
      </Text>
      <View
        style={{
          width: size,
          height: size,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          paddingHorizontal: 8,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 4,
          paddingVertical: 12,
        }}
      >
        {bars.map((h, i) => (
          <View
            key={i}
            style={[
              { flex: 1, marginHorizontal: 2, height: `${h * 100}%`, backgroundColor: COLORS.accent, borderRadius: 2 },
              glow(COLORS.accent, 8, 0.4),
            ]}
          />
        ))}
      </View>
      <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textFaint, marginTop: 4, textAlign: 'center' }}>
        tap → cover
      </Text>
    </View>
  );
}
