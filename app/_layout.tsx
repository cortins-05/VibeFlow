import '../polyfills';
import '../global.css';
import { useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import TrackPlayer, { Event } from 'react-native-track-player';
import { StatusBar } from 'expo-status-bar';
import { PlaybackService, setupPlayer } from '../services/trackPlayerService';
import { initDatabase } from '../services/db';
import { useLibraryStore } from '../stores/libraryStore';
import {
  Fraunces_400Regular,
  Fraunces_700Bold,
  Fraunces_700Bold_Italic,
  Fraunces_900Black,
} from '@expo-google-fonts/fraunces';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';

SplashScreen.preventAutoHideAsync();
TrackPlayer.registerPlaybackService(() => PlaybackService);

export default function RootLayout() {
  const loadLibrary = useLibraryStore((s) => s.loadLibrary);
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_700Bold,
    Fraunces_700Bold_Italic,
    Fraunces_900Black,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    initDatabase();
    setupPlayer().catch((e) => console.error('[setupPlayer] failed:', e));
    loadLibrary();

    const subs = [
      TrackPlayer.addEventListener(Event.PlaybackState, (e) =>
        console.log('[RNTP] state →', (e as any).state),
      ),
      TrackPlayer.addEventListener(Event.PlaybackError, (e) =>
        console.error('[RNTP] error', (e as any).code, (e as any).message),
      ),
      TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, (e) =>
        console.log('[RNTP] active track changed', (e as any).track?.title),
      ),
      TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () =>
        console.log('[RNTP] queue ended'),
      ),
    ];
    return () => subs.forEach((s) => s.remove());
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <View style={{ flex: 1, backgroundColor: '#f4efe2' }}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#f4efe2' },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="player"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen name="playlist/[id]" />
        </Stack>
      </View>
    </GestureHandlerRootView>
  );
}
