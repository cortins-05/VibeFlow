import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Download, ChevronLeft, Trash2 } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import TrackRow from '../../components/TrackRow';
import { useDownloadStore } from '../../stores/downloadStore';
import { usePlayerStore } from '../../stores/playerStore';

export default function DownloadsScreen() {
  const router = useRouter();
  const { downloads, deleteDownload } = useDownloadStore();
  const { playQueue, currentTrack } = usePlayerStore();

  return (
    <View className="flex-1 bg-[#0a0907]">
      <LinearGradient
        colors={['rgba(52,199,89,0.12)', 'rgba(10,9,7,0)']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }}
      />
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center px-5 pt-2 pb-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
          >
            <ChevronLeft color="#f5efe3" size={24} />
          </TouchableOpacity>
          <Text
            style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: '#a08a78' }}
          >
            Downloads
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
        >
          <View className="items-center px-8 pt-4 pb-6">
            <MotiView
              from={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 16, stiffness: 100 }}
            >
              <View
                style={{
                  width: 100, height: 100, borderRadius: 50,
                  backgroundColor: 'rgba(52,199,89,0.10)',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: 'rgba(52,199,89,0.18)',
                }}
              >
                <Download color="#34c759" size={36} />
              </View>
            </MotiView>
            <Text
              style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: '#a08a78', marginTop: 20 }}
            >
              Available offline
            </Text>
            <Text
              style={{ fontFamily: 'Manrope_500Medium', fontSize: 32, lineHeight: 36, color: '#f5efe3', marginTop: 6, textAlign: 'center' }}
            >
              Downloads
            </Text>
            <Text
              style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: '#5a4d42', marginTop: 6 }}
            >
              {downloads.length} tracks
            </Text>
          </View>

          {downloads.length === 0 && (
            <View className="items-center py-10">
              <Text style={{ fontFamily: 'Manrope_300Light', fontSize: 20, color: '#a08a78' }}>
                No downloads yet.
              </Text>
              <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: '#5a4d42', marginTop: 8 }}>
                Download songs from the player
              </Text>
            </View>
          )}

          {downloads.map((d, i) => (
            <View key={d.video_id} className="flex-row items-center">
              <View className="flex-1">
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
                  onPress={() => playQueue(
                    downloads.map((dt) => ({
                      id: dt.video_id,
                      videoId: dt.video_id,
                      title: dt.title,
                      artist: dt.artist,
                      artwork: dt.artwork,
                      duration: dt.duration,
                    })),
                    i,
                  )}
                />
              </View>
              <TouchableOpacity
                onPress={() => deleteDownload(d.video_id)}
                className="pr-6 pl-2 py-4"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Trash2 color="#5a4d42" size={16} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
