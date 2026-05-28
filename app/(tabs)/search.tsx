import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import TrackRow from '../../components/TrackRow';
import TrackActionsModal from '../../components/TrackActionsModal';
import ConsoleHeader from '../../components/ui/ConsoleHeader';
import SectionHeader from '../../components/ui/SectionHeader';
import { searchYouTube, type VideoInfo } from '../../services/youtube';
import { usePlayerStore } from '../../stores/playerStore';
import { useLibraryStore } from '../../stores/libraryStore';
import { useTheme } from '../../constants/theme';

const VIBES = ['chill', 'focus', 'hype', 'late night', 'sunset drive', 'lo-fi'];

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

export default function SearchScreen() {
  const { colors, fonts } = useTheme();
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<VideoInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { playQueue, currentTrack, addToQueue } = usePlayerStore();
  const favorites = useLibraryStore((s) => s.favorites);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);
  const [actionTrack, setActionTrack] = useState<{ id: string; videoId: string; title: string; artist: string; artwork?: string; duration: number } | null>(null);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await searchYouTube(q);
      setResults(res);
    } catch (e) {
      console.error('Search failed', e);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const incoming = typeof params.q === 'string' ? params.q : '';
    if (incoming && incoming !== query) {
      setQuery(incoming);
      handleSearch(incoming);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.q]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ConsoleHeader path="search" title="Search" />

          {/* Input */}
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: focused ? colors.borderAccent : colors.border,
                paddingHorizontal: 12,
              }}
            >
              <Text style={{ fontFamily: fonts.mono, fontSize: 14, color: colors.accent, marginRight: 8 }}>{'>'}</Text>
              <TextInput
                value={query}
                onChangeText={(t) => {
                  setQuery(t);
                  handleSearch(t);
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="type to search..."
                placeholderTextColor={colors.textFaint}
                style={{
                  flex: 1,
                  fontFamily: fonts.mono,
                  fontSize: 13,
                  color: colors.text,
                  paddingVertical: 12,
                }}
                returnKeyType="search"
                autoFocus
                onSubmitEditing={() => handleSearch(query)}
              />
              {query.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setQuery('');
                    setResults([]);
                    setHasSearched(false);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X color={colors.textDim} size={14} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 160 }}
            keyboardShouldPersistTaps="handled"
          >
            {hasSearched && (
              <View style={{ marginTop: 4 }}>
                <SectionHeader
                  label={query.trim() ? `results: "${query}"` : 'results'}
                  count={results.length}
                />

                {isSearching && (
                  <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                    <ActivityIndicator color={colors.accent} size="small" />
                  </View>
                )}

                {!isSearching &&
                  results.map((video, i) => (
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
                      onPress={() => playQueue(results.map(toTrack), i)}
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

                {!isSearching && results.length === 0 && query.trim() !== '' && (
                  <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                    <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim, letterSpacing: 1 }}>
                      // no results
                    </Text>
                    <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textFaint, marginTop: 6 }}>
                      try a different query
                    </Text>
                  </View>
                )}
              </View>
            )}

            {!hasSearched && (
              <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
                <SectionHeader label="try a vibe" count={VIBES.length} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {VIBES.map((mood) => (
                    <TouchableOpacity
                      key={mood}
                      onPress={() => {
                        setQuery(mood);
                        handleSearch(mood);
                      }}
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
                        #{mood.replace(' ', '_')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        <TrackActionsModal
          visible={!!actionTrack}
          track={actionTrack}
          onClose={() => setActionTrack(null)}
        />
      </SafeAreaView>
    </View>
  );
}
