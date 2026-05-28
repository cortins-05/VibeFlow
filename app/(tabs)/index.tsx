import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import TrackRow from '../../components/TrackRow';
import AddToPlaylistModal from '../../components/AddToPlaylistModal';
import { getTrending, searchYouTube, type VideoInfo } from '../../services/youtube';
import { usePlayerStore } from '../../stores/playerStore';
import { useLibraryStore } from '../../stores/libraryStore';

const MOODS = [
  { label: 'Chill', query: 'chill vibes music' },
  { label: 'Focus', query: 'focus instrumental' },
  { label: 'Hype', query: 'hype playlist' },
  { label: 'Late Night', query: 'late night drive' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [trending, setTrending] = useState<VideoInfo[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [trendingError, setTrendingError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const history = useLibraryStore((s) => s.history);
  const favorites = useLibraryStore((s) => s.favorites);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);
  const { currentTrack, playQueue } = usePlayerStore();
  const [addToListTrack, setAddToListTrack] = useState<VideoInfo | null>(null);

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

  return (
    <View className="flex-1 bg-[#0e0c0a]">
      <LinearGradient
        colors={['rgba(255,92,46,0.08)', 'rgba(255,92,46,0.02)', 'rgba(10,9,7,0)']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300 }}
      />
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ff5c2e"
              progressBackgroundColor="#1f1916"
            />
          }
        >
          <View className="px-6 pt-4 pb-4">
            <MotiView
              from={{ opacity: 0, translateY: -6 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500 }}
            >
              <View className="flex-row items-end">
                <Text
                  style={{ fontFamily: 'Manrope_300Light', fontSize: 48, lineHeight: 52 }}
                  className="text-cream"
                >
                  Discover
                </Text>
                <Text
                  style={{
                    fontFamily: 'Manrope_300Light',
                    fontSize: 48,
                    lineHeight: 52,
                  }}
                  className="text-accent"
                >
                  .
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: 'Manrope_400Regular',
                  fontSize: 14,
                  color: '#a08a78',
                  marginTop: 4,
                }}
              >
                Find your next favorite track
              </Text>
            </MotiView>
          </View>

          <View className="px-6 mb-6">
            <View className="flex-row flex-wrap">
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
                    backgroundColor: '#1f1916',
                    borderRadius: 999,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: 'rgba(245,239,227,0.08)',
                    marginRight: 8,
                    marginBottom: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Sparkles color="#e8b67a" size={12} strokeWidth={1.8} />
                  <Text
                    style={{
                      fontFamily: 'Manrope_500Medium',
                      fontSize: 13,
                      color: '#f5efe3',
                      marginLeft: 6,
                    }}
                  >
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {history.length > 0 && (
            <View className="mb-4">
              <SectionHeader text="Recently Played" count={history.length} />
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
                    setAddToListTrack({
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
                />
              ))}
            </View>
          )}

          <View className="mb-4">
            <SectionHeader text="Trending" count={trending.length} />

            {isLoadingTrending && (
              <View className="items-center py-12">
                <ActivityIndicator color="#ff5c2e" size="small" />
              </View>
            )}

            {trendingError && !isLoadingTrending && (
              <View className="items-center py-8 px-6">
                <Text
                  style={{
                    fontFamily: 'Manrope_400Regular',
                    fontSize: 15,
                    color: '#a08a78',
                    textAlign: 'center',
                  }}
                >
                  Couldn't load trending right now.
                </Text>
                <TouchableOpacity
                  onPress={loadTrending}
                  style={{
                    marginTop: 12,
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: '#1f1916',
                    borderWidth: 1,
                    borderColor: 'rgba(245,239,227,0.1)',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Manrope_500Medium',
                      fontSize: 13,
                      color: '#f5efe3',
                    }}
                  >
                    Try again
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
                  onLongPress={() => setAddToListTrack(video)}
                  onPress={() => {
                    playQueue(trending.map(toTrack), i);
                  }}
                />
              ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      <AddToPlaylistModal
        visible={!!addToListTrack}
        track={addToListTrack ? { id: addToListTrack.videoId, ...addToListTrack } : null}
        onClose={() => setAddToListTrack(null)}
      />
    </View>
  );
}

function SectionHeader({ text, count }: { text: string; count: number }) {
  return (
    <View className="flex-row items-center px-6 mb-3">
      <View
        style={{ width: 4, height: 16, borderRadius: 2, backgroundColor: '#ff5c2e' }}
      />
      <Text
        style={{
          fontFamily: 'Manrope_500Medium',
          fontSize: 15,
          marginLeft: 10,
          color: '#f5efe3',
        }}
      >
        {text}
      </Text>
      <Text
        style={{
          fontFamily: 'Manrope_400Regular',
          fontSize: 12,
          marginLeft: 6,
          color: '#5a4d42',
        }}
      >
        {String(count).padStart(2, '0')}
      </Text>
      <View
        style={{
          flex: 1,
          height: 1,
          backgroundColor: 'rgba(245,239,227,0.06)',
          marginLeft: 10,
        }}
      />
    </View>
  );
}
