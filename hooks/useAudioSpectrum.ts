import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { useSharedValue, withSpring } from 'react-native-reanimated';
import AudioSpectrumModule from '../modules/audio-spectrum/src/AudioSpectrumModule';
import type { SpectrumData } from '../modules/audio-spectrum/src/AudioSpectrum.types';

const SPRING_CONFIG = { stiffness: 180, damping: 12 };

export function useAudioSpectrum() {
  const bands = useSharedValue<number[]>(new Array(32).fill(1));
  const hasDataRef = useRef(false);
  const subRef = useRef<ReturnType<typeof AudioSpectrumModule.addListener> | null>(null);

  const start = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    try {
      const permitted = await AudioSpectrumModule.isPermissionGranted();
      if (!permitted) return;

      subRef.current = AudioSpectrumModule.addListener('onSpectrum', (event: SpectrumData) => {
        hasDataRef.current = true;
        const b = event.bands;
        for (let i = 0; i < 32; i++) {
          bands.value[i] = withSpring(Math.max(1, (b[i] ?? 0) * 140), SPRING_CONFIG);
        }
      });

      await AudioSpectrumModule.startListening(0);
    } catch {}
  }, []);

  const stop = useCallback(async () => {
    try {
      subRef.current?.remove();
      subRef.current = null;
      await AudioSpectrumModule.stopListening();
    } catch {}
    bands.value = new Array(32).fill(1);
  }, []);

  useEffect(() => {
    start();
    return () => { stop(); };
  }, []);

  return { bands };
}
