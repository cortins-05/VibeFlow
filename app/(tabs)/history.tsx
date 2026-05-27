import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, ChevronLeft } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import TrackRow from '../../components/TrackRow';
import { useLibraryStore } from '../../stores/libraryStore';
import { usePlayerStore } from '../../stores/playerStore';

export default function HistoryScreen() {
  const router = useRouter();
  const { history } = useLibraryStore();
  const { playQueue, currentTrack } = usePlayerStore();

  return (
    <View className="flex-1 bg-[#0a0907]">
      <LinearGradient
        colors={['rgba(255,92,46,0.12)', 'rgba(10,9,7,0)']}
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
            style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, letterSpacing: 1.8, color: '#a08a78' }}
          >
            HISTORY
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
                  backgroundColor: 'rgba(210,170,140,0.10)',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: 'rgba(210,170,140,0.18)',
                }}
              >
                <Clock color="#d2aa8c" size={36} />
              </View>
            </MotiView>
            <Text
              style={{ fontFamily: 'JetBrainsMono_500Medium', fontSize: 10, letterSpacing: 1.8, color: '#a08a78', marginTop: 20 }}
            >
              RECENT LISTENS
            </Text>
            <Text
              style={{ fontFamily: 'Manrope_500Medium', fontSize: 32, lineHeight: 36, color: '#f5efe3', marginTop: 6, textAlign: 'center' }}
            >
              History
            </Text>
            <Text
              style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, letterSpacing: 1.2, color: '#5a4d42', marginTop: 6 }}
            >
              {String(history.length).padStart(2, '0')} · TRACKS
            </Text>
          </View>

          {history.length === 0 && (
            <View className="items-center py-10">
              <Text style={{ fontFamily: 'Manrope_300Light', fontSize: 20, color: '#a08a78' }}>
                Nothing yet.
              </Text>
              <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, letterSpacing: 1.4, color: '#5a4d42', marginTop: 8 }}>
                PLAY A TRACK TO SEE IT HERE
              </Text>
            </View>
          )}

          {history.map((h, i) => (
            <TrackRow
              key={h.video_id + '_' + (h.id ?? i)}
              track={{ videoId: h.video_id, title: h.title, artist: h.artist, artwork: h.artwork ?? undefined, duration: h.duration }}
              index={i}
              isActive={currentTrack?.videoId === h.video_id}
              onPress={() => playQueue(history.map((entry) => ({ id: entry.video_id, videoId: entry.video_id, title: entry.title, artist: entry.artist, artwork: entry.artwork ?? undefined, duration: entry.duration })), i)}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
