import { useEffect, useRef } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import AudioSpectrumModule from '../modules/audio-spectrum/src/AudioSpectrumModule';
import type { SpectrumData } from '../modules/audio-spectrum/src/AudioSpectrum.types';

export function useAudioSpectrum() {
  const bands = useSharedValue<number[]>(new Array(32).fill(0));
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (Platform.OS !== 'android') return;

      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Audio Visualization',
            message: 'VibeFlow needs access to audio output for the visualizer.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED || cancelled) return;

        const sub = AudioSpectrumModule.addListener('onSpectrum', (event: SpectrumData) => {
          bands.value = event.bands;
        });

        await AudioSpectrumModule.startListening(0);

        cleanupRef.current = () => {
          sub.remove();
          AudioSpectrumModule.stopListening();
          bands.value = new Array(32).fill(0);
        };
      } catch {
        // Visualizer not available or permission denied
      }
    }

    init();

    return () => {
      cancelled = true;
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  return { bands };
}
