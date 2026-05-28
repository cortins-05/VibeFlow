export type SpectrumData = {
  bands: number[];
};

export type EventSubscription = {
  remove(): void;
};

export interface AudioSpectrumNativeModule {
  startListening(audioSessionId: number): Promise<void>;
  stopListening(): Promise<void>;
  addListener(eventName: 'onSpectrum', listener: (event: SpectrumData) => void): EventSubscription;
  removeListeners(count: number): void;
}
