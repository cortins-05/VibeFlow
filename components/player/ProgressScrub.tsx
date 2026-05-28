import { View, Text } from 'react-native';
import { useTheme, glow } from '../../constants/theme';

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function ProgressScrub({
  position,
  duration,
  onSeek,
}: {
  position: number;
  duration: number;
  onSeek: (x: number) => void;
}) {
  const { colors, fonts } = useTheme();
  const ratio = duration > 0 ? position / duration : 0;
  return (
    <View>
      <View
        style={{ height: 32, justifyContent: 'center' }}
        onStartShouldSetResponder={() => true}
        onResponderGrant={(e) => onSeek(e.nativeEvent.locationX)}
        onResponderMove={(e) => onSeek(e.nativeEvent.locationX)}
      >
        <View style={{ height: 2, backgroundColor: colors.border, overflow: 'hidden' }}>
          <View
            style={[{ height: '100%', width: `${ratio * 100}%`, backgroundColor: colors.accent }, glow(colors.accent, 6, 0.6)]}
          />
        </View>
        <View
          style={[
            { position: 'absolute', left: `${ratio * 100}%`, marginLeft: -5, top: 11, width: 10, height: 10, backgroundColor: colors.accent },
            glow(colors.accent, 8, 0.7),
          ]}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
        <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.secondary }}>{fmt(position)}</Text>
        <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textDim }}>
          -{fmt(Math.max(0, duration - position))}
        </Text>
      </View>
    </View>
  );
}
