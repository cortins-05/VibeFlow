import { memo, useEffect } from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Pause, SkipForward } from 'lucide-react-native';
import TrackPlayer, { usePlaybackState, useProgress, State } from 'react-native-track-player';
import { usePlayerStore } from '../stores/playerStore';
import { useTheme, glow } from '../constants/theme';

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const MiniPlayer = memo(function MiniPlayer() {
  const { colors, fonts } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentTrack, isPlayerVisible } = usePlayerStore();
  const playbackState = usePlaybackState();
  const progress = useProgress();
  const isPlaying = playbackState.state === State.Playing;

  const translateY = useSharedValue(140);

  useEffect(() => {
    translateY.value = withSpring(isPlayerVisible && currentTrack ? 0 : 140, {
      damping: 22,
      stiffness: 140,
    });
  }, [isPlayerVisible, currentTrack]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!currentTrack) return null;

  const progressRatio = progress.duration > 0 ? progress.position / progress.duration : 0;

  return (
    <Animated.View
      style={[animStyle, { position: 'absolute', bottom: 78 + insets.bottom, left: 0, right: 0, zIndex: 50 }]}
    >
      <Pressable onPress={() => router.push('/player')}>
        <View
          style={{
            marginHorizontal: 12,
            borderRadius: 6,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 }}>
            <Text
              style={{
                fontFamily: fonts.mono,
                fontSize: 14,
                color: colors.accent,
                marginRight: 10,
                ...glow(colors.accent, 4, 0.5),
              }}
            >
              {isPlaying ? '▶' : '❚❚'}
            </Text>
            <Image
              source={{ uri: currentTrack.artwork }}
              style={{ width: 36, height: 36, borderRadius: 4, backgroundColor: colors.surface }}
              contentFit="cover"
            />
            <View style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
              <Text
                style={{ fontFamily: fonts.sans, fontSize: 14, lineHeight: 16, color: colors.text }}
                numberOfLines={1}
              >
                {currentTrack.title}
              </Text>
              <Text
                style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.4, color: colors.textDim, marginTop: 2 }}
                numberOfLines={1}
              >
                {currentTrack.artist.toUpperCase()} · {fmt(progress.position)}/{fmt(progress.duration)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => (isPlaying ? TrackPlayer.pause() : TrackPlayer.play())}
                style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
              >
                {isPlaying ? (
                  <Pause color={colors.accent} size={16} fill={colors.accent} />
                ) : (
                  <Play color={colors.accent} size={16} fill={colors.accent} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => TrackPlayer.skipToNext()}
                style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
              >
                <SkipForward color={colors.textDim} size={16} />
              </TouchableOpacity>
            </View>
          </View>
          <View
            style={{
              height: 2,
              backgroundColor: colors.border,
              marginHorizontal: 12,
              marginBottom: 6,
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: '100%',
                width: `${progressRatio * 100}%`,
                backgroundColor: colors.accent,
              }}
            />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

export default MiniPlayer;
