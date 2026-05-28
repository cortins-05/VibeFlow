import { View, Pressable } from 'react-native';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1 } from 'lucide-react-native';
import { RepeatMode } from 'react-native-track-player';
import { useTheme, glow } from '../../constants/theme';

export default function PlayerControls(p: {
  isPlaying: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  onShuffle: () => void;
  onPrev: () => void;
  onPlayPause: () => void;
  onNext: () => void;
  onRepeat: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28 }}>
      <Pressable onPress={p.onShuffle} hitSlop={8} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
        <Shuffle color={p.shuffle ? colors.accent : colors.textFaint} size={20} strokeWidth={1.8} />
      </Pressable>
      <Pressable onPress={p.onPrev} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
        <SkipBack color={colors.text} size={26} fill={colors.text} />
      </Pressable>
      <Pressable
        onPress={p.onPlayPause}
        style={[
          { width: 72, height: 72, borderRadius: 8, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
          glow(colors.accent, 24, 0.5),
        ]}
      >
        {p.isPlaying ? (
          <Pause color={colors.bg} size={28} fill={colors.bg} />
        ) : (
          <Play color={colors.bg} size={28} fill={colors.bg} style={{ marginLeft: 3 }} />
        )}
      </Pressable>
      <Pressable onPress={p.onNext} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
        <SkipForward color={colors.text} size={26} fill={colors.text} />
      </Pressable>
      <Pressable onPress={p.onRepeat} hitSlop={8} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
        {p.repeat === RepeatMode.Track ? (
          <Repeat1 color={colors.accent} size={20} strokeWidth={1.8} />
        ) : (
          <Repeat color={p.repeat === RepeatMode.Queue ? colors.accent : colors.textFaint} size={20} strokeWidth={1.8} />
        )}
      </Pressable>
    </View>
  );
}
