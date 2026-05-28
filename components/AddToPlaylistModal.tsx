import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Plus, ListMusic } from 'lucide-react-native';
import { useState } from 'react';
import { useLibraryStore } from '../stores/libraryStore';
import type { Track } from '../stores/playerStore';
import { COLORS, FONTS } from '../constants/theme';

interface Props {
  visible: boolean;
  track: Track | null;
  onClose: () => void;
  onDone?: () => void;
}

export default function AddToPlaylistModal({ visible, track, onClose, onDone }: Props) {
  const { playlists, createPlaylist, addTrackToPlaylist } = useLibraryStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  if (!track) return null;

  function handleSelect(playlistId: string) {
    if (!track) return;
    addTrackToPlaylist(playlistId, track);
    onClose();
    onDone?.();
  }

  function handleCreate() {
    if (!newName.trim()) return;
    createPlaylist(newName.trim());
    const pl = useLibraryStore.getState().playlists;
    const created = pl[0];
    if (created) handleSelect(created.id);
    setNewName('');
    setShowCreate(false);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(11,12,11,0.8)' }}>
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderTopLeftRadius: 6,
            borderTopRightRadius: 6,
            paddingTop: 20,
            paddingBottom: 40,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderBottomWidth: 0,
            maxHeight: '70%',
          }}
        >
          <View style={{ paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.accent, letterSpacing: 1 }}>
              ADD TO PLAYLIST
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textDim }}>[ close ]</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ paddingHorizontal: 20 }}>
            {!showCreate ? (
              <>
                <TouchableOpacity
                  onPress={() => setShowCreate(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: COLORS.border,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 4,
                      backgroundColor: 'rgba(229,255,58,0.08)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: COLORS.borderAccent,
                    }}
                  >
                    <Plus color={COLORS.accent} size={16} />
                  </View>
                  <Text style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.accent, marginLeft: 14 }}>
                    [ new playlist ]
                  </Text>
                </TouchableOpacity>

                {playlists.map((pl) => (
                  <TouchableOpacity
                    key={pl.id}
                    onPress={() => handleSelect(pl.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: COLORS.border,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 4,
                        backgroundColor: COLORS.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ListMusic color={COLORS.secondary} size={16} />
                    </View>
                    <Text
                      style={{ flex: 1, fontFamily: FONTS.sans, fontSize: 14, color: COLORS.text, marginLeft: 14 }}
                      numberOfLines={1}
                    >
                      {pl.name}
                    </Text>
                  </TouchableOpacity>
                ))}

                {playlists.length === 0 && (
                  <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textFaint, textAlign: 'center', paddingVertical: 20 }}>
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
                    onSubmitEditing={handleCreate}
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
                  <TouchableOpacity
                    onPress={() => setShowCreate(false)}
                    style={{ flex: 1, paddingVertical: 11, alignItems: 'center' }}
                  >
                    <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textDim }}>BACK</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCreate}
                    style={{
                      flex: 1,
                      paddingVertical: 11,
                      borderRadius: 4,
                      backgroundColor: COLORS.accent,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.bg }}>CREATE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
