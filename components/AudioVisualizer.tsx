import { useEffect } from 'react';
import { Canvas, Path, Skia, Group } from '@shopify/react-native-skia';
import { useSharedValue, withRepeat, withSequence, withTiming, useDerivedValue } from 'react-native-reanimated';

interface Props {
  isPlaying: boolean;
  size: number;
}

const BAR_COUNT = 32;

export default function AudioVisualizer({ isPlaying, size }: Props) {
  const phases = Array.from({ length: BAR_COUNT }, (_, i) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSharedValue(Math.random() * Math.PI * 2)
  );

  useEffect(() => {
    phases.forEach((phase, i) => {
      if (isPlaying) {
        phase.value = withRepeat(
          withSequence(
            withTiming(Math.PI * 2, { duration: 600 + i * 30 }),
            withTiming(0, { duration: 600 + i * 30 })
          ),
          -1,
          true
        );
      } else {
        phase.value = withTiming(0, { duration: 400 });
      }
    });
  }, [isPlaying]);

  const path = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const barWidth = 3;
    const gap = (size - BAR_COUNT * barWidth) / (BAR_COUNT + 1);
    const centerY = size - 24;
    const maxHeight = 36;

    for (let i = 0; i < BAR_COUNT; i++) {
      const x = gap + i * (barWidth + gap);
      const amplitude = isPlaying ? Math.sin(phases[i].value) * 0.5 + 0.5 : 0.05;
      const h = Math.max(4, amplitude * maxHeight);
      p.addRRect({
        rect: { x, y: centerY - h, width: barWidth, height: h },
        rx: 2,
        ry: 2,
      });
    }
    return p;
  });

  return (
    <Canvas
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
      }}
    >
      <Group opacity={0.6}>
        <Path path={path} color="rgba(255,255,255,0.7)" />
      </Group>
    </Canvas>
  );
}
