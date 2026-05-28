import { useState } from 'react';
import { View, Text, Pressable, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, ListMusic } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import TrackPlayer, { usePlaybackState, useProgress, State, RepeatMode } from 'react-native-track-player';
import * as Haptics from 'expo-haptics';
import { usePlayerStore } from '../stores/playerStore';
import { useLibraryStore } from '../stores/libraryStore';
import { useTrackDownload } from '../hooks/useTrackDownload';
import { useLyrics } from '../hooks/useLyrics';
import { COLORS, FONTS } from '../constants/theme';
import TerminalArtwork from '../components/player/TerminalArtwork';
import LyricsView from '../components/player/LyricsView';
import ProgressScrub from '../components/player/ProgressScrub';
import PlayerControls from '../components/player/PlayerControls';
import SecondaryActions from '../components/player/SecondaryActions';
import QueuePanel from '../components/player/QueuePanel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ARTWORK_SIZE = SCREEN_WIDTH - 96;
const SEEK_TRACK_WIDTH = SCREEN_WIDTH - 64;

export default function PlayerScreen() {
  const router = useRouter();
  const { currentTrack, shuffle, repeat, setShuffle, setRepeat } = usePlayerStore();
  const { toggleFavorite, isFavorite } = useLibraryStore();
  const playbackState = usePlaybackState();
  const progress = useProgress();
  const isPlaying = playbackState.state === State.Playing;

  const [showLyrics, setShowLyrics] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  const { downloadState, downloadProgress, setDownloadState, handleDownload, handlePauseDownload, handleResumeDownload } =
    useTrackDownload(currentTrack);
  const { lyrics, activeLyricIdx } = useLyrics(currentTrack, progress.position);

  async function togglePlayPause() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    isPlaying ? TrackPlayer.pause() : TrackPlayer.play();
  }

  async function handleSkipNext() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { queue, activeTrackIndex } = usePlayerStore.getState();
    if (queue.length === 0) return;
    const nextIdx = (activeTrackIndex + 1) % queue.length;
    usePlayerStore.getState().playQueue(queue, nextIdx);
  }

  async function handleSkipPrev() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { queue, activeTrackIndex } = usePlayerStore.getState();
    if (queue.length === 0) return;
    if (progress.position > 3) {
      await TrackPlayer.seekTo(0);
    } else {
      const prevIdx = (activeTrackIndex - 1 + queue.length) % queue.length;
      usePlayerStore.getState().playQueue(queue, prevIdx);
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

  function handleSeek(x: number) {
    if (!progress.duration) return;
    const ratio = Math.max(0, Math.min(1, x / SEEK_TRACK_WIDTH));
    TrackPlayer.seekTo(ratio * progress.duration);
  }

  function toggleLyrics() {
    setShowLyrics((v) => !v);
  }

  const fav = currentTrack ? isFavorite(currentTrack.videoId) : false;

  if (!currentTrack) {
    router.back();
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
            hitSlop={10}
          >
            <ChevronDown color={COLORS.text} size={24} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textDim }}>
              <Text style={{ color: COLORS.accent }}>$</Text> now_playing
            </Text>
          </View>
          <Pressable onPress={() => setShowQueue(true)} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
            <ListMusic color={COLORS.text} size={20} />
          </Pressable>
        </View>

        {/* Artwork / lyrics */}
        <View style={{ minHeight: ARTWORK_SIZE + 60, marginTop: 8, justifyContent: 'center' }}>
          {showLyrics && lyrics ? (
            <LyricsView lyrics={lyrics} activeLyricIdx={activeLyricIdx} height={ARTWORK_SIZE + 40} />
          ) : (
            <TerminalArtwork uri={currentTrack.artwork} size={ARTWORK_SIZE} onPress={toggleLyrics} />
          )}
        </View>

        {/* Track info + controls */}
        <View style={{ paddingHorizontal: 24, marginTop: 4, flex: 1, justifyContent: 'flex-end', paddingBottom: 16 }}>
          <View style={{ alignItems: 'center', paddingHorizontal: 8, marginBottom: 20 }}>
            <Text
              style={{ fontFamily: FONTS.sans, fontSize: 28, lineHeight: 32, color: COLORS.text, textAlign: 'center' }}
              numberOfLines={2}
            >
              {currentTrack.title}
            </Text>
            <Text
              style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 1.4, color: COLORS.secondary, marginTop: 8 }}
              numberOfLines={1}
            >
              {currentTrack.artist.toUpperCase()}
            </Text>
          </View>

          <View style={{ width: SEEK_TRACK_WIDTH, alignSelf: 'center' }}>
            <ProgressScrub position={progress.position} duration={progress.duration} onSeek={handleSeek} />
          </View>

          <PlayerControls
            isPlaying={isPlaying}
            shuffle={shuffle}
            repeat={repeat}
            onShuffle={handleShuffle}
            onPrev={handleSkipPrev}
            onPlayPause={togglePlayPause}
            onNext={handleSkipNext}
            onRepeat={handleRepeat}
          />

          <SecondaryActions
            fav={fav}
            onToggleFav={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleFavorite(currentTrack.videoId, currentTrack);
            }}
            hasLyrics={!!lyrics}
            showLyrics={showLyrics}
            onToggleLyrics={toggleLyrics}
            downloadProps={{
              state: downloadState,
              progress: downloadProgress,
              onDownload: handleDownload,
              onPause: handlePauseDownload,
              onResume: handleResumeDownload,
              onDismiss: () => setDownloadState('idle'),
            }}
          />
        </View>
        <QueuePanel visible={showQueue} onClose={() => setShowQueue(false)} />
      </SafeAreaView>
    </View>
  );
}
