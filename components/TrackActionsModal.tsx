import { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, TextInput } from 'react-native';
import { ListMusic } from 'lucide-react-native';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlayerStore } from '../stores/playerStore';
import { useDownloadStore } from '../stores/downloadStore';
import type { Track } from '../stores/playerStore';
import { COLORS, FONTS } from '../constants/theme';

interface Props {
  visible: boolean;
  track: Track | null;
  onClose: () => void;
}

export default function TrackActionsModal({ visible, track, onClose }: Props) {
  const { playlists, createPlaylist, addTrackToPlaylist } = useLibraryStore();
  const { addToQueue } = usePlayerStore();
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
            backgroundColor: COLORS.surface,
            borderTopLeftRadius: 6,
            borderTopRightRadius: 6,
            paddingTop: 28,
            paddingBottom: 48,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderBottomWidth: 0,
            maxHeight: '85%',
          }}
        >
          <View style={{ paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ flex: 1, fontFamily: FONTS.mono, fontSize: 12, color: COLORS.accent, letterSpacing: 1 }} numberOfLines={1}>
              [ {t.title} ]
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.textDim }}>[ close ]</Text>
            </Pressable>
          </View>

          <ScrollView style={{ paddingHorizontal: 20 }}>
            {!showPlaylists ? (
              <>
                <ActionOption
                  icon={<ListMusic color={COLORS.accent} size={16} />}
                  label="add to queue"
                  color={COLORS.accent}
                  onPress={handleAddToQueue}
                />

                <ActionOption
                  icon={<ListMusic color={COLORS.secondary} size={16} />}
                  label="add to playlist"
                  color={COLORS.secondary}
                  onPress={() => setShowPlaylists(true)}
                />

                {downloaded && (
                  <ActionOption
                    icon={<ListMusic color={COLORS.textDim} size={16} />}
                    label="downloaded"
                    color={COLORS.secondary}
                    onPress={onClose}
                  />
                )}
              </>
            ) : (
              <>
                <Pressable onPress={() => setShowPlaylists(false)} style={{ marginBottom: 16 }}>
                  <Text style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.textDim }}>{'< back'}</Text>
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
                          borderBottomColor: COLORS.border,
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
                            borderColor: COLORS.borderAccent,
                          }}
                        >
                          <Text style={{ color: COLORS.accent, fontSize: 22 }}>+</Text>
                        </View>
                        <Text style={{ fontFamily: FONTS.mono, fontSize: 13, color: COLORS.accent, marginLeft: 16 }}>
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
                          borderBottomColor: COLORS.border,
                        }}
                      >
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 4,
                            backgroundColor: COLORS.bg,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <ListMusic color={COLORS.secondary} size={20} />
                        </View>
                        <Text
                          style={{ flex: 1, fontFamily: FONTS.sans, fontSize: 16, color: COLORS.text, marginLeft: 16 }}
                          numberOfLines={1}
                        >
                          {pl.name}
                        </Text>
                      </Pressable>
                    ))}

                    {playlists.length === 0 && (
                      <Text
                        style={{
                          fontFamily: FONTS.mono,
                          fontSize: 11,
                          color: COLORS.textFaint,
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
                    <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.accent, letterSpacing: 1, marginBottom: 12 }}>
                      NEW PLAYLIST
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: COLORS.bg,
                        borderRadius: 4,
                        borderWidth: 1,
                        borderColor: COLORS.borderAccent,
                        paddingHorizontal: 12,
                      }}
                    >
                      <Text style={{ fontFamily: FONTS.mono, fontSize: 13, color: COLORS.accent, marginRight: 8 }}>{'>'}</Text>
                      <TextInput
                        value={newName}
                        onChangeText={setNewName}
                        placeholder="name..."
                        placeholderTextColor={COLORS.textFaint}
                        autoFocus
                        onSubmitEditing={handleCreatePlaylist}
                        style={{
                          flex: 1,
                          fontFamily: FONTS.mono,
                          fontSize: 13,
                          color: COLORS.text,
                          paddingVertical: 11,
                        }}
                      />
                    </View>
                    <View style={{ flexDirection: 'row', marginTop: 16 }}>
                      <Pressable onPress={() => setShowCreate(false)} style={{ flex: 1, paddingVertical: 11, alignItems: 'center' }}>
                        <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textDim }}>BACK</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleCreatePlaylist}
                        style={{
                          flex: 1,
                          paddingVertical: 11,
                          borderRadius: 4,
                          backgroundColor: COLORS.accent,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.bg }}>CREATE</Text>
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
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
      }}
    >
      {icon}
      <Text style={{ fontFamily: FONTS.mono, fontSize: 14, color, marginLeft: 16, letterSpacing: 0.5 }}>
        [ {label} ]
      </Text>
    </Pressable>
  );
}
