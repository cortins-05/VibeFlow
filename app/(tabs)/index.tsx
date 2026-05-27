import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import TrackRow from '../../components/TrackRow';
import { getTrending, type VideoInfo } from '../../services/youtube';
import { usePlayerStore } from '../../stores/playerStore';
import { useLibraryStore } from '../../stores/libraryStore';

const MOODS = [
  { label: 'Chill', query: 'chill vibes' },
  { label: 'Focus', query: 'focus instrumental' },
  { label: 'Hype', query: 'hype playlist' },
  { label: 'Late Night', query: 'late night drive' },
];

function todayISO(): string {
  const d = new Date();
  const months = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
  ];
  return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} '${d
    .getFullYear()
    .toString()
    .slice(2)}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const [trending, setTrending] = useState<VideoInfo[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const history = useLibraryStore((s) => s.history);
  const { currentTrack, playQueue } = usePlayerStore();

  useEffect(() => {
    loadTrending();
  }, []);

  async function loadTrending() {
    try {
      const results = await getTrending();
      setTrending(results);
    } catch (e) {
      console.error('Trending failed', e);
    } finally {
      setIsLoadingTrending(false);
    }
  }

  function toTrack(v: {
    videoId: string;
    title: string;
    artist: string;
    artwork?: string;
    duration: number;
  }) {
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
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320 }}
      />
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
        >
          <View className="px-6 pt-2 pb-4">
            <MotiView
              from={{ opacity: 0, translateY: -6 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500 }}
            >
              <Text
                style={{
                  fontFamily: 'JetBrainsMono_400Regular',
                  fontSize: 11,
                  letterSpacing: 1.4,
                }}
                className="text-text-muted"
              >
                {todayISO()} · TODAY'S SOUND
              </Text>
              <View className="flex-row items-end mt-2">
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
            </MotiView>
          </View>

          <View className="mt-4 px-6">
            <View className="flex-row items-center mb-3">
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#ff5c2e',
                }}
              />
              <Text
                style={{
                  fontFamily: 'JetBrainsMono_500Medium',
                  fontSize: 10,
                  letterSpacing: 1.8,
                  marginLeft: 8,
                }}
                className="text-text-secondary"
              >
                QUICK PICKS
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
            <View className="flex-row flex-wrap">
              {MOODS.map((mood) => (
                <TouchableOpacity
                  key={mood.label}
                  onPress={() =>
                    // typed-routes cache regenerates on next `expo start`; cast keeps tsc green now
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
            <View className="mt-4">
              <SectionLabel text="Recently Played" count={history.length} />
              {history.slice(0, 4).map((h, i) => (
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
                  onPress={() =>
                    playQueue(
                      history.slice(0, 4).map((entry) =>
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

          <View className="mt-6">
            <SectionLabel text="Trending Today" count={trending.length} />

            {isLoadingTrending && (
              <View className="items-center py-12">
                <ActivityIndicator color="#ff5c2e" />
                <Text
                  style={{
                    fontFamily: 'JetBrainsMono_400Regular',
                    fontSize: 10,
                    letterSpacing: 1.6,
                    marginTop: 12,
                  }}
                  className="text-text-muted"
                >
                  TUNING IN…
                </Text>
              </View>
            )}

            {!isLoadingTrending &&
              trending.map((video, i) => (
                <TrackRow
                  key={video.videoId}
                  track={video}
                  index={i}
                  isActive={currentTrack?.videoId === video.videoId}
                  onPress={() => {
                    playQueue(trending.map(toTrack), i);
                  }}
                />
              ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SectionLabel({ text, count }: { text: string; count: number }) {
  return (
    <View className="flex-row items-center px-6 mb-3 mt-2">
      <View
        style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#ff5c2e' }}
      />
      <Text
        style={{
          fontFamily: 'JetBrainsMono_500Medium',
          fontSize: 10,
          letterSpacing: 1.8,
          marginLeft: 8,
        }}
        className="text-text-secondary"
      >
        {text.toUpperCase()}
      </Text>
      <View
        style={{
          flex: 1,
          height: 1,
          backgroundColor: 'rgba(245,239,227,0.06)',
          marginLeft: 10,
        }}
      />
      <Text
        style={{
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 10,
          marginLeft: 10,
        }}
        className="text-text-muted"
      >
        {String(count).padStart(2, '0')}
      </Text>
    </View>
  );
}
