import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  interpolate,
  Extrapolation,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Heart, ChevronDown, ListMusic, Mic2,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import TrackPlayer, {
  usePlaybackState,
  useProgress,
  State,
  RepeatMode,
} from 'react-native-track-player';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import { usePlayerStore } from '../stores/playerStore';
import { useLibraryStore } from '../stores/libraryStore';
import DownloadButton from '../components/DownloadButton';
import { useDownloadStore } from '../stores/downloadStore';
import { fetchLyrics, type LyricLine } from '../services/lyrics';
import { getDownloadUrl } from '../services/youtube';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ARTWORK_SIZE = SCREEN_WIDTH - 96;
const SEEK_TRACK_WIDTH = SCREEN_WIDTH - 64;

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function PlayerScreen() {
  const router = useRouter();
  const { currentTrack, shuffle, repeat, setShuffle, setRepeat } = usePlayerStore();
  const { toggleFavorite, isFavorite } = useLibraryStore();
  const playbackState = usePlaybackState();
  const progress = useProgress();
  const isPlaying = playbackState.state === State.Playing;

  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<LyricLine[] | null>(null);
  const [activeLyricIdx, setActiveLyricIdx] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'pausing' | 'paused' | 'done' | 'error'>(
    currentTrack && useDownloadStore.getState().isDownloaded(currentTrack.videoId) ? 'done' : 'idle'
  );
  const downloadResumableRef = useRef<FileSystem.DownloadResumable | null>(null);
  const downloadResumeDataRef = useRef<string | undefined>(undefined);
  const downloadUrlRef = useRef<string | undefined>(undefined);
  const lyricsScrollRef = useRef<ScrollView>(null);

  const artworkScale = useSharedValue(1);
  const artworkRotate = useSharedValue(0);
  const lyricsOpacity = useSharedValue(0);

  useEffect(() => {
    if (currentTrack) {
      fetchLyrics(currentTrack.title, currentTrack.artist, currentTrack.duration).then(setLyrics);
    }
  }, [currentTrack?.videoId]);

  useEffect(() => {
    setDownloadState(
      currentTrack && useDownloadStore.getState().isDownloaded(currentTrack.videoId) ? 'done' : 'idle'
    );
    setDownloadProgress(null);
    downloadResumableRef.current = null;
    downloadResumeDataRef.current = undefined;
    downloadUrlRef.current = undefined;
  }, [currentTrack?.videoId]);

  useEffect(() => {
    if (!lyrics) return;
    const idx = lyrics.findLastIndex((l) => l.time <= progress.position);
    if (idx !== activeLyricIdx) {
      setActiveLyricIdx(idx);
      lyricsScrollRef.current?.scrollTo({ y: Math.max(0, idx - 2) * 56, animated: true });
    }
  }, [progress.position, lyrics]);

  useEffect(() => {
    artworkScale.value = withSpring(isPlaying ? 1 : 0.94, { damping: 14, stiffness: 90 });
    if (isPlaying) {
      artworkRotate.value = withRepeat(
        withTiming(360, { duration: 28000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      cancelAnimation(artworkRotate);
    }
  }, [isPlaying]);

  useEffect(() => {
    lyricsOpacity.value = withTiming(showLyrics ? 1 : 0, { duration: 280 });
  }, [showLyrics]);

  const artworkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: artworkScale.value }, { rotateZ: `${artworkRotate.value}deg` }],
  }));

  const lyricsStyle = useAnimatedStyle(() => ({
    opacity: lyricsOpacity.value,
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  }));

  const artworkOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(lyricsOpacity.value, [0, 1], [1, 0], Extrapolation.CLAMP),
  }));

  async function togglePlayPause() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    isPlaying ? TrackPlayer.pause() : TrackPlayer.play();
  }

  async function handleSkipNext() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { queue, activeTrackIndex } = usePlayerStore.getState();
    const nextIdx = activeTrackIndex + 1;
    if (nextIdx < queue.length) {
      usePlayerStore.getState().playQueue(queue, nextIdx);
    }
  }

  async function handleSkipPrev() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { queue, activeTrackIndex } = usePlayerStore.getState();
    if (progress.position > 3) {
      await TrackPlayer.seekTo(0);
    } else if (activeTrackIndex > 0) {
      usePlayerStore.getState().playQueue(queue, activeTrackIndex - 1);
    }
  }

  async function handleShuffle() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShuffle(!shuffle);
  }

  async function handleRepeat() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next =
      repeat === RepeatMode.Off
        ? RepeatMode.Queue
        : repeat === RepeatMode.Queue
        ? RepeatMode.Track
        : RepeatMode.Off;
    setRepeat(next);
    TrackPlayer.setRepeatMode(next);
  }

  async function handleDownload() {
    if (!currentTrack) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDownloadState('downloading');
    setDownloadProgress(0);

    try {
      const src = await getDownloadUrl(currentTrack.videoId);
      if (!src?.url) {
        setDownloadState('error');
        return;
      }

      downloadUrlRef.current = src.url;

      const dir = `${FileSystem.documentDirectory}audio/`;
      const safeName = currentTrack.title.replace(/[/\\?%*:|"<>]/g, '_');
      // Use extension from content-type or default to .m4a
      const ext = src.url.includes('.webm') ? '.webm' : '.m4a';
      const destFile = dir + safeName + ext;

      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

      const callback: FileSystem.DownloadProgressCallback = (data) => {
        if (data.totalBytesExpectedToWrite > 0) {
          setDownloadProgress(data.totalBytesWritten / data.totalBytesExpectedToWrite);
        }
      };

      const resumable = FileSystem.createDownloadResumable(
        src.url,
        destFile,
        src.headers,
        callback,
        downloadResumeDataRef.current,
      );
      downloadResumableRef.current = resumable;

      const result = await resumable.downloadAsync();

      if (result?.uri) {
        downloadResumableRef.current = null;
        downloadResumeDataRef.current = undefined;
        setDownloadState('done');
        setDownloadProgress(1);
        if (currentTrack) {
          useDownloadStore.getState().registerDownload(currentTrack, result.uri);
        }
      } else {
        setDownloadState('error');
      }
    } catch (e) {
      const errMsg = (e as Error).message;
      // Pause is intentional — don't show as error
      if (errMsg?.includes('cancelled') || errMsg?.includes('pause')) {
        return;
      }
      console.error('[player] download failed:', errMsg);
      setDownloadState('error');
    }
  }

  async function handlePauseDownload() {
    const r = downloadResumableRef.current;
    if (!r) return;
    setDownloadState('pausing');
    try {
      const pauseState = await r.pauseAsync();
      downloadResumeDataRef.current = pauseState.resumeData;
      downloadResumableRef.current = null;
      setDownloadState('paused');
    } catch {
      setDownloadState('error');
    }
  }

  async function handleResumeDownload() {
    if (!currentTrack || !downloadResumeDataRef.current) return;
    setDownloadState('downloading');

    try {
      const dir = `${FileSystem.documentDirectory}audio/`;
      const safeName = currentTrack.title.replace(/[/\\?%*:|"<>]/g, '_');
      const ext = downloadUrlRef.current?.includes('.webm') ? '.webm' : '.m4a';
      const destFile = dir + safeName + ext;

      const callback: FileSystem.DownloadProgressCallback = (data) => {
        if (data.totalBytesExpectedToWrite > 0) {
          setDownloadProgress(data.totalBytesWritten / data.totalBytesExpectedToWrite);
        }
      };

      const resumable = FileSystem.createDownloadResumable(
        downloadUrlRef.current!,
        destFile,
        undefined,
        callback,
        downloadResumeDataRef.current,
      );
      downloadResumableRef.current = resumable;
      downloadResumeDataRef.current = undefined;

      const result = await resumable.downloadAsync();

      if (result?.uri) {
        downloadResumableRef.current = null;
        setDownloadState('done');
        setDownloadProgress(1);
        if (currentTrack) {
          useDownloadStore.getState().registerDownload(currentTrack, result.uri);
        }
      } else {
        setDownloadState('error');
      }
    } catch (e) {
      const errMsg = (e as Error).message;
      if (errMsg?.includes('cancelled') || errMsg?.includes('pause')) {
        return;
      }
      console.error('[player] download resume failed:', errMsg);
      setDownloadState('error');
    }
  }

  function handleSeek(x: number) {
    if (!progress.duration) return;
    const ratio = Math.max(0, Math.min(1, x / SEEK_TRACK_WIDTH));
    TrackPlayer.seekTo(ratio * progress.duration);
  }

  const progressRatio = progress.duration > 0 ? progress.position / progress.duration : 0;
  const fav = currentTrack ? isFavorite(currentTrack.videoId) : false;

  if (!currentTrack) {
    router.back();
    return null;
  }

  return (
    <View className="flex-1 bg-[#0e0c0a]">
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['rgba(255,92,46,0.35)', 'rgba(232,182,122,0.10)', '#0a0907']}
        locations={[0, 0.35, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 540 }}
      />

      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        {/* Header */}
        <View className="flex-row items-center px-5 pt-2 pb-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronDown color="#f5efe3" size={24} />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text
              style={{
                fontFamily: 'Manrope_400Regular',
                fontSize: 12,
                color: '#a08a78',
              }}
            >
              Now playing
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {}}
            className="w-10 h-10 items-center justify-center"
          >
            <ListMusic color="#a08a78" size={20} />
          </TouchableOpacity>
        </View>

        {/* Artwork or lyrics */}
        <View
          style={{ height: ARTWORK_SIZE + 40, marginTop: 8 }}
          className="items-center justify-center"
        >
          <Animated.View style={artworkOpacity}>
            <View
              style={{
                shadowColor: '#ff5c2e',
                shadowOffset: { width: 0, height: 28 },
                shadowOpacity: 0.45,
                shadowRadius: 40,
                elevation: 20,
              }}
            >
              <Animated.View
                style={[
                  {
                    width: ARTWORK_SIZE,
                    height: ARTWORK_SIZE,
                    borderRadius: ARTWORK_SIZE / 2,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: 'rgba(245,239,227,0.10)',
                  },
                  artworkStyle,
                ]}
              >
                <Image
                  source={{ uri: currentTrack.artwork }}
                  style={{ width: ARTWORK_SIZE, height: ARTWORK_SIZE }}
                  contentFit="cover"
                />
                {/* Vinyl center dot */}
                <View
                  style={{
                    position: 'absolute',
                    top: ARTWORK_SIZE / 2 - 14,
                    left: ARTWORK_SIZE / 2 - 14,
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: '#0a0907',
                    borderWidth: 2,
                    borderColor: 'rgba(245,239,227,0.20)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#ff5c2e',
                    }}
                  />
                </View>
              </Animated.View>
            </View>
          </Animated.View>

          {lyrics && (
            <Animated.View style={lyricsStyle}>
              <BlurView
                intensity={80}
                tint="dark"
                style={{
                  flex: 1,
                  marginHorizontal: 20,
                  borderRadius: 28,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: 'rgba(255,92,46,0.08)',
                }}
              >
                <LinearGradient
                  colors={['rgba(255,92,46,0.06)', 'transparent']}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, zIndex: 10 }}
                  pointerEvents="none"
                />
                <ScrollView
                  ref={lyricsScrollRef}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 48, paddingHorizontal: 20 }}
                >
                  {lyrics.map((line, i) => {
                    const isActive = i === activeLyricIdx;
                    const isPast = i < activeLyricIdx;
                    return (
                      <View key={i} className="flex-row items-start mb-3">
                        <View
                          style={{
                            width: 24,
                            alignItems: 'center',
                            paddingTop: isActive ? 6 : 10,
                          }}
                        >
                          <View
                            style={{
                              width: isActive ? 8 : 4,
                              height: isActive ? 8 : 4,
                              borderRadius: isActive ? 4 : 2,
                              backgroundColor: isActive
                                ? '#ff5c2e'
                                : isPast
                                ? '#3a322c'
                                : '#5a4d42',
                            }}
                          />
                          {i < lyrics.length - 1 && (
                            <View
                              style={{
                                width: 1,
                                flex: 1,
                                minHeight: 20,
                                backgroundColor: isPast
                                  ? 'rgba(255,92,46,0.15)'
                                  : 'rgba(90,77,66,0.3)',
                              }}
                            />
                          )}
                        </View>
                        <MotiView
                          from={isActive ? { opacity: 0.6, scale: 0.95 } : undefined}
                          animate={
                            isActive
                              ? { opacity: 1, scale: 1 }
                              : { opacity: 1, scale: 1 }
                          }
                          transition={{ type: 'timing', duration: 260 }}
                          style={{ flex: 1, paddingLeft: 12 }}
                        >
                          {isActive && (
                            <View
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: -2,
                                bottom: -2,
                                width: 2,
                                backgroundColor: '#ff5c2e',
                                borderRadius: 1,
                                shadowColor: '#ff5c2e',
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.6,
                                shadowRadius: 6,
                                elevation: 4,
                              }}
                            />
                          )}
                          <Text
                            style={{
                              fontFamily: isActive
                                ? 'Manrope_500Medium'
                                : 'Manrope_400Regular',
                              fontSize: isActive ? 22 : 15,
                              lineHeight: isActive ? 28 : 22,
                              color: isActive
                                ? '#f5efe3'
                                : isPast
                                ? '#3a322c'
                                : '#7a6a5a',
                              textAlign: 'left',
                              letterSpacing: isActive ? 0.3 : 0.1,
                            }}
                          >
                            {line.text}
                          </Text>
                        </MotiView>
                      </View>
                    );
                  })}
                </ScrollView>
                <LinearGradient
                  colors={['transparent', 'rgba(10,9,7,0.6)']}
                  style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, zIndex: 10 }}
                  pointerEvents="none"
                />
              </BlurView>
            </Animated.View>
          )}
        </View>

        {/* Track info + controls */}
        <View className="px-6 mt-4 flex-1 justify-end pb-4">
          <View className="items-center px-2 mb-6">
            <Text
              style={{
                fontFamily: 'Manrope_500Medium',
                fontSize: 32,
                lineHeight: 36,
                color: '#f5efe3',
                textAlign: 'center',
              }}
              numberOfLines={2}
            >
              {currentTrack.title}
            </Text>
            <Text
              style={{
                fontFamily: 'JetBrainsMono_400Regular',
                fontSize: 11,
                letterSpacing: 1.4,
                color: '#a08a78',
                marginTop: 8,
              }}
              numberOfLines={1}
            >
              {currentTrack.artist.toUpperCase()}
            </Text>
          </View>

          {/* Progress */}
          <View>
            <View
              style={{
                height: 32,
                justifyContent: 'center',
                marginHorizontal: 0,
              }}
              onStartShouldSetResponder={() => true}
              onResponderGrant={(e) => handleSeek(e.nativeEvent.locationX)}
              onResponderMove={(e) => handleSeek(e.nativeEvent.locationX)}
            >
              <View
                style={{
                  height: 3,
                  backgroundColor: 'rgba(245,239,227,0.08)',
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
              <View
                style={{
                  position: 'absolute',
                  left: `${progressRatio * 100}%`,
                  marginLeft: -6,
                  top: 9,
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: '#f5efe3',
                  borderWidth: 3,
                  borderColor: '#ff5c2e',
                }}
              />
            </View>
            <View className="flex-row justify-between mt-2">
              <Text
                style={{
                  fontFamily: 'JetBrainsMono_400Regular',
                  fontSize: 10,
                  color: '#a08a78',
                }}
              >
                {formatTime(progress.position)}
              </Text>
              <Text
                style={{
                  fontFamily: 'JetBrainsMono_400Regular',
                  fontSize: 10,
                  color: '#5a4d42',
                }}
              >
                -{formatTime(Math.max(0, progress.duration - progress.position))}
              </Text>
            </View>
          </View>

          {/* Primary controls */}
          <View className="flex-row items-center justify-between mt-7">
            <TouchableOpacity
              onPress={handleShuffle}
              className="w-12 h-12 items-center justify-center"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Shuffle color={shuffle ? '#ff5c2e' : '#5a4d42'} size={20} strokeWidth={1.8} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSkipPrev}
              className="w-12 h-12 items-center justify-center"
            >
              <SkipBack color="#f5efe3" size={28} fill="#f5efe3" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={togglePlayPause}
              activeOpacity={0.85}
              style={{
                width: 76,
                height: 76,
                borderRadius: 38,
                backgroundColor: '#ff5c2e',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#ff5c2e',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.5,
                shadowRadius: 24,
                elevation: 16,
              }}
            >
              {isPlaying ? (
                <Pause color="#f5efe3" size={30} fill="#f5efe3" />
              ) : (
                <Play color="#f5efe3" size={30} fill="#f5efe3" style={{ marginLeft: 3 }} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSkipNext}
              className="w-12 h-12 items-center justify-center"
            >
              <SkipForward color="#f5efe3" size={28} fill="#f5efe3" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRepeat}
              className="w-12 h-12 items-center justify-center"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {repeat === RepeatMode.Track ? (
                <Repeat1 color="#ff5c2e" size={20} strokeWidth={1.8} />
              ) : (
                <Repeat
                  color={repeat === RepeatMode.Queue ? '#ff5c2e' : '#5a4d42'}
                  size={20}
                  strokeWidth={1.8}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Secondary actions */}
          <View className="flex-row justify-center items-center mt-6">
            <TouchableOpacity
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleFavorite(currentTrack.videoId, currentTrack);
              }}
              className="flex-row items-center px-4 py-2 rounded-full"
              style={{
                borderWidth: 1,
                borderColor: fav ? 'rgba(255,92,46,0.4)' : 'rgba(245,239,227,0.08)',
                backgroundColor: fav ? 'rgba(255,92,46,0.10)' : 'transparent',
                marginRight: 10,
              }}
            >
              <Heart
                color={fav ? '#ff5c2e' : '#a08a78'}
                size={14}
                fill={fav ? '#ff5c2e' : 'transparent'}
              />
              <Text
                style={{
                  fontFamily: 'Manrope_500Medium',
                  fontSize: 12,
                  color: fav ? '#ff5c2e' : '#a08a78',
                  marginLeft: 6,
                }}
              >
                {fav ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>

            {lyrics && (
              <TouchableOpacity
                onPress={() => setShowLyrics(!showLyrics)}
                className="flex-row items-center px-4 py-2 rounded-full"
                style={{
                  borderWidth: 1,
                  borderColor: showLyrics
                    ? 'rgba(255,92,46,0.4)'
                    : 'rgba(245,239,227,0.08)',
                  backgroundColor: showLyrics
                    ? 'rgba(255,92,46,0.10)'
                    : 'transparent',
                }}
              >
                <Mic2
                  color={showLyrics ? '#ff5c2e' : '#a08a78'}
                  size={14}
                />
                <Text
                  style={{
                    fontFamily: 'Manrope_500Medium',
                    fontSize: 12,
                    color: showLyrics ? '#ff5c2e' : '#a08a78',
                    marginLeft: 6,
                  }}
                >
                  Lyrics
                </Text>
              </TouchableOpacity>
            )}

            <DownloadButton
              state={downloadState}
              progress={downloadProgress}
              onDownload={handleDownload}
              onPause={handlePauseDownload}
              onResume={handleResumeDownload}
              onDismiss={() => setDownloadState('idle')}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
