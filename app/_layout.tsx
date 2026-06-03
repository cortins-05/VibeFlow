import '../polyfills';
import '../global.css';
import { useEffect } from 'react';
import { View, Platform, PermissionsAndroid } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import TrackPlayer, { Event } from 'react-native-track-player';
import { StatusBar } from 'expo-status-bar';
import { PlaybackService, setupPlayer } from '../services/trackPlayerService';
import { useTheme } from '../constants/theme';
import { initDatabase } from '../services/db';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlayerStore } from '../stores/playerStore';
import { useDownloadStore } from '../stores/downloadStore';
import MiniPlayer from '../components/MiniPlayer';
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
import {
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
} from '@expo-google-fonts/manrope';
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
} from '@expo-google-fonts/inter';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono';

SplashScreen.preventAutoHideAsync();
TrackPlayer.registerPlaybackService(() => PlaybackService);

export default function RootLayout() {
  const loadLibrary = useLibraryStore((s) => s.loadLibrary);
  const loadDownloads = useDownloadStore((s) => s.loadDownloads);
  const { colors } = useTheme();
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_700Bold,
    Fraunces_700Bold_Italic,
    Fraunces_900Black,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    Manrope_300Light,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  useEffect(() => {
    initDatabase();
    setupPlayer().catch((e) => console.error('[setupPlayer] failed:', e));
    loadLibrary();
    loadDownloads();

    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO).catch(() => {});
      } else {
        PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE).catch(() => {});
        PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE).catch(() => {});
      }
    }

    const subs = [
      TrackPlayer.addEventListener(Event.PlaybackState, (e) =>
        console.log('[RNTP] state →', (e as any).state),
      ),
      TrackPlayer.addEventListener(Event.PlaybackError, (e) =>
        console.error('[RNTP] error', (e as any).code, (e as any).message),
      ),
      TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, (e) => {
        const event = e as any;
        console.log('[RNTP] active track changed', event.track?.title, 'index:', event.index);
        const { queue: q, setCurrentTrack: setCur, setActiveTrackIndex: setIdx } = usePlayerStore.getState();
        if (event.track && q.length > 0) {
          // Match by track ID — TrackPlayer queue index doesn't match store index
          const matchIdx = q.findIndex((t) => t.videoId === event.track.id);
          if (matchIdx >= 0) {
            setCur(q[matchIdx]);
            setIdx(matchIdx);
          }
        }
      }),
      TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () =>
        console.log('[RNTP] queue ended'),
      ),
    ];
    return () => subs.forEach((s) => s.remove());
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
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
        <MiniPlayer />
      </View>
    </GestureHandlerRootView>
  );
}
