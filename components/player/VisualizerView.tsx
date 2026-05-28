import { memo } from 'react';
import { Text, View } from 'react-native';
import { Canvas, Rect, LinearGradient, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { COLORS, FONTS } from '../../constants/theme';
import { useAudioSpectrum } from '../../hooks/useAudioSpectrum';

const BAR_COUNT = 32;
const BAR_GAP = 2;
const PADDING = 8;

type BarProps = {
  bands: SharedValue<number[]>;
  index: number;
  barWidth: number;
  canvasHeight: number;
};

function Bar({ bands, index, barWidth, canvasHeight }: BarProps) {
  const x = PADDING + index * (barWidth + BAR_GAP);
  const maxH = canvasHeight - PADDING * 2;

  const height = useDerivedValue(() => bands.value[index] ?? 1);
  const y = useDerivedValue(() => canvasHeight - PADDING - height.value);

  return (
    <Rect x={x} y={y} width={barWidth} height={height}>
      <LinearGradient
        start={vec(0, canvasHeight)}
        end={vec(0, 0)}
        colors={[COLORS.secondary, COLORS.accent]}
      />
    </Rect>
  );
}

const BarMemo = memo(Bar);

export default function VisualizerView({ size }: { size: number }) {
  const { bands } = useAudioSpectrum();
  const barWidth = (size - PADDING * 2 - BAR_GAP * (BAR_COUNT - 1)) / BAR_COUNT;

  return (
    <View style={{ width: size, alignSelf: 'center' }}>
      <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textDim, marginBottom: 6 }}>
        ┌─ spectrum ── <Text style={{ color: COLORS.secondary }}>[fft]</Text> ──┐
      </Text>
      <Canvas style={{ width: size, height: size, borderRadius: 4 }}>
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <BarMemo key={i} bands={bands} index={i} barWidth={barWidth} canvasHeight={size} />
        ))}
      </Canvas>
      <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textFaint, marginTop: 4, textAlign: 'center' }}>
        tap → cover
      </Text>
    </View>
  );
}
