import { View, Pressable } from 'react-native';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1 } from 'lucide-react-native';
import { RepeatMode } from 'react-native-track-player';
import { COLORS, glow } from '../../constants/theme';

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
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28 }}>
      <Pressable onPress={p.onShuffle} hitSlop={8} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
        <Shuffle color={p.shuffle ? COLORS.accent : COLORS.textFaint} size={20} strokeWidth={1.8} />
      </Pressable>
      <Pressable onPress={p.onPrev} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
        <SkipBack color={COLORS.text} size={26} fill={COLORS.text} />
      </Pressable>
      <Pressable
        onPress={p.onPlayPause}
        style={[
          { width: 72, height: 72, borderRadius: 8, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
          glow(COLORS.accent, 24, 0.5),
        ]}
      >
        {p.isPlaying ? (
          <Pause color={COLORS.bg} size={28} fill={COLORS.bg} />
        ) : (
          <Play color={COLORS.bg} size={28} fill={COLORS.bg} style={{ marginLeft: 3 }} />
        )}
      </Pressable>
      <Pressable onPress={p.onNext} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
        <SkipForward color={COLORS.text} size={26} fill={COLORS.text} />
      </Pressable>
      <Pressable onPress={p.onRepeat} hitSlop={8} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
        {p.repeat === RepeatMode.Track ? (
          <Repeat1 color={COLORS.accent} size={20} strokeWidth={1.8} />
        ) : (
          <Repeat color={p.repeat === RepeatMode.Queue ? COLORS.accent : COLORS.textFaint} size={20} strokeWidth={1.8} />
        )}
      </Pressable>
    </View>
  );
}
