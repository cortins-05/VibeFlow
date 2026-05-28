import { memo, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Pressable, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MoreVertical, Pause, ListMusic, Trash2 } from 'lucide-react-native';
import { MotiView } from 'moti';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import type { VideoInfo } from '../services/youtube';
import { useTheme } from '../constants/theme';

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
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
}

const ACTION_WIDTH = 100;

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
  onSwipeRight,
  onSwipeLeft,
}: Props) {
  const { colors, fonts } = useTheme();
  const numeral = String((index ?? 0) + 1).padStart(2, '0');
  const swipeableRef = useRef<any>(null);
  const hasSwipe = !!onSwipeRight || !!onSwipeLeft;

  const renderLeftActions = useCallback(
    (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
      if (!onSwipeRight) return null;
      const translateX = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [-ACTION_WIDTH, 0],
      });
      return (
        <Animated.View style={{ transform: [{ translateX }] }}>
          <TouchableOpacity
            onPress={() => {
              onSwipeRight();
              swipeableRef.current?.close();
            }}
            activeOpacity={0.85}
            style={{
              backgroundColor: colors.accent,
              width: ACTION_WIDTH,
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ListMusic color={colors.bg} size={18} />
            <Text
              style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.bg, marginTop: 4 }}
            >
              add to queue
            </Text>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [onSwipeRight, colors, fonts],
  );

  const renderRightActions = useCallback(
    (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
      if (!onSwipeLeft) return null;
      const translateX = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [ACTION_WIDTH, 0],
      });
      return (
        <Animated.View style={{ transform: [{ translateX }] }}>
          <TouchableOpacity
            onPress={() => {
              onSwipeLeft();
              swipeableRef.current?.close();
            }}
            activeOpacity={0.85}
            style={{
              backgroundColor: '#e74c3c',
              width: ACTION_WIDTH,
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Trash2 color="#fff" size={18} />
            <Text
              style={{ fontFamily: fonts.mono, fontSize: 10, color: '#fff', marginTop: 4 }}
            >
              remove
            </Text>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [onSwipeLeft, fonts],
  );

  const row = (
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={400}
        activeOpacity={0.65}
        className="flex-row items-center px-6 py-2.5"
        style={
          isActive
            ? {
                backgroundColor: 'rgba(229,255,58,0.05)',
                borderLeftWidth: 2,
                borderLeftColor: colors.accent,
              }
            : { borderLeftWidth: 2, borderLeftColor: 'transparent' }
        }
      >
        <Text
          style={{
            fontFamily: fonts.mono,
            fontSize: 11,
            color: isActive ? colors.accent : colors.textFaint,
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
              borderRadius: 4,
              backgroundColor: colors.surface,
            }}
            contentFit="cover"
          />
          {isActive && (
            <View
              className="absolute inset-0 items-center justify-center"
              style={{ backgroundColor: 'rgba(11,12,11,0.6)', borderRadius: 4 }}
            >
              <Pause color={colors.accent} size={16} fill={colors.accent} />
            </View>
          )}
        </View>

        <View className="flex-1 ml-3 min-w-0">
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 17,
              lineHeight: 21,
              color: colors.text,
            }}
            numberOfLines={1}
          >
            {track.title}
          </Text>
          <Text
            style={{
              fontFamily: fonts.mono,
              fontSize: 11,
              letterSpacing: 0.4,
              color: colors.textDim,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {track.artist}
          </Text>
        </View>

        <Text
          style={{
            fontFamily: fonts.mono,
            fontSize: 11,
            color: colors.textFaint,
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
              color={isFavorited ? colors.secondary : colors.textFaint}
              fill={isFavorited ? colors.secondary : 'transparent'}
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
            <MoreVertical color={colors.textFaint} size={16} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
  );

  return (
    <MotiView
      from={{ opacity: 0, translateX: -8 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 280, delay: (index ?? 0) * 28 }}
    >
      {hasSwipe ? (
        <Swipeable
          ref={swipeableRef}
          renderLeftActions={renderLeftActions}
          renderRightActions={renderRightActions}
          overshootLeft={false}
          overshootRight={false}
        >
          {row}
        </Swipeable>
      ) : (
        row
      )}
    </MotiView>
  );
});

export default TrackRow;
