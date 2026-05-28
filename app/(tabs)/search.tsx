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
import { LinearGradient } from 'expo-linear-gradient';
import { Search as SearchIcon, X, Sparkles } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useLocalSearchParams } from 'expo-router';
import TrackRow from '../../components/TrackRow';
import { searchYouTube, type VideoInfo } from '../../services/youtube';
import { usePlayerStore } from '../../stores/playerStore';
import { useLibraryStore } from '../../stores/libraryStore';

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState('');
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
        colors={['rgba(255,92,46,0.10)', 'rgba(255,92,46,0.02)', 'rgba(10,9,7,0)']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320 }}
      />
      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
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
                  Search
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
                Find any song or vibe
              </Text>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 4 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 100 }}
              className="mt-5"
            >
              <View
                className="flex-row items-center bg-[#181614] rounded-2xl px-4"
                style={{ borderWidth: 1, borderColor: 'rgba(245,239,227,0.06)' }}
              >
                <SearchIcon color="#5a4d42" size={16} strokeWidth={1.8} />
                <TextInput
                  value={query}
                  onChangeText={(t) => {
                    setQuery(t);
                    handleSearch(t);
                  }}
                  placeholder="Search a song, artist or vibe…"
                  placeholderTextColor="#5a4d42"
                  style={{
                    flex: 1,
                    fontFamily: 'Manrope_400Regular',
                    fontSize: 14,
                    color: '#f5efe3',
                    paddingVertical: 14,
                    marginLeft: 10,
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
                    <X color="#a08a78" size={16} />
                  </TouchableOpacity>
                )}
              </View>
            </MotiView>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 160 }}
            keyboardShouldPersistTaps="handled"
          >
            {hasSearched && (
              <View className="mt-4">
                <SectionHeader text={query.trim() ? `Results — "${query}"` : 'Results'} count={results.length} />

                {isSearching && (
                  <View className="items-center py-12">
                    <ActivityIndicator color="#ff5c2e" size="small" />
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
                      onFavoriteToggle={() => toggleFavorite(video.videoId, { videoId: video.videoId, title: video.title, artist: video.artist, artwork: video.artwork, duration: video.duration })}
                      onPress={() => {
                        playQueue(results.map(toTrack), i);
                      }}
                    />
                  ))}

                {!isSearching && results.length === 0 && query.trim() !== '' && (
                  <View className="items-center py-12">
                    <Text
                      style={{
                        fontFamily: 'Manrope_300Light',
                        fontSize: 20,
                        color: '#a08a78',
                      }}
                    >
                      Nothing found.
                    </Text>
                    <Text
                      style={{
                        fontFamily: 'Manrope_400Regular',
                        fontSize: 12,
                        color: '#5a4d42',
                        marginTop: 6,
                      }}
                    >
                      Try a different search
                    </Text>
                  </View>
                )}
              </View>
            )}

            {!hasSearched && (
              <View className="px-6 mt-6">
                <SectionHeader text="Try a vibe" count={6} />
                <View className="flex-row flex-wrap">
                  {['Chill', 'Focus', 'Hype', 'Late Night', 'Sunset Drive', 'Lo-fi'].map(
                    (mood) => (
                      <TouchableOpacity
                        key={mood}
                        onPress={() => {
                          setQuery(mood);
                          handleSearch(mood);
                        }}
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
                          {mood}
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
