import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';
import { Download, Pause, Play } from 'lucide-react-native';

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
        className="flex-row items-center px-4 py-2 rounded-full ml-2"
        style={{
          borderWidth: 1,
          borderColor: 'rgba(245,239,227,0.08)',
          backgroundColor: 'transparent',
        }}
      >
        <Download color="#a08a78" size={14} />
        <Text
          style={{
            fontFamily: 'Manrope_500Medium',
            fontSize: 12,
            color: '#a08a78',
            marginLeft: 6,
          }}
        >
          Download
        </Text>
      </TouchableOpacity>
    );
  }

  if (state === 'downloading' || state === 'pausing') {
    return (
      <View className="flex-row items-center ml-2">
        <View style={{ width: 120 }}>
          <View
            className="rounded-full overflow-hidden"
            style={{
              height: 4,
              backgroundColor: 'rgba(245,239,227,0.1)',
            }}
          >
            <Animated.View
              style={{
                height: '100%',
                width: `${(progress ?? 0) * 100}%`,
                backgroundColor: '#ff5c2e',
                borderRadius: 2,
              }}
            />
          </View>
          <Text
            style={{
              fontFamily: 'Manrope_400Regular',
              fontSize: 10,
              color: '#a08a78',
              marginTop: 4,
              textAlign: 'center',
            }}
          >
            {Math.round((progress ?? 0) * 100)}%
          </Text>
        </View>
        <TouchableOpacity
          onPress={onPause}
          disabled={state === 'pausing'}
          className="w-8 h-8 items-center justify-center ml-2"
          style={{
            borderRadius: 20,
            backgroundColor: 'rgba(245,239,227,0.08)',
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {state === 'pausing' ? (
            <ActivityIndicator size="small" color="#a08a78" />
          ) : (
            <Pause color="#a08a78" size={14} />
          )}
        </TouchableOpacity>
      </View>
    );
  }

  if (state === 'paused') {
    return (
      <View className="flex-row items-center ml-2">
        <View style={{ width: 120 }}>
          <View
            className="rounded-full overflow-hidden"
            style={{
              height: 4,
              backgroundColor: 'rgba(245,239,227,0.1)',
            }}
          >
            <Animated.View
              style={{
                height: '100%',
                width: `${(progress ?? 0) * 100}%`,
                backgroundColor: '#e8b67a',
                borderRadius: 2,
              }}
            />
          </View>
          <Text
            style={{
              fontFamily: 'Manrope_400Regular',
              fontSize: 10,
              color: '#a08a78',
              marginTop: 4,
              textAlign: 'center',
            }}
          >
            Paused
          </Text>
        </View>
        <TouchableOpacity
          onPress={onResume}
          className="w-8 h-8 items-center justify-center ml-2"
          style={{
            borderRadius: 20,
            backgroundColor: 'rgba(232,182,122,0.15)',
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Play color="#e8b67a" size={14} fill="#e8b67a" />
        </TouchableOpacity>
      </View>
    );
  }

  if (state === 'done') {
    return (
      <TouchableOpacity
        onPress={onDismiss}
        className="flex-row items-center px-4 py-2 rounded-full ml-2"
        style={{
          borderWidth: 1,
          borderColor: 'rgba(52,199,89,0.3)',
          backgroundColor: 'rgba(52,199,89,0.1)',
        }}
      >
        <Text
          style={{
            fontFamily: 'Manrope_500Medium',
            fontSize: 12,
            color: '#34c759',
            marginLeft: 6,
          }}
        >
          Saved ✓
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onDownload}
      className="flex-row items-center px-4 py-2 rounded-full ml-2"
      style={{
        borderWidth: 1,
        borderColor: 'rgba(255,69,58,0.3)',
        backgroundColor: 'rgba(255,69,58,0.1)',
      }}
    >
      <Text
        style={{
          fontFamily: 'Manrope_500Medium',
          fontSize: 12,
          color: '#ff453a',
          marginLeft: 6,
        }}
      >
        Failed – tap retry
      </Text>
    </TouchableOpacity>
  );
}
