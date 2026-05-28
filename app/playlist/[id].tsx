import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Play, Shuffle, Trash2, ListMusic, Edit3, ChevronUp, ChevronDown } from 'lucide-react-native';
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
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  return `${m}m`;
}

export default function PlaylistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    playlists, getPlaylistTracks, deletePlaylist, renamePlaylist,
    removeTrackFromPlaylist, moveTrackInPlaylist,
  } = useLibraryStore();
  const { playQueue, currentTrack, setShuffle } = usePlayerStore();

  const playlist = playlists.find((p) => p.id === id);
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [showRename, setShowRename] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    if (id) refreshTracks();
  }, [id]);

  function refreshTracks() {
    if (id) setTracks(getPlaylistTracks(id));
  }

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
    Alert.alert('Delete playlist', `Delete "${playlist?.name}"?`, [
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

  function openRename() {
    setRenameValue(playlist?.name ?? '');
    setShowRename(true);
  }

  function handleRename() {
    if (!renameValue.trim() || !id) return;
    renamePlaylist(id, renameValue.trim());
    setShowRename(false);
  }

  function handleRemoveTrack(t: PlaylistTrack) {
    Alert.alert('Remove track', `Remove "${t.title}" from this playlist?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeTrackFromPlaylist(t.id);
          refreshTracks();
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
          <View className="flex-row">
            <TouchableOpacity
              onPress={openRename}
              className="w-10 h-10 items-center justify-center mr-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Edit3 color="#a08a78" size={16} strokeWidth={1.6} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              className="w-10 h-10 items-center justify-center"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Trash2 color="#5a4d42" size={18} strokeWidth={1.6} />
            </TouchableOpacity>
          </View>
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
                fontFamily: 'Manrope_500Medium',
                fontSize: 36,
                lineHeight: 40,
                color: '#f5efe3',
                marginTop: 28,
                textAlign: 'center',
              }}
              numberOfLines={2}
            >
              {playlist?.name ?? 'Playlist'}
            </Text>
            <Text
              style={{
                fontFamily: 'Manrope_400Regular',
                fontSize: 12,
                color: '#a08a78',
                marginTop: 6,
              }}
            >
              {tracks.length} tracks · {totalDuration(tracks)}
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
                    fontFamily: 'Manrope_500Medium',
                    fontSize: 13,
                    color: '#f5efe3',
                    marginLeft: 8,
                  }}
                >
                  Play
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
                    fontFamily: 'Manrope_500Medium',
                    fontSize: 13,
                    color: '#a08a78',
                    marginLeft: 8,
                  }}
                >
                  Shuffle
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
                No tracks yet.
              </Text>
              <Text
                style={{
                  fontFamily: 'Manrope_400Regular',
                  fontSize: 12,
                  color: '#5a4d42',
                  marginTop: 8,
                }}
              >
                Search and add tracks to this playlist
              </Text>
            </View>
          )}

          {tracks.map((t, i) => (
            <View key={t.id} className="flex-row items-center">
              <View className="flex-col items-center pl-2 pr-1">
                <TouchableOpacity
                  onPress={() => {
                    moveTrackInPlaylist(t.id, id!, 'up');
                    refreshTracks();
                  }}
                  disabled={i === 0}
                  style={{ opacity: i === 0 ? 0.3 : 1 }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <ChevronUp color="#5a4d42" size={16} strokeWidth={1.6} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    moveTrackInPlaylist(t.id, id!, 'down');
                    refreshTracks();
                  }}
                  disabled={i === tracks.length - 1}
                  style={{ opacity: i === tracks.length - 1 ? 0.3 : 1 }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <ChevronDown color="#5a4d42" size={16} strokeWidth={1.6} />
                </TouchableOpacity>
              </View>
              <View className="flex-1">
                <TrackRow
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
                  onMore={() => handleRemoveTrack(t)}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showRename}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRename(false)}
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
                fontFamily: 'Manrope_500Medium',
                fontSize: 24,
                color: '#f5efe3',
              }}
            >
              Rename playlist
            </Text>
            <TextInput
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder="Playlist name"
              placeholderTextColor="#5a4d42"
              autoFocus
              onSubmitEditing={handleRename}
              style={{
                fontFamily: 'Manrope_500Medium',
                fontSize: 16,
                color: '#f5efe3',
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(245,239,227,0.12)',
                marginTop: 16,
                marginBottom: 24,
              }}
            />
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setShowRename(false)}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  alignItems: 'center',
                  marginRight: 8,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Manrope_500Medium',
                    fontSize: 13,
                    color: '#a08a78',
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRename}
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
                    fontFamily: 'Manrope_500Medium',
                    fontSize: 13,
                    color: '#f5efe3',
                  }}
                >
                  Rename
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
