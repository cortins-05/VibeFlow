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
import { Plus, ListMusic, Heart, Clock, Download, ChevronRight } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import TrackRow from '../../components/TrackRow';
import ConsoleHeader from '../../components/ui/ConsoleHeader';
import SectionHeader from '../../components/ui/SectionHeader';
import ImportTrigger from '../../components/ImportTrigger';
import { useLibraryStore } from '../../stores/libraryStore';
import { useDownloadStore } from '../../stores/downloadStore';
import { useTheme, glow } from '../../constants/theme';

export default function LibraryScreen() {
  const { colors, fonts } = useTheme();
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
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingRight: 20 }}>
          <ConsoleHeader path="library" title="Library" />
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <ImportTrigger compact />
            <TouchableOpacity
              onPress={() => setShowCreate(true)}
              activeOpacity={0.8}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: colors.borderAccent,
                flexDirection: 'row',
                alignItems: 'center',
                ...glow(colors.accent, 4, 0.3),
              }}
            >
              <Plus color={colors.accent} size={14} strokeWidth={2} />
              <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.accent, marginLeft: 6 }}>
                new
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
        >
          {/* Pinned cards */}
          <View style={{ paddingHorizontal: 20, marginTop: 8, gap: 8 }}>
            <PinnedCard
              glyph="♥"
              label="Favorites"
              count={favorites.size}
              accent
              onPress={() => router.push('/(tabs)/favorites' as any)}
            />
            <PinnedCard
              glyph="↓"
              label="Downloads"
              count={downloads.length}
              cyan
              onPress={() => router.push('/(tabs)/downloads' as any)}
            />
            <PinnedCard
              glyph="◷"
              label="History"
              count={history.length}
              onPress={() => router.push('/(tabs)/history' as any)}
            />
          </View>

          {/* Playlists */}
          <View style={{ marginTop: 20 }}>
            <SectionHeader label="Playlists" count={playlists.length} />

            {playlists.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim }}>
                  // no playlists
                </Text>
                <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textFaint, marginTop: 6 }}>
                  tap [new] to start collecting
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
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textFaint, width: 22 }}>
                    {String(i + 1).padStart(2, '0')}
                  </Text>
                  <View
                    style={{
                      marginLeft: 12,
                      width: 40,
                      height: 40,
                      borderRadius: 4,
                      backgroundColor: colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <ListMusic color={colors.secondary} size={18} strokeWidth={1.6} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12, minWidth: 0 }}>
                    <Text
                      style={{ fontFamily: fonts.sans, fontSize: 18, lineHeight: 22, color: colors.text }}
                      numberOfLines={1}
                    >
                      {pl.name}
                    </Text>
                    {pl.description ? (
                      <Text
                        style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textDim, marginTop: 2 }}
                        numberOfLines={1}
                      >
                        {pl.description}
                      </Text>
                    ) : null}
                  </View>
                  <ChevronRight color={colors.textFaint} size={16} />
                </TouchableOpacity>
              </MotiView>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Create playlist modal */}
      <Modal
        visible={showCreate}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreate(false)}
      >
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(11,12,11,0.88)' }}
        >
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
              NEW · PLAYLIST
            </Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 28, lineHeight: 32, color: colors.text, marginTop: 6, marginBottom: 16 }}>
              Name it.
            </Text>
            <TextInput
              value={playlistName}
              onChangeText={setPlaylistName}
              placeholder="e.g. late_night_drive"
              placeholderTextColor={colors.textFaint}
              autoFocus
              onSubmitEditing={handleCreate}
              style={{
                fontFamily: fonts.mono,
                fontSize: 14,
                color: colors.text,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderAccent,
                marginBottom: 20,
              }}
            />
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                onPress={() => setShowCreate(false)}
                style={{ flex: 1, paddingVertical: 12, alignItems: 'center', marginRight: 8 }}
              >
                <Text style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.4, color: colors.textDim }}>
                  CANCEL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreate}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 4,
                  backgroundColor: colors.accent,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.4, color: colors.bg }}>
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

function PinnedCard({
  glyph,
  label,
  count,
  accent,
  cyan,
  onPress,
}: {
  glyph: string;
  label: string;
  count: number;
  accent?: boolean;
  cyan?: boolean;
  onPress?: () => void;
}) {
  const { colors, fonts } = useTheme();
  const color = accent ? colors.accent : cyan ? colors.secondary : colors.textDim;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 4,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: accent ? colors.borderAccent : colors.border,
      }}
    >
      <Text style={{ fontFamily: fonts.mono, fontSize: 18, color, width: 28 }}>{glyph}</Text>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontFamily: fonts.sans, fontSize: 18, lineHeight: 22, color: colors.text }}>
          {label}
        </Text>
        <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textDim, marginTop: 2 }}>
          {count} tracks
        </Text>
      </View>
      <ChevronRight color={colors.textFaint} size={16} />
    </TouchableOpacity>
  );
}
