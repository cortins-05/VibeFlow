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
import ConsoleHeader from '../../components/ui/ConsoleHeader';
import SectionHeader from '../../components/ui/SectionHeader';
import { searchYouTube, type VideoInfo } from '../../services/youtube';
import { usePlayerStore } from '../../stores/playerStore';
import { useLibraryStore } from '../../stores/libraryStore';
import { COLORS, FONTS } from '../../constants/theme';

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
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<VideoInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { playQueue, currentTrack } = usePlayerStore();
  const favorites = useLibraryStore((s) => s.favorites);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);

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
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ConsoleHeader path="search" title="Search" />

          {/* Input */}
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: COLORS.surface,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: focused ? COLORS.borderAccent : COLORS.border,
                paddingHorizontal: 12,
              }}
            >
              <Text style={{ fontFamily: FONTS.mono, fontSize: 14, color: COLORS.accent, marginRight: 8 }}>{'>'}</Text>
              <TextInput
                value={query}
                onChangeText={(t) => {
                  setQuery(t);
                  handleSearch(t);
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="type to search..."
                placeholderTextColor={COLORS.textFaint}
                style={{
                  flex: 1,
                  fontFamily: FONTS.mono,
                  fontSize: 13,
                  color: COLORS.text,
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
                  <X color={COLORS.textDim} size={14} />
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
                    <ActivityIndicator color={COLORS.accent} size="small" />
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
                      onPress={() => playQueue(results.map(toTrack), i)}
                    />
                  ))}

                {!isSearching && results.length === 0 && query.trim() !== '' && (
                  <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                    <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textDim, letterSpacing: 1 }}>
                      // no results
                    </Text>
                    <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textFaint, marginTop: 6 }}>
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
                        backgroundColor: COLORS.surface,
                        borderRadius: 4,
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                        marginRight: 8,
                        marginBottom: 8,
                      }}
                    >
                      <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.secondary }}>
                        #{mood.replace(' ', '_')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
