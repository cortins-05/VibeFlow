import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';
import { Download, Pause, Play } from 'lucide-react-native';
import { COLORS, FONTS } from '../constants/theme';

interface Props {
  state: 'idle' | 'downloading' | 'pausing' | 'paused' | 'done' | 'error';
  progress: number | null;
  onDownload: () => void;
  onPause: () => void;
  onResume: () => void;
  onDismiss: () => void;
}

export default function DownloadButton({ state, progress, onDownload, onPause, onResume, onDismiss }: Props) {
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
          borderColor: COLORS.border,
          marginLeft: 8,
        }}
      >
        <Download color={COLORS.textDim} size={12} />
        <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textDim, marginLeft: 6 }}>
          [ dl ]
        </Text>
      </TouchableOpacity>
    );
  }

  if (state === 'downloading' || state === 'pausing') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
        <View style={{ width: 100 }}>
          <View style={{ height: 3, backgroundColor: COLORS.border, borderRadius: 1, overflow: 'hidden' }}>
            <Animated.View
              style={{
                height: '100%',
                width: `${(progress ?? 0) * 100}%`,
                backgroundColor: COLORS.accent,
                borderRadius: 1,
              }}
            />
          </View>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textDim, marginTop: 3, textAlign: 'center' }}>
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
            borderColor: COLORS.border,
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {state === 'pausing' ? (
            <ActivityIndicator size="small" color={COLORS.textDim} />
          ) : (
            <Pause color={COLORS.textDim} size={12} />
          )}
        </TouchableOpacity>
      </View>
    );
  }

  if (state === 'paused') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
        <View style={{ width: 100 }}>
          <View style={{ height: 3, backgroundColor: COLORS.border, borderRadius: 1, overflow: 'hidden' }}>
            <Animated.View
              style={{
                height: '100%',
                width: `${(progress ?? 0) * 100}%`,
                backgroundColor: COLORS.textDim,
                borderRadius: 1,
              }}
            />
          </View>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textDim, marginTop: 3, textAlign: 'center' }}>
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
            borderColor: COLORS.borderAccent,
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Play color={COLORS.accent} size={12} fill={COLORS.accent} />
        </TouchableOpacity>
      </View>
    );
  }

  if (state === 'done') {
    return (
      <TouchableOpacity
        onPress={onDismiss}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 7,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: 'rgba(61,245,224,0.3)',
          marginLeft: 8,
        }}
      >
        <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.secondary }}>
          SAVED ✓
        </Text>
      </TouchableOpacity>
    );
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
      <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.error }}>
        ERR · retry
      </Text>
    </TouchableOpacity>
  );
}
