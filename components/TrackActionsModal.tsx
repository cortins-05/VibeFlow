import { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, TextInput } from 'react-native';
import { ListMusic, Play } from 'lucide-react-native';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlayerStore } from '../stores/playerStore';
import { useDownloadStore } from '../stores/downloadStore';
import type { Track } from '../stores/playerStore';
import { useTheme } from '../constants/theme';

interface Props {
  visible: boolean;
  track: Track | null;
  onClose: () => void;
}

export default function TrackActionsModal({ visible, track, onClose }: Props) {
  const { colors, fonts } = useTheme();
  const { playlists, createPlaylist, addTrackToPlaylist } = useLibraryStore();
  const { addToQueue, addToQueueNext } = usePlayerStore();
  const { getLocalPath, isDownloaded } = useDownloadStore();
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  if (!track) return null;
  const t = track;

  function handleAddToQueue() {
    addToQueue(t);
    onClose();
  }

  function handlePlayNext() {
    addToQueueNext(t);
    onClose();
  }

  function handleSelectPlaylist(playlistId: string) {
    addTrackToPlaylist(playlistId, t);
    setShowPlaylists(false);
    onClose();
  }

  function handleCreatePlaylist() {
    if (!newName.trim()) return;
    createPlaylist(newName.trim());
    const pl = useLibraryStore.getState().playlists;
    if (pl[0]) handleSelectPlaylist(pl[0].id);
    setNewName('');
    setShowCreate(false);
  }

  const downloaded = isDownloaded(t.videoId);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(11,12,11,0.8)' }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 6,
            borderTopRightRadius: 6,
            paddingTop: 28,
            paddingBottom: 48,
            borderWidth: 1,
            borderColor: colors.border,
            borderBottomWidth: 0,
            maxHeight: '85%',
          }}
        >
          <View style={{ paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ flex: 1, fontFamily: fonts.mono, fontSize: 12, color: colors.accent, letterSpacing: 1 }} numberOfLines={1}>
              [ {t.title} ]
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.textDim }}>[ close ]</Text>
            </Pressable>
          </View>

          <ScrollView style={{ paddingHorizontal: 20 }}>
            {!showPlaylists ? (
              <>
                <ActionOption
                  icon={<ListMusic color={colors.accent} size={16} />}
                  label="add to queue"
                  color={colors.accent}
                  onPress={handleAddToQueue}
                />

                <ActionOption
                  icon={<Play color={colors.secondary} size={16} />}
                  label="play next"
                  color={colors.secondary}
                  onPress={handlePlayNext}
                />

                <ActionOption
                  icon={<ListMusic color={colors.textDim} size={16} />}
                  label="add to playlist"
                  color={colors.textDim}
                  onPress={() => setShowPlaylists(true)}
                />

                {downloaded && (
                  <ActionOption
                    icon={<ListMusic color={colors.textDim} size={16} />}
                    label="downloaded"
                    color={colors.secondary}
                    onPress={onClose}
                  />
                )}
              </>
            ) : (
              <>
                <Pressable onPress={() => setShowPlaylists(false)} style={{ marginBottom: 16 }}>
                  <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.textDim }}>{'< back'}</Text>
                </Pressable>

                {!showCreate ? (
                  <>
                      <Pressable
                        onPress={() => setShowCreate(true)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 16,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border,
                        }}
                      >
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 4,
                            backgroundColor: 'rgba(229,255,58,0.08)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: colors.borderAccent,
                          }}
                        >
                          <Text style={{ color: colors.accent, fontSize: 22 }}>+</Text>
                        </View>
                        <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.accent, marginLeft: 16 }}>
                          [ new playlist ]
                        </Text>
                      </Pressable>

                    {playlists.map((pl) => (
                      <Pressable
                        key={pl.id}
                        onPress={() => handleSelectPlaylist(pl.id)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 16,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border,
                        }}
                      >
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 4,
                            backgroundColor: colors.bg,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <ListMusic color={colors.secondary} size={20} />
                        </View>
                        <Text
                          style={{ flex: 1, fontFamily: fonts.sans, fontSize: 16, color: colors.text, marginLeft: 16 }}
                          numberOfLines={1}
                        >
                          {pl.name}
                        </Text>
                      </Pressable>
                    ))}

                    {playlists.length === 0 && (
                      <Text
                        style={{
                          fontFamily: fonts.mono,
                          fontSize: 11,
                          color: colors.textFaint,
                          textAlign: 'center',
                          paddingVertical: 20,
                        }}
                      >
                        // no playlists yet
                      </Text>
                    )}
                  </>
                ) : (
                  <View style={{ paddingVertical: 16 }}>
                    <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.accent, letterSpacing: 1, marginBottom: 12 }}>
                      NEW PLAYLIST
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: colors.bg,
                        borderRadius: 4,
                        borderWidth: 1,
                        borderColor: colors.borderAccent,
                        paddingHorizontal: 12,
                      }}
                    >
                      <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.accent, marginRight: 8 }}>{'>'}</Text>
                      <TextInput
                        value={newName}
                        onChangeText={setNewName}
                        placeholder="name..."
                        placeholderTextColor={colors.textFaint}
                        autoFocus
                        onSubmitEditing={handleCreatePlaylist}
                        style={{
                          flex: 1,
                          fontFamily: fonts.mono,
                          fontSize: 13,
                          color: colors.text,
                          paddingVertical: 11,
                        }}
                      />
                    </View>
                    <View style={{ flexDirection: 'row', marginTop: 16 }}>
                      <Pressable onPress={() => setShowCreate(false)} style={{ flex: 1, paddingVertical: 11, alignItems: 'center' }}>
                        <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim }}>BACK</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleCreatePlaylist}
                        style={{
                          flex: 1,
                          paddingVertical: 11,
                          borderRadius: 4,
                          backgroundColor: colors.accent,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.bg }}>CREATE</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ActionOption({
  icon,
  label,
  color,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onPress: () => void;
}) {
  const { colors, fonts } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      {icon}
      <Text style={{ fontFamily: fonts.mono, fontSize: 14, color, marginLeft: 16, letterSpacing: 0.5 }}>
        [ {label} ]
      </Text>
    </Pressable>
  );
}
