import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import TrackRow from '../../components/TrackRow';
import TrackActionsModal from '../../components/TrackActionsModal';
import ConsoleHeader from '../../components/ui/ConsoleHeader';
import SectionHeader from '../../components/ui/SectionHeader';
import { getTrending, searchYouTube, type VideoInfo } from '../../services/youtube';
import { usePlayerStore } from '../../stores/playerStore';
import { useLibraryStore } from '../../stores/libraryStore';
import { useTheme } from '../../constants/theme';

const MOODS = [
  { label: '#chill', query: 'chill vibes music' },
  { label: '#focus', query: 'focus instrumental' },
  { label: '#hype', query: 'hype playlist' },
  { label: '#latenight', query: 'late night drive' },
];

function toTrack(v: VideoInfo) {
  return {
    id: v.videoId,
    videoId: v.videoId,
    title: v.title,
    artist: v.artist,
    artwork: v.artwork,
    duration: v.duration,
  };
}

export default function HomeScreen() {
  const { colors, fonts } = useTheme();
  const router = useRouter();
  const [trending, setTrending] = useState<VideoInfo[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [trendingError, setTrendingError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const history = useLibraryStore((s) => s.history);
  const favorites = useLibraryStore((s) => s.favorites);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);
  const { currentTrack, playQueue, addToQueue } = usePlayerStore();
  const [actionTrack, setActionTrack] = useState<{ id: string; videoId: string; title: string; artist: string; artwork?: string; duration: number } | null>(null);

  const loadTrending = useCallback(async () => {
    try {
      setIsLoadingTrending(true);
      setTrendingError(false);
      const results = await getTrending();
      if (results.length > 0) {
        setTrending(results);
      } else {
        throw new Error('empty results');
      }
    } catch (e) {
      console.log('Trending failed, using fallback search', e);
      try {
        const fallback = await searchYouTube('new music 2026');
        setTrending(fallback);
      } catch {
        setTrendingError(true);
      }
    } finally {
      setIsLoadingTrending(false);
    }
  }, []);

  useEffect(() => {
    loadTrending();
  }, [loadTrending]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTrending();
    setRefreshing(false);
  }, [loadTrending]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ConsoleHeader path="discover" title="Discover" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              progressBackgroundColor={colors.surface}
            />
          }
        >
          {/* Mood tags */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, marginBottom: 16 }}>
            {MOODS.map((mood) => (
              <TouchableOpacity
                key={mood.label}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/search' as any,
                    params: { q: mood.query },
                  })
                }
                activeOpacity={0.7}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 4,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginRight: 8,
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.secondary }}>
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recent history */}
          {history.length > 0 && (
            <View style={{ marginBottom: 4 }}>
              <SectionHeader label="Recently Played" count={history.length} />
              {history.slice(0, 5).map((h, i) => (
                <TrackRow
                  key={h.video_id}
                  index={i}
                  track={{
                    videoId: h.video_id,
                    title: h.title,
                    artist: h.artist,
                    artwork: h.artwork ?? undefined,
                    duration: h.duration,
                  }}
                  showFavorite
                  isFavorited={favorites.has(h.video_id)}
                  onFavoriteToggle={() =>
                    toggleFavorite(h.video_id, {
                      videoId: h.video_id,
                      title: h.title,
                      artist: h.artist,
                      artwork: h.artwork ?? undefined,
                      duration: h.duration,
                    })
                  }
                  onLongPress={() =>
                    setActionTrack({
                      id: h.video_id,
                      videoId: h.video_id,
                      title: h.title,
                      artist: h.artist,
                      artwork: h.artwork ?? undefined,
                      duration: h.duration,
                    })
                  }
                  onPress={() =>
                    playQueue(
                      history.slice(0, 5).map((entry) =>
                        toTrack({
                          videoId: entry.video_id,
                          title: entry.title,
                          artist: entry.artist,
                          artwork: entry.artwork ?? undefined,
                          duration: entry.duration,
                        }),
                      ),
                      i,
                    )
                  }
                  isActive={currentTrack?.videoId === h.video_id}
                  onSwipeRight={() =>
                    addToQueue({
                      id: h.video_id,
                      videoId: h.video_id,
                      title: h.title,
                      artist: h.artist,
                      artwork: h.artwork ?? undefined,
                      duration: h.duration,
                    })
                  }
                />
              ))}
            </View>
          )}

          {/* Trending */}
          <View style={{ marginBottom: 4 }}>
            <SectionHeader label="Trending" count={trending.length} />

            {isLoadingTrending && (
              <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                <ActivityIndicator color={colors.accent} size="small" />
                <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textFaint, marginTop: 12, letterSpacing: 1.4 }}>
                  LOADING...
                </Text>
              </View>
            )}

            {trendingError && !isLoadingTrending && (
              <View style={{ alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 }}>
                <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.error, letterSpacing: 1 }}>
                  ERR: fetch failed
                </Text>
                <TouchableOpacity
                  onPress={loadTrending}
                  style={{
                    marginTop: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: colors.borderAccent,
                  }}
                >
                  <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.accent }}>
                    [ retry ]
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {!isLoadingTrending &&
              !trendingError &&
              trending.map((video, i) => (
                <TrackRow
                  key={video.videoId}
                  track={video}
                  index={i}
                  isActive={currentTrack?.videoId === video.videoId}
                  showFavorite
                  isFavorited={favorites.has(video.videoId)}
                  onFavoriteToggle={() =>
                    toggleFavorite(video.videoId, {
                      videoId: video.videoId,
                      title: video.title,
                      artist: video.artist,
                      artwork: video.artwork,
                      duration: video.duration,
                    })
                  }
                  onLongPress={() =>
                    setActionTrack({
                      id: video.videoId,
                      videoId: video.videoId,
                      title: video.title,
                      artist: video.artist,
                      artwork: video.artwork,
                      duration: video.duration,
                    })
                  }
                  onPress={() => playQueue(trending.map(toTrack), i)}
                  onSwipeRight={() =>
                    addToQueue({
                      id: video.videoId,
                      videoId: video.videoId,
                      title: video.title,
                      artist: video.artist,
                      artwork: video.artwork,
                      duration: video.duration,
                    })
                  }
                />
              ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      <TrackActionsModal
        visible={!!actionTrack}
        track={actionTrack}
        onClose={() => setActionTrack(null)}
      />
    </View>
  );
}
