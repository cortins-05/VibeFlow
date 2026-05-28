import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';
import { Download, Pause, Play } from 'lucide-react-native';
import { useTheme } from '../constants/theme';

interface Props {
  state: 'idle' | 'downloading' | 'pausing' | 'paused' | 'done' | 'error';
  progress: number | null;
  onDownload: () => void;
  onPause: () => void;
  onResume: () => void;
  onDismiss: () => void;
}

export default function DownloadButton({ state, progress, onDownload, onPause, onResume, onDismiss }: Props) {
  const { colors, fonts } = useTheme();
  if (state === 'idle') {
    return (
      <TouchableOpacity
        onPress={onDownload}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 7,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: colors.border,
          marginLeft: 8,
        }}
      >
        <Download color={colors.textDim} size={12} />
        <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textDim, marginLeft: 6 }}>
          [ dl ]
        </Text>
      </TouchableOpacity>
    );
  }

  if (state === 'downloading' || state === 'pausing') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
        <View style={{ width: 100 }}>
          <View style={{ height: 3, backgroundColor: colors.border, borderRadius: 1, overflow: 'hidden' }}>
            <Animated.View
              style={{
                height: '100%',
                width: `${(progress ?? 0) * 100}%`,
                backgroundColor: colors.accent,
                borderRadius: 1,
              }}
            />
          </View>
          <Text style={{ fontFamily: fonts.mono, fontSize: 9, color: colors.textDim, marginTop: 3, textAlign: 'center' }}>
            {Math.round((progress ?? 0) * 100)}%
          </Text>
        </View>
        <TouchableOpacity
          onPress={onPause}
          disabled={state === 'pausing'}
          style={{
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 8,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {state === 'pausing' ? (
            <ActivityIndicator size="small" color={colors.textDim} />
          ) : (
            <Pause color={colors.textDim} size={12} />
          )}
        </TouchableOpacity>
      </View>
    );
  }

  if (state === 'paused') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
        <View style={{ width: 100 }}>
          <View style={{ height: 3, backgroundColor: colors.border, borderRadius: 1, overflow: 'hidden' }}>
            <Animated.View
              style={{
                height: '100%',
                width: `${(progress ?? 0) * 100}%`,
                backgroundColor: colors.textDim,
                borderRadius: 1,
              }}
            />
          </View>
          <Text style={{ fontFamily: fonts.mono, fontSize: 9, color: colors.textDim, marginTop: 3, textAlign: 'center' }}>
            PAUSED
          </Text>
        </View>
        <TouchableOpacity
          onPress={onResume}
          style={{
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 8,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: colors.borderAccent,
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Play color={colors.accent} size={12} fill={colors.accent} />
        </TouchableOpacity>
      </View>
    );
  }

  if (state === 'done') {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={onDownload}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,77,77,0.3)',
        marginLeft: 8,
      }}
    >
      <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.error }}>
        ERR · retry
      </Text>
    </TouchableOpacity>
  );
}
