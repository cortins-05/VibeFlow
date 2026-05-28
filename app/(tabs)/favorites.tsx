import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import TrackRow from '../../components/TrackRow';
import TrackActionsModal from '../../components/TrackActionsModal';
import SectionHeader from '../../components/ui/SectionHeader';
import { useLibraryStore } from '../../stores/libraryStore';
import { usePlayerStore } from '../../stores/playerStore';
import { COLORS, FONTS } from '../../constants/theme';

export default function FavoritesScreen() {
  const router = useRouter();
  const { favoriteTracks } = useLibraryStore();
  const { playQueue, currentTrack, addToQueue } = usePlayerStore();
  const [actionTrack, setActionTrack] = useState<{ id: string; videoId: string; title: string; artist: string; artwork?: string; duration: number } | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronLeft color={COLORS.text} size={22} />
          </TouchableOpacity>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textDim }}>
            vibeflow <Text style={{ color: COLORS.secondary }}>~/favorites</Text>{' '}
            <Text style={{ color: COLORS.accent }}>$</Text>
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
        >
          <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
            <Text style={{ fontFamily: FONTS.sansLight, fontSize: 36, lineHeight: 40, color: COLORS.text }}>
              Favorites
            </Text>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.secondary, marginTop: 6, letterSpacing: 0.5 }}>
              {favoriteTracks.length} tracks · SAVED ✓
            </Text>
          </View>

          {favoriteTracks.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textDim }}>
                // no favorites yet
              </Text>
              <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textFaint, marginTop: 6 }}>
                tap ♥ to save tracks
              </Text>
            </View>
          )}

          {favoriteTracks.length > 0 && (
            <SectionHeader label="saved" count={favoriteTracks.length} />
          )}

          {favoriteTracks.map((t, i) => (
            <TrackRow
              key={t.videoId}
              track={{ videoId: t.videoId, title: t.title, artist: t.artist, artwork: t.artwork, duration: t.duration }}
              index={i}
              isActive={currentTrack?.videoId === t.videoId}
              onLongPress={() =>
                setActionTrack({ id: t.videoId, videoId: t.videoId, title: t.title, artist: t.artist, artwork: t.artwork, duration: t.duration })
              }
              onPress={() => playQueue(favoriteTracks.map((ft) => ({ id: ft.videoId, ...ft })), i)}
              onSwipeRight={() =>
                addToQueue({ id: t.videoId, videoId: t.videoId, title: t.title, artist: t.artist, artwork: t.artwork, duration: t.duration })
              }
            />
          ))}
        </ScrollView>

        <TrackActionsModal
          visible={!!actionTrack}
          track={actionTrack}
          onClose={() => setActionTrack(null)}
        />
      </SafeAreaView>
    </View>
  );
}
