import { View } from 'react-native';

// Cheap CRT scanlines: stack of thin dark rows over content, non-interactive.
export default function ScanlineOverlay({ opacity = 0.04 }: { opacity?: number }) {
  const rows = Array.from({ length: 200 });
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity }}>
      {rows.map((_, i) => (
        <View key={i} style={{ height: 1, marginTop: 2, backgroundColor: '#000' }} />
      ))}
    </View>
  );
}
