import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, ChevronLeft } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import TrackRow from '../../components/TrackRow';
import { useLibraryStore } from '../../stores/libraryStore';
import { usePlayerStore } from '../../stores/playerStore';

export default function FavoritesScreen() {
  const router = useRouter();
  const { favoriteTracks } = useLibraryStore();
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
            style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: '#a08a78' }}
          >
            Favorites
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
                  backgroundColor: 'rgba(255,92,46,0.10)',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: 'rgba(255,92,46,0.18)',
                }}
              >
                <Heart color="#ff5c2e" size={36} fill="#ff5c2e" />
              </View>
            </MotiView>
            <Text
              style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: '#a08a78', marginTop: 20 }}
            >
              Your favorites
            </Text>
            <Text
              style={{ fontFamily: 'Manrope_500Medium', fontSize: 32, lineHeight: 36, color: '#f5efe3', marginTop: 6, textAlign: 'center' }}
            >
              Favorites
            </Text>
            <Text
              style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: '#5a4d42', marginTop: 6 }}
            >
              {favoriteTracks.length} tracks
            </Text>
          </View>

          {favoriteTracks.length === 0 && (
            <View className="items-center py-10">
              <Text style={{ fontFamily: 'Manrope_300Light', fontSize: 20, color: '#a08a78' }}>
                No favorites yet.
              </Text>
              <Text style={{ fontFamily: 'Manrope_400Regular', fontSize: 12, color: '#5a4d42', marginTop: 8 }}>
                Tap the heart icon to save
              </Text>
            </View>
          )}

          {favoriteTracks.map((t, i) => (
            <TrackRow
              key={t.videoId}
              track={{ videoId: t.videoId, title: t.title, artist: t.artist, artwork: t.artwork, duration: t.duration }}
              index={i}
              isActive={currentTrack?.videoId === t.videoId}
              onPress={() => playQueue(favoriteTracks.map((ft) => ({ id: ft.videoId, ...ft })), i)}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
