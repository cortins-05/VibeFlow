import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Play, Shuffle, Trash2, ListMusic } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { MotiView } from 'moti';
import TrackRow from '../../components/TrackRow';
import { useLibraryStore } from '../../stores/libraryStore';
import { usePlayerStore } from '../../stores/playerStore';
import type { PlaylistTrack } from '../../services/db';

function totalDuration(tracks: PlaylistTrack[]): string {
  const total = tracks.reduce((acc, t) => acc + (t.duration ?? 0), 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}H ${m.toString().padStart(2, '0')}M`;
  return `${m}M`;
}

export default function PlaylistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { playlists, getPlaylistTracks, deletePlaylist, removeTrackFromPlaylist } = useLibraryStore();
  const { playQueue, currentTrack, setShuffle } = usePlayerStore();

  const playlist = playlists.find((p) => p.id === id);
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);

  useEffect(() => {
    if (id) setTracks(getPlaylistTracks(id));
  }, [id]);

  function toTrack(t: PlaylistTrack) {
    return {
      id: t.video_id,
      videoId: t.video_id,
      title: t.title,
      artist: t.artist,
      artwork: t.artwork ?? undefined,
      duration: t.duration,
    };
  }

  async function handlePlay() {
    if (!tracks.length) return;
    setShuffle(false);
    await playQueue(tracks.map(toTrack), 0);
  }

  async function handleShuffle() {
    if (!tracks.length) return;
    setShuffle(true);
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    await playQueue(shuffled.map(toTrack), 0);
  }

  function handleDelete() {
    Alert.alert('Delete Playlist', `Delete "${playlist?.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePlaylist(id!);
          router.back();
        },
      },
    ]);
  }

  const coverArt = tracks[0]?.artwork;

  return (
    <View className="flex-1 bg-[#0e0c0a]">
      <LinearGradient
        colors={['rgba(255,92,46,0.32)', 'rgba(232,182,122,0.08)', '#0a0907']}
        locations={[0, 0.35, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 460 }}
      />
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center px-5 pt-2 pb-2 justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft color="#f5efe3" size={24} />
          </TouchableOpacity>
          <Text
            style={{
              fontFamily: 'JetBrainsMono_500Medium',
              fontSize: 10,
              letterSpacing: 1.8,
              color: '#a08a78',
            }}
          >
            PLAYLIST
          </Text>
          <TouchableOpacity
            onPress={handleDelete}
            className="w-10 h-10 items-center justify-center"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 color="#5a4d42" size={18} strokeWidth={1.6} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
        >
          <View className="items-center px-8 pt-4 pb-6">
            <MotiView
              from={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 16, stiffness: 100 }}
              style={{
                shadowColor: '#ff5c2e',
                shadowOffset: { width: 0, height: 18 },
                shadowOpacity: 0.4,
                shadowRadius: 30,
                elevation: 16,
              }}
            >
              {coverArt ? (
                <Image
                  source={{ uri: coverArt }}
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(245,239,227,0.08)',
                  }}
                  contentFit="cover"
                />
              ) : (
                <View
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 8,
                    backgroundColor: '#1f1916',
                    borderWidth: 1,
                    borderColor: 'rgba(245,239,227,0.08)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ListMusic color="#e8b67a" size={48} strokeWidth={1.4} />
                </View>
              )}
            </MotiView>

            <Text
              style={{
                fontFamily: 'JetBrainsMono_500Medium',
                fontSize: 10,
                letterSpacing: 1.8,
                color: '#a08a78',
                marginTop: 24,
              }}
            >
              CURATED COLLECTION
            </Text>
            <Text
              style={{
                fontFamily: 'Manrope_500Medium',
                fontSize: 36,
                lineHeight: 40,
                color: '#f5efe3',
                marginTop: 6,
                textAlign: 'center',
              }}
              numberOfLines={2}
            >
              {playlist?.name ?? 'Playlist'}
            </Text>
            <Text
              style={{
                fontFamily: 'JetBrainsMono_400Regular',
                fontSize: 10,
                letterSpacing: 1.2,
                color: '#5a4d42',
                marginTop: 6,
              }}
            >
              {String(tracks.length).padStart(2, '0')} · TRACKS · {totalDuration(tracks)}
            </Text>

            <View className="flex-row mt-6">
              <TouchableOpacity
                onPress={handlePlay}
                activeOpacity={0.85}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#ff5c2e',
                  paddingHorizontal: 22,
                  paddingVertical: 13,
                  borderRadius: 30,
                  marginRight: 10,
                  shadowColor: '#ff5c2e',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.45,
                  shadowRadius: 14,
                  elevation: 8,
                }}
              >
                <Play color="#f5efe3" size={16} fill="#f5efe3" />
                <Text
                  style={{
                    fontFamily: 'JetBrainsMono_500Medium',
                    fontSize: 11,
                    letterSpacing: 1.4,
                    color: '#f5efe3',
                    marginLeft: 8,
                  }}
                >
                  PLAY
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShuffle}
                activeOpacity={0.75}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 22,
                  paddingVertical: 13,
                  borderRadius: 30,
                  borderWidth: 1,
                  borderColor: 'rgba(245,239,227,0.12)',
                }}
              >
                <Shuffle color="#a08a78" size={16} strokeWidth={1.8} />
                <Text
                  style={{
                    fontFamily: 'JetBrainsMono_500Medium',
                    fontSize: 11,
                    letterSpacing: 1.4,
                    color: '#a08a78',
                    marginLeft: 8,
                  }}
                >
                  SHUFFLE
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {tracks.length === 0 && (
            <View className="items-center py-10">
              <Text
                style={{
                  fontFamily: 'Manrope_300Light',
                  fontSize: 20,
                  color: '#a08a78',
                }}
              >
                Empty so far.
              </Text>
              <Text
                style={{
                  fontFamily: 'JetBrainsMono_400Regular',
                  fontSize: 10,
                  letterSpacing: 1.4,
                  color: '#5a4d42',
                  marginTop: 8,
                }}
              >
                ADD TRACKS FROM ANY SCREEN
              </Text>
            </View>
          )}

          {tracks.map((t, i) => (
            <TrackRow
              key={t.id}
              track={{
                videoId: t.video_id,
                title: t.title,
                artist: t.artist,
                artwork: t.artwork ?? undefined,
                duration: t.duration,
              }}
              index={i}
              isActive={currentTrack?.videoId === t.video_id}
              onPress={() => playQueue(tracks.map(toTrack), i)}
              onMore={() => {
                Alert.alert('Remove', `Remove "${t.title}" from playlist?`, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                      removeTrackFromPlaylist(t.id);
                      setTracks((prev) => prev.filter((x) => x.id !== t.id));
                    },
                  },
                ]);
              }}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
