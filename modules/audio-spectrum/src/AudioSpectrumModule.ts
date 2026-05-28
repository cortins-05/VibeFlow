import { requireNativeModule } from 'expo-modules-core';
import type { AudioSpectrumNativeModule } from './AudioSpectrum.types';

const AudioSpectrum = requireNativeModule<AudioSpectrumNativeModule>('AudioSpectrum');
export default AudioSpectrum;
