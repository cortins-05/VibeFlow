import { memo, useEffect } from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Play, Pause, SkipForward } from 'lucide-react-native';
import TrackPlayer, { usePlaybackState, useProgress, State } from 'react-native-track-player';
import { usePlayerStore } from '../stores/playerStore';

const MiniPlayer = memo(function MiniPlayer() {
  const router = useRouter();
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

  const progressRatio =
    progress.duration > 0 ? progress.position / progress.duration : 0;

  return (
    <Animated.View
      style={[animStyle, { position: 'absolute', bottom: 78, left: 0, right: 0, zIndex: 50 }]}
    >
      <Pressable onPress={() => router.push('/player')}>
        <BlurView
          intensity={90}
          tint="dark"
          style={{
            marginHorizontal: 12,
            borderRadius: 16,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(245,239,227,0.08)',
            backgroundColor: 'rgba(31,25,22,0.6)',
          }}
        >
          <View className="flex-row items-center px-3 py-3">
            <Image
              source={{ uri: currentTrack.artwork }}
              style={{ width: 42, height: 42, borderRadius: 6, backgroundColor: '#15110e' }}
              contentFit="cover"
            />
            <View className="flex-1 min-w-0 ml-3">
              <Text
                style={{
                  fontFamily: 'Manrope_500Medium',
                  fontSize: 16,
                  lineHeight: 18,
                  color: '#f5efe3',
                }}
                numberOfLines={1}
              >
                {currentTrack.title}
              </Text>
              <Text
                style={{
                  fontFamily: 'Manrope_500Medium',
                  fontSize: 10,
                  letterSpacing: 0.4,
                  color: '#a08a78',
                  marginTop: 2,
                }}
                numberOfLines={1}
              >
                {currentTrack.artist}
              </Text>
            </View>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => (isPlaying ? TrackPlayer.pause() : TrackPlayer.play())}
                className="w-9 h-9 items-center justify-center"
              >
                {isPlaying ? (
                  <Pause color="#f5efe3" size={18} fill="#f5efe3" />
                ) : (
                  <Play color="#f5efe3" size={18} fill="#f5efe3" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => TrackPlayer.skipToNext()}
                className="w-9 h-9 items-center justify-center"
              >
                <SkipForward color="#a08a78" size={18} />
              </TouchableOpacity>
            </View>
          </View>
          <View
            style={{
              height: 2,
              backgroundColor: 'rgba(245,239,227,0.06)',
              marginHorizontal: 12,
              marginBottom: 8,
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: '100%',
                width: `${progressRatio * 100}%`,
                backgroundColor: '#ff5c2e',
              }}
            />
          </View>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
});

export default MiniPlayer;
