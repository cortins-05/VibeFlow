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
import { Image } from 'expo-image';
import { MotiView } from 'moti';
import TrackRow from '../../components/TrackRow';
import TrackActionsModal from '../../components/TrackActionsModal';
import SectionHeader from '../../components/ui/SectionHeader';
import { useLibraryStore } from '../../stores/libraryStore';
import { usePlayerStore } from '../../stores/playerStore';
import type { PlaylistTrack } from '../../services/db';
import { useTheme, glow } from '../../constants/theme';

function totalDuration(tracks: PlaylistTrack[]): string {
  const total = tracks.reduce((acc, t) => acc + (t.duration ?? 0), 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  return `${m}m`;
}

export default function PlaylistScreen() {
  const { colors, fonts } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    playlists, getPlaylistTracks, deletePlaylist, renamePlaylist,
    removeTrackFromPlaylist, moveTrackInPlaylist,
  } = useLibraryStore();
  const { playQueue, currentTrack, setShuffle, addToQueue } = usePlayerStore();

  const playlist = playlists.find((p) => p.id === id);
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [actionTrack, setActionTrack] = useState<{ id: string; videoId: string; title: string; artist: string; artwork?: string; duration: number } | null>(null);
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

  function quickRemoveTrack(t: PlaylistTrack) {
    removeTrackFromPlaylist(t.id);
    refreshTracks();
  }

  const coverArt = tracks[0]?.artwork;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft color={colors.text} size={22} />
          </TouchableOpacity>
          <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim }}>
            vibeflow <Text style={{ color: colors.secondary }}>~/playlist</Text>{' '}
            <Text style={{ color: colors.accent }}>$</Text>
          </Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              onPress={openRename}
              style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 4 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Edit3 color={colors.textDim} size={15} strokeWidth={1.6} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Trash2 color={colors.textFaint} size={16} strokeWidth={1.6} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
        >
          {/* Cover + meta */}
          <View style={{ alignItems: 'center', paddingHorizontal: 32, paddingTop: 16, paddingBottom: 24 }}>
            <MotiView
              from={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 16, stiffness: 100 }}
            >
              {coverArt ? (
                <Image
                  source={{ uri: coverArt }}
                  style={{
                    width: 180,
                    height: 180,
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  contentFit="cover"
                />
              ) : (
                <View
                  style={{
                    width: 180,
                    height: 180,
                    borderRadius: 4,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ListMusic color={colors.secondary} size={44} strokeWidth={1.4} />
                </View>
              )}
            </MotiView>

            <Text
              style={{ fontFamily: fonts.sans, fontSize: 28, lineHeight: 32, color: colors.text, marginTop: 24, textAlign: 'center' }}
              numberOfLines={2}
            >
              {playlist?.name ?? 'Playlist'}
            </Text>
            <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textDim, marginTop: 6 }}>
              {tracks.length} tracks · {totalDuration(tracks)}
            </Text>

            {/* Play / Shuffle */}
            <View style={{ flexDirection: 'row', marginTop: 20 }}>
              <TouchableOpacity
                onPress={handlePlay}
                activeOpacity={0.85}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.accent,
                  paddingHorizontal: 20,
                  paddingVertical: 11,
                  borderRadius: 4,
                  marginRight: 10,
                  ...glow(colors.accent, 8, 0.4),
                }}
              >
                <Play color={colors.bg} size={14} fill={colors.bg} />
                <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.bg, marginLeft: 8, letterSpacing: 0.5 }}>
                  PLAY
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShuffle}
                activeOpacity={0.75}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  paddingVertical: 11,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Shuffle color={colors.textDim} size={14} strokeWidth={1.8} />
                <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim, marginLeft: 8, letterSpacing: 0.5 }}>
                  SHUFFLE
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {tracks.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim }}>
                // empty playlist
              </Text>
              <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textFaint, marginTop: 6 }}>
                search and add tracks
              </Text>
            </View>
          )}

          {tracks.length > 0 && (
            <SectionHeader label="tracks" count={tracks.length} />
          )}

          {tracks.map((t, i) => (
            <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Reorder controls */}
              <View style={{ flexDirection: 'column', alignItems: 'center', paddingLeft: 8, paddingRight: 4 }}>
                <TouchableOpacity
                  onPress={() => { moveTrackInPlaylist(t.id, id!, 'up'); refreshTracks(); }}
                  disabled={i === 0}
                  style={{ opacity: i === 0 ? 0.2 : 1 }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <ChevronUp color={colors.textFaint} size={14} strokeWidth={1.6} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { moveTrackInPlaylist(t.id, id!, 'down'); refreshTracks(); }}
                  disabled={i === tracks.length - 1}
                  style={{ opacity: i === tracks.length - 1 ? 0.2 : 1 }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <ChevronDown color={colors.textFaint} size={14} strokeWidth={1.6} />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
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
                  onLongPress={() =>
                    setActionTrack({
                      id: t.video_id,
                      videoId: t.video_id,
                      title: t.title,
                      artist: t.artist,
                      artwork: t.artwork ?? undefined,
                      duration: t.duration,
                    })
                  }
                  onPress={() => playQueue(tracks.map(toTrack), i)}
                  onMore={() => handleRemoveTrack(t)}
                  onSwipeRight={() =>
                    addToQueue({
                      id: t.video_id,
                      videoId: t.video_id,
                      title: t.title,
                      artist: t.artist,
                      artwork: t.artwork ?? undefined,
                      duration: t.duration,
                    })
                  }
                  onSwipeLeft={() => quickRemoveTrack(t)}
                />
              </View>
            </View>
          ))}
        </ScrollView>

        <TrackActionsModal
          visible={!!actionTrack}
          track={actionTrack}
          onClose={() => setActionTrack(null)}
        />
      </SafeAreaView>

      {/* Rename modal */}
      <Modal
        visible={showRename}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRename(false)}
      >
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(11,12,11,0.88)' }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 6,
              padding: 24,
              marginHorizontal: 24,
              width: '100%',
              maxWidth: 360,
              borderWidth: 1,
              borderColor: colors.borderAccent,
            }}
          >
            <Text style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.8, color: colors.accent }}>
              RENAME · PLAYLIST
            </Text>
            <TextInput
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder="playlist name"
              placeholderTextColor={colors.textFaint}
              autoFocus
              onSubmitEditing={handleRename}
              style={{
                fontFamily: fonts.mono,
                fontSize: 14,
                color: colors.text,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderAccent,
                marginTop: 12,
                marginBottom: 20,
              }}
            />
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                onPress={() => setShowRename(false)}
                style={{ flex: 1, paddingVertical: 12, alignItems: 'center', marginRight: 8 }}
              >
                <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim }}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRename}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 4,
                  backgroundColor: colors.accent,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.bg }}>RENAME</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
