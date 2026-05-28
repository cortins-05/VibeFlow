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

export default function HistoryScreen() {
  const router = useRouter();
  const { history } = useLibraryStore();
  const { playQueue, currentTrack, addToQueue } = usePlayerStore();
  const [actionTrack, setActionTrack] = useState<{ id: string; videoId: string; title: string; artist: string; artwork?: string; duration: number } | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronLeft color={COLORS.text} size={22} />
          </TouchableOpacity>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textDim }}>
            vibeflow <Text style={{ color: COLORS.secondary }}>~/history</Text>{' '}
            <Text style={{ color: COLORS.accent }}>$</Text>
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
        >
          <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
            <Text style={{ fontFamily: FONTS.sansLight, fontSize: 36, lineHeight: 40, color: COLORS.text }}>
              History
            </Text>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textDim, marginTop: 6, letterSpacing: 0.5 }}>
              {history.length} entries
            </Text>
          </View>

          {history.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textDim }}>
                // empty
              </Text>
              <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textFaint, marginTop: 6 }}>
                play a track to see it here
              </Text>
            </View>
          )}

          {history.length > 0 && (
            <SectionHeader label="log" count={history.length} />
          )}

          {history.map((h, i) => (
            <TrackRow
              key={h.video_id + '_' + (h.id ?? i)}
              track={{ videoId: h.video_id, title: h.title, artist: h.artist, artwork: h.artwork ?? undefined, duration: h.duration }}
              index={i}
              isActive={currentTrack?.videoId === h.video_id}
              onLongPress={() =>
                setActionTrack({ id: h.video_id, videoId: h.video_id, title: h.title, artist: h.artist, artwork: h.artwork ?? undefined, duration: h.duration })
              }
              onPress={() =>
                playQueue(
                  history.map((entry) => ({
                    id: entry.video_id,
                    videoId: entry.video_id,
                    title: entry.title,
                    artist: entry.artist,
                    artwork: entry.artwork ?? undefined,
                    duration: entry.duration,
                  })),
                  i,
                )
              }
              onSwipeRight={() =>
                addToQueue({
                  id: h.video_id,
                  videoId: h.video_id,
                  title: h.title,
                  artist: h.artist,
                  artwork: h.artwork ?? undefined,
                  duration: h.duration,
                })
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
