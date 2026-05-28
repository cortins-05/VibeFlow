import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Plus, ListMusic } from 'lucide-react-native';
import { useState } from 'react';
import { useLibraryStore } from '../stores/libraryStore';
import type { Track } from '../stores/playerStore';

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
      <View
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(10,9,7,0.7)' }}
      >
        <View
          style={{
            backgroundColor: '#1f1916',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 24,
            paddingBottom: 40,
            borderWidth: 1,
            borderColor: 'rgba(245,239,227,0.06)',
            borderBottomWidth: 0,
            maxHeight: '70%',
          }}
        >
          <View className="px-6 pb-4 flex-row items-center justify-between">
            <Text
              style={{
                fontFamily: 'Manrope_500Medium',
                fontSize: 18,
                color: '#f5efe3',
              }}
              numberOfLines={1}
            >
              Add to playlist
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: '#a08a78' }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="px-6">
            {!showCreate ? (
              <>
                <TouchableOpacity
                  onPress={() => setShowCreate(true)}
                  className="flex-row items-center py-4"
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(245,239,227,0.06)',
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      backgroundColor: 'rgba(255,92,46,0.1)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Plus color="#ff5c2e" size={20} />
                  </View>
                  <Text
                    style={{
                      fontFamily: 'Manrope_500Medium',
                      fontSize: 15,
                      color: '#f5efe3',
                      marginLeft: 14,
                    }}
                  >
                    New playlist
                  </Text>
                </TouchableOpacity>

                {playlists.map((pl) => (
                  <TouchableOpacity
                    key={pl.id}
                    onPress={() => handleSelect(pl.id)}
                    className="flex-row items-center py-4"
                    style={{
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(245,239,227,0.04)',
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        backgroundColor: 'rgba(245,239,227,0.04)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ListMusic color="#e8b67a" size={18} />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text
                        style={{
                          fontFamily: 'Manrope_500Medium',
                          fontSize: 15,
                          color: '#f5efe3',
                        }}
                        numberOfLines={1}
                      >
                        {pl.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}

                {playlists.length === 0 && (
                  <Text
                    style={{
                      fontFamily: 'Manrope_400Regular',
                      fontSize: 13,
                      color: '#5a4d42',
                      textAlign: 'center',
                      paddingVertical: 20,
                    }}
                  >
                    No playlists yet. Create one!
                  </Text>
                )}
              </>
            ) : (
              <View className="py-4">
                <Text
                  style={{
                    fontFamily: 'Manrope_500Medium',
                    fontSize: 16,
                    color: '#f5efe3',
                    marginBottom: 12,
                  }}
                >
                  New playlist
                </Text>
                <View
                  className="flex-row items-center bg-[#0e0c0a] rounded-xl px-4"
                  style={{ borderWidth: 1, borderColor: 'rgba(245,239,227,0.08)' }}
                >
                  <TextInput
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="Name"
                    placeholderTextColor="#5a4d42"
                    autoFocus
                    onSubmitEditing={handleCreate}
                    style={{
                      flex: 1,
                      fontFamily: 'Manrope_400Regular',
                      fontSize: 14,
                      color: '#f5efe3',
                      paddingVertical: 12,
                    }}
                  />
                </View>
                <View className="flex-row mt-4">
                  <TouchableOpacity
                    onPress={() => setShowCreate(false)}
                    style={{ flex: 1, paddingVertical: 12, alignItems: 'center' }}
                  >
                    <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: '#a08a78' }}>
                      Back
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCreate}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 10,
                      backgroundColor: '#ff5c2e',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontFamily: 'Manrope_500Medium', fontSize: 13, color: '#f5efe3' }}>
                      Create
                    </Text>
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
