import { useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { X, ChevronUp, ChevronDown } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../constants/theme';
import { usePlayerStore } from '../../stores/playerStore';

const { height: SCREEN_H } = Dimensions.get('window');
const PANEL_HEIGHT = Math.min(SCREEN_H * 0.65, 520);

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function QueuePanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, fonts } = useTheme();
  const { queue, activeTrackIndex, removeFromQueue, clearQueue, moveInQueue } = usePlayerStore();

  const translateY = useSharedValue(PANEL_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withSpring(PANEL_HEIGHT, { damping: 20, stiffness: 200 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}>
      <Animated.View style={[{ flex: 1, backgroundColor: 'rgba(11,12,11,0.7)' }, backdropStyle]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: PANEL_HEIGHT,
            backgroundColor: colors.surface,
            borderTopLeftRadius: 6,
            borderTopRightRadius: 6,
            borderWidth: 1,
            borderColor: colors.border,
            borderBottomWidth: 0,
          },
          panelStyle,
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.accent, letterSpacing: 1 }}>
            [ QUEUE ] — {queue.length} tracks
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {queue.length > 0 && (
              <Pressable onPress={clearQueue} hitSlop={8}>
                <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.error }}>[ clear ]</Text>
              </Pressable>
            )}
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textDim }}>[ close ]</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
          {queue.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim }}>// queue empty</Text>
            </View>
          )}
          {queue.map((track, i) => (
            <View
              key={`${track.videoId}-${i}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                backgroundColor: i === activeTrackIndex ? 'rgba(229,255,58,0.05)' : 'transparent',
              }}
            >
              <View style={{ flexDirection: 'column', marginRight: 8 }}>
                <Pressable
                  onPress={() => moveInQueue(i, i - 1)}
                  disabled={i === 0}
                  hitSlop={6}
                  style={{ opacity: i === 0 ? 0.2 : 1, paddingVertical: 1 }}
                >
                  <ChevronUp color={colors.textFaint} size={12} strokeWidth={1.8} />
                </Pressable>
                <Pressable
                  onPress={() => moveInQueue(i, i + 1)}
                  disabled={i === queue.length - 1}
                  hitSlop={6}
                  style={{ opacity: i === queue.length - 1 ? 0.2 : 1, paddingVertical: 1 }}
                >
                  <ChevronDown color={colors.textFaint} size={12} strokeWidth={1.8} />
                </Pressable>
              </View>

              {i === activeTrackIndex ? (
                <View style={{ width: 2, height: 28, backgroundColor: colors.accent, marginRight: 8, borderRadius: 1 }} />
              ) : (
                <View style={{ width: 10 }} />
              )}

              <Image
                source={{ uri: track.artwork }}
                style={{ width: 36, height: 36, borderRadius: 3, backgroundColor: colors.bg }}
                contentFit="cover"
              />
              <View style={{ flex: 1, marginLeft: 10, minWidth: 0 }}>
                <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: i === activeTrackIndex ? colors.accent : colors.text }} numberOfLines={1}>
                  {track.title}
                </Text>
                <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textDim, marginTop: 1 }} numberOfLines={1}>
                  {track.artist} · {fmt(track.duration)}
                </Text>
              </View>

              <Pressable
                onPress={() => removeFromQueue(i)}
                hitSlop={8}
                style={{ padding: 6 }}
              >
                <X color={colors.textFaint} size={14} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
