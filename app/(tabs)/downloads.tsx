import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import TrackRow from '../../components/TrackRow';
import SectionHeader from '../../components/ui/SectionHeader';
import { useDownloadStore } from '../../stores/downloadStore';
import { usePlayerStore } from '../../stores/playerStore';
import { COLORS, FONTS } from '../../constants/theme';

export default function DownloadsScreen() {
  const router = useRouter();
  const { downloads, deleteDownload } = useDownloadStore();
  const { playQueue, currentTrack } = usePlayerStore();

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
            vibeflow <Text style={{ color: COLORS.secondary }}>~/downloads</Text>{' '}
            <Text style={{ color: COLORS.accent }}>$</Text>
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
        >
          <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}>
            <Text style={{ fontFamily: FONTS.sansLight, fontSize: 36, lineHeight: 40, color: COLORS.text }}>
              Downloads
            </Text>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.secondary, marginTop: 6, letterSpacing: 0.5 }}>
              {downloads.length} files · OFFLINE
            </Text>
          </View>

          {downloads.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textDim }}>
                // no downloads
              </Text>
              <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textFaint, marginTop: 6 }}>
                download songs from the player
              </Text>
            </View>
          )}

          {downloads.length > 0 && (
            <SectionHeader label="offline" count={downloads.length} />
          )}

          {downloads.map((d, i) => (
            <View key={d.video_id} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <TrackRow
                  track={{
                    videoId: d.video_id,
                    title: d.title,
                    artist: d.artist,
                    artwork: d.artwork,
                    duration: d.duration,
                  }}
                  index={i}
                  isActive={currentTrack?.videoId === d.video_id}
                  onPress={() =>
                    playQueue(
                      downloads.map((dt) => ({
                        id: dt.video_id,
                        videoId: dt.video_id,
                        title: dt.title,
                        artist: dt.artist,
                        artwork: dt.artwork,
                        duration: dt.duration,
                      })),
                      i,
                    )
                  }
                />
              </View>
              <TouchableOpacity
                onPress={() => deleteDownload(d.video_id)}
                style={{ paddingRight: 20, paddingLeft: 8, paddingVertical: 16 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Trash2 color={COLORS.textFaint} size={16} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
