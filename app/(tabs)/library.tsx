import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, ListMusic, Heart, Clock, Download, ChevronRight } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import TrackRow from '../../components/TrackRow';
import { useLibraryStore } from '../../stores/libraryStore';
import { useDownloadStore } from '../../stores/downloadStore';
import { usePlayerStore } from '../../stores/playerStore';

export default function LibraryScreen() {
  const router = useRouter();
  const { playlists, createPlaylist, history, favorites } = useLibraryStore();
  const { downloads, loadDownloads } = useDownloadStore();
  const [showCreate, setShowCreate] = useState(false);
  const [playlistName, setPlaylistName] = useState('');

  useEffect(() => { loadDownloads(); }, []);

  function handleCreate() {
    if (!playlistName.trim()) return;
    createPlaylist(playlistName.trim());
    setPlaylistName('');
    setShowCreate(false);
  }

  return (
    <View className="flex-1 bg-[#0e0c0a]">
      <LinearGradient
        colors={['rgba(255,92,46,0.12)', 'rgba(10,9,7,0)']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }}
      />
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
        >
          <View className="px-6 pt-2 pb-4 flex-row items-end justify-between">
            <MotiView
              from={{ opacity: 0, translateY: -6 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500 }}
            >
              <Text
                style={{
                  fontFamily: 'Manrope_400Regular',
                  fontSize: 13,
                  color: '#a08a78',
                }}
              >
                Your collection
              </Text>
              <View className="flex-row items-end mt-2">
                <Text
                  style={{ fontFamily: 'Manrope_300Light', fontSize: 48, lineHeight: 52 }}
                  className="text-cream"
                >
                  Library
                </Text>
                <Text
                  style={{
                    fontFamily: 'Manrope_300Light',
                    fontSize: 48,
                    lineHeight: 52,
                  }}
                  className="text-amber"
                >
                  .
                </Text>
              </View>
            </MotiView>
            <TouchableOpacity
              onPress={() => setShowCreate(true)}
              activeOpacity={0.8}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#ff5c2e',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
                shadowColor: '#ff5c2e',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Plus color="#f5efe3" size={22} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          <View className="mt-5 px-6">
            <PinnedCard
              icon={<Heart color="#ff5c2e" size={22} fill="#ff5c2e" />}
              label="Favorites"
              count={favorites.size}
              accent
              onPress={() => router.push('/(tabs)/favorites' as any)}
            />
            <View style={{ height: 10 }} />
            <PinnedCard
              icon={<Download color="#34c759" size={22} />}
              label="Downloads"
              count={downloads.length}
              onPress={() => router.push('/(tabs)/downloads' as any)}
            />
            <View style={{ height: 10 }} />
            <PinnedCard
              icon={<Clock color="#a08a78" size={22} />}
              label="History"
              count={history.length}
              onPress={() => router.push('/(tabs)/history' as any)}
            />
          </View>

          {downloads.length > 0 && (
            <View className="mt-8 px-6">
              <SectionHeader text="Recent Downloads" count={downloads.length} />
              {downloads.slice(-5).reverse().map((d, i) => {
                const track = {
                  id: d.video_id,
                  videoId: d.video_id,
                  title: d.title,
                  artist: d.artist,
                  artwork: d.artwork,
                  duration: d.duration,
                };
                return (
                  <TrackRow
                    key={d.video_id}
                    track={track}
                    index={i}
                    onPress={() => usePlayerStore.getState().playTrack(track)}
                  />
                );
              })}
              {downloads.length > 5 && (
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/downloads' as any)}
                  className="py-3 items-center"
                >
                  <Text
                    style={{
                      fontFamily: 'JetBrainsMono_400Regular',
                      fontSize: 10,
                      letterSpacing: 1.4,
                      color: '#a08a78',
                    }}
                  >
                    SHOW ALL ({downloads.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View className="mt-8 px-6">
            <SectionHeader text="Playlists" count={playlists.length} />

            {playlists.length === 0 && (
              <View className="items-center py-10">
                <ListMusic color="#3a322c" size={36} strokeWidth={1.5} />
                <Text
                  style={{
                    fontFamily: 'Manrope_300Light',
                    fontSize: 22,
                    marginTop: 12,
                  }}
                  className="text-text-secondary"
                >
                  Nothing here yet.
                </Text>
                <Text
                  style={{
                    fontFamily: 'JetBrainsMono_400Regular',
                    fontSize: 10,
                    letterSpacing: 1.4,
                    marginTop: 6,
                  }}
                  className="text-text-muted"
                >
                  Tap + to start collecting
                </Text>
              </View>
            )}

            {playlists.map((pl, i) => (
              <MotiView
                key={pl.id}
                from={{ opacity: 0, translateY: 6 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 280, delay: i * 40 }}
              >
                <TouchableOpacity
                  onPress={() => router.push(`/playlist/${pl.id}`)}
                  activeOpacity={0.7}
                  className="flex-row items-center py-4"
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(245,239,227,0.04)',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'JetBrainsMono_400Regular',
                      fontSize: 11,
                      color: '#5a4d42',
                      width: 22,
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </Text>
                  <View
                    className="ml-3 items-center justify-center"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 6,
                      backgroundColor: '#1f1916',
                      borderWidth: 1,
                      borderColor: 'rgba(245,239,227,0.06)',
                    }}
                  >
                    <ListMusic color="#e8b67a" size={18} strokeWidth={1.6} />
                  </View>
                  <View className="flex-1 ml-3 min-w-0">
                    <Text
                      style={{
                        fontFamily: 'Manrope_500Medium',
                        fontSize: 20,
                        lineHeight: 24,
                        color: '#f5efe3',
                      }}
                      numberOfLines={1}
                    >
                      {pl.name}
                    </Text>
                    {pl.description ? (
                      <Text
                        style={{
                          fontFamily: 'Manrope_400Regular',
                          fontSize: 11,
                          color: '#a08a78',
                          marginTop: 2,
                        }}
                        numberOfLines={1}
                      >
                        {pl.description}
                      </Text>
                    ) : null}
                  </View>
                  <ChevronRight color="#5a4d42" size={18} />
                </TouchableOpacity>
              </MotiView>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showCreate}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreate(false)}
      >
        <View
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: 'rgba(10,9,7,0.85)' }}
        >
          <View
            style={{
              backgroundColor: '#1f1916',
              borderRadius: 24,
              padding: 28,
              marginHorizontal: 24,
              width: '100%',
              maxWidth: 360,
              borderWidth: 1,
              borderColor: 'rgba(245,239,227,0.08)',
            }}
          >
            <Text
              style={{
                fontFamily: 'JetBrainsMono_500Medium',
                fontSize: 10,
                letterSpacing: 1.8,
                color: '#ff5c2e',
              }}
            >
              NEW · PLAYLIST
            </Text>
            <Text
              style={{
                fontFamily: 'Manrope_500Medium',
                fontSize: 32,
                lineHeight: 36,
                color: '#f5efe3',
                marginTop: 6,
                marginBottom: 18,
              }}
            >
              Name it.
            </Text>
            <TextInput
              value={playlistName}
              onChangeText={setPlaylistName}
              placeholder="e.g. Late Night Drive"
              placeholderTextColor="#5a4d42"
              autoFocus
              onSubmitEditing={handleCreate}
              style={{
                fontFamily: 'Manrope_500Medium',
                fontSize: 16,
                color: '#f5efe3',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(245,239,227,0.12)',
                marginBottom: 24,
              }}
            />
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setShowCreate(false)}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  alignItems: 'center',
                  marginRight: 8,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'JetBrainsMono_500Medium',
                    fontSize: 11,
                    letterSpacing: 1.4,
                    color: '#a08a78',
                  }}
                >
                  CANCEL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreate}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: '#ff5c2e',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'JetBrainsMono_500Medium',
                    fontSize: 11,
                    letterSpacing: 1.4,
                    color: '#f5efe3',
                  }}
                >
                  CREATE
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SectionHeader({ text, count }: { text: string; count: number }) {
  return (
    <View className="flex-row items-center mb-3">
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

function PinnedCard({
  icon,
  label,
  count,
  accent,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  accent?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: accent ? 'rgba(255,92,46,0.06)' : '#1f1916',
        borderRadius: 18,
        paddingHorizontal: 18,
        paddingVertical: 18,
        borderWidth: 1,
        borderColor: accent ? 'rgba(255,92,46,0.18)' : 'rgba(245,239,227,0.06)',
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: accent ? 'rgba(255,92,46,0.10)' : 'rgba(245,239,227,0.04)',
        }}
      >
        {icon}
      </View>
      <View className="flex-1 ml-3">
        <Text
          style={{
            fontFamily: 'Manrope_500Medium',
            fontSize: 22,
            lineHeight: 24,
            color: '#f5efe3',
          }}
        >
          {label}
        </Text>
      <Text
        style={{
          fontFamily: 'Manrope_400Regular',
          fontSize: 11,
          color: '#a08a78',
          marginTop: 4,
        }}
      >
        {count} tracks
      </Text>
      </View>
      <ChevronRight color="#5a4d42" size={18} />
    </TouchableOpacity>
  );
}
