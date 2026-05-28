import { memo } from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MoreVertical, Pause } from 'lucide-react-native';
import { MotiView } from 'moti';
import type { VideoInfo } from '../services/youtube';

interface Props {
  track: VideoInfo;
  index?: number;
  onPress: () => void;
  onLongPress?: () => void;
  onMore?: () => void;
  isActive?: boolean;
  showFavorite?: boolean;
  isFavorited?: boolean;
  onFavoriteToggle?: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const TrackRow = memo(function TrackRow({
  track,
  index,
  onPress,
  onLongPress,
  onMore,
  isActive,
  showFavorite,
  isFavorited,
  onFavoriteToggle,
}: Props) {
  const numeral = String((index ?? 0) + 1).padStart(2, '0');

  return (
    <MotiView
      from={{ opacity: 0, translateX: -8 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 280, delay: (index ?? 0) * 28 }}
    >
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={400}
        activeOpacity={0.65}
        className="flex-row items-center px-6 py-2.5"
        style={
          isActive
            ? {
                backgroundColor: 'rgba(255,92,46,0.06)',
                borderLeftWidth: 2,
                borderLeftColor: '#ff5c2e',
              }
            : { borderLeftWidth: 2, borderLeftColor: 'transparent' }
        }
      >
        <Text
          style={{
            fontFamily: 'JetBrainsMono_400Regular',
            fontSize: 11,
            color: isActive ? '#ff5c2e' : '#5a4d42',
            width: 22,
          }}
        >
          {numeral}
        </Text>

        <View className="relative ml-3">
          <Image
            source={{ uri: track.artwork }}
            style={{
              width: 50,
              height: 50,
              borderRadius: 6,
              backgroundColor: '#15110e',
            }}
            contentFit="cover"
          />
          {isActive && (
            <View
              className="absolute inset-0 rounded-md items-center justify-center"
              style={{ backgroundColor: 'rgba(10,9,7,0.55)' }}
            >
              <Pause color="#ff5c2e" size={16} fill="#ff5c2e" />
            </View>
          )}
        </View>

        <View className="flex-1 ml-3 min-w-0">
          <Text
            style={{
              fontFamily: 'Manrope_500Medium',
              fontSize: 18,
              lineHeight: 22,
              color: '#f5efe3',
            }}
            numberOfLines={1}
          >
            {track.title}
          </Text>
          <Text
            style={{
              fontFamily: 'Manrope_500Medium',
              fontSize: 11,
              letterSpacing: 0.4,
              color: '#a08a78',
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {track.artist}
          </Text>
        </View>

        <Text
          style={{
            fontFamily: 'JetBrainsMono_400Regular',
            fontSize: 11,
            color: '#5a4d42',
            marginLeft: 8,
          }}
        >
          {formatDuration(track.duration)}
        </Text>

        {showFavorite && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onFavoriteToggle?.();
            }}
            className="w-8 h-8 items-center justify-center ml-1"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Heart
              color={isFavorited ? '#ff5c2e' : '#5a4d42'}
              fill={isFavorited ? '#ff5c2e' : 'transparent'}
              size={16}
              strokeWidth={isFavorited ? 2 : 1.8}
            />
          </Pressable>
        )}

        {onMore && !showFavorite && (
          <TouchableOpacity
            onPress={onMore}
            className="w-8 h-8 items-center justify-center ml-1"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MoreVertical color="#5a4d42" size={16} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </MotiView>
  );
});

export default TrackRow;
