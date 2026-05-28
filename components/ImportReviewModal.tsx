import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Check, X } from 'lucide-react-native';
import { useTheme } from '../constants/theme';
import { useLibraryStore } from '../stores/libraryStore';
import {
  searchAndMatch,
  matchedTracksToTracks,
  type MatchedTrack,
  type ParsedTrack,
} from '../services/playlistImporter';

interface Props {
  visible: boolean;
  playlistName: string;
  tracks: ParsedTrack[];
  onClose: () => void;
}

export default function ImportReviewModal({ visible, playlistName, tracks, onClose }: Props) {
  const { colors, fonts } = useTheme();
  const { createPlaylist, addTrackToPlaylist } = useLibraryStore();

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [matched, setMatched] = useState<MatchedTrack[]>([]);
  const [confirmed, setConfirmed] = useState<Set<number>>(new Set());
  const [name, setName] = useState(playlistName);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setProgress(0);
    setName(playlistName);

    searchAndMatch(tracks, (done, total) => setProgress(done)).then((results) => {
      setMatched(results);
      // Auto-confirm all with confidence >= 70
      const initial = new Set<number>();
      results.forEach((m, i) => {
        if (m.confidence >= 70) initial.add(i);
      });
      setConfirmed(initial);
      setLoading(false);
    });
  }, [visible]);

  function toggleIndex(idx: number) {
    setConfirmed((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function handleImport() {
    if (!name.trim() || confirmed.size === 0) return;
    setSaving(true);

    const confirmedMatches = matched.filter((_, i) => confirmed.has(i));
    const tracks = matchedTracksToTracks(confirmedMatches);

    createPlaylist(name.trim());
    const pl = useLibraryStore.getState().playlists;
    if (pl[0]) {
      for (const track of tracks) {
        addTrackToPlaylist(pl[0].id, track);
      }
    }
    setSaving(false);
    onClose();
  }

  const total = tracks.length;
  const matchedCount = matched.filter((m) => m.confidence >= 70).length;
  const lowConfCount = matched.filter((m) => m.match && m.confidence < 70).length;
  const notFoundCount = matched.filter((m) => !m.match).length;

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
            maxHeight: '90%',
          }}
        >
          {/* Header */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.accent, letterSpacing: 1 }}>
              [ import review ]
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.textDim }}>
                [ close ]
              </Text>
            </TouchableOpacity>
          </View>

          {/* Playlist name input */}
          <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
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
                value={name}
                onChangeText={setName}
                placeholder="playlist name"
                placeholderTextColor={colors.textFaint}
                style={{
                  flex: 1,
                  fontFamily: fonts.mono,
                  fontSize: 13,
                  color: colors.text,
                  paddingVertical: 11,
                }}
              />
            </View>
          </View>

          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator color={colors.accent} size="small" />
              <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim, marginTop: 12 }}>
                searching {progress}/{total}...
              </Text>
            </View>
          ) : (
            <>
              {/* Summary */}
              <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12, gap: 16 }}>
                <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.accent }}>
                  ✓ {matchedCount} matched
                </Text>
                {lowConfCount > 0 && (
                  <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.secondary }}>
                    ? {lowConfCount} low conf
                  </Text>
                )}
                {notFoundCount > 0 && (
                  <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.error }}>
                    ✗ {notFoundCount} not found
                  </Text>
                )}
              </View>

              {/* Track list */}
              <ScrollView style={{ paddingHorizontal: 20, maxHeight: 320 }}>
                {matched.map((m, i) => {
                  const isConfirmed = confirmed.has(i);
                  const isHighConf = m.confidence >= 70;

                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => toggleIndex(i)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                        opacity: isConfirmed ? 1 : 0.4,
                      }}
                    >
                      {/* Checkmark */}
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                          borderWidth: 1,
                          borderColor: isConfirmed ? colors.accent : colors.textFaint,
                          backgroundColor: isConfirmed ? colors.accent : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        {isConfirmed && <Text style={{ fontSize: 12, color: colors.bg, fontWeight: 'bold' }}>✓</Text>}
                      </View>

                      {/* Info */}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.text }}
                          numberOfLines={1}
                        >
                          {m.original.artist} - {m.original.title}
                        </Text>
                        {m.match ? (
                          <Text
                            style={{ fontFamily: fonts.mono, fontSize: 9, color: isHighConf ? colors.textDim : colors.secondary, marginTop: 2 }}
                            numberOfLines={1}
                          >
                            → {m.match.title} · {m.match.artist}
                            {!isHighConf && ` (${m.confidence}%)`}
                          </Text>
                        ) : (
                          <Text style={{ fontFamily: fonts.mono, fontSize: 9, color: colors.error, marginTop: 2 }}>
                            → not found
                          </Text>
                        )}
                      </View>

                      {/* Conf badge */}
                      {m.match && (
                        <Text
                          style={{
                            fontFamily: fonts.mono,
                            fontSize: 9,
                            color: isHighConf ? colors.accent : colors.secondary,
                            marginLeft: 8,
                          }}
                        >
                          {m.confidence}%
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Import button */}
              <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
                <TouchableOpacity
                  onPress={handleImport}
                  disabled={confirmed.size === 0 || !name.trim()}
                  activeOpacity={0.8}
                  style={{
                    paddingVertical: 14,
                    borderRadius: 4,
                    backgroundColor: confirmed.size > 0 ? colors.accent : colors.textFaint,
                    alignItems: 'center',
                  }}
                >
                  {saving ? (
                    <ActivityIndicator color={colors.bg} size="small" />
                  ) : (
                    <Text style={{ fontFamily: fonts.mono, fontSize: 12, letterSpacing: 1, color: colors.bg }}>
                      import {confirmed.size} track{confirmed.size !== 1 ? 's' : ''}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal >
  );
}
