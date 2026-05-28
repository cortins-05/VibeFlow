import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, FONTS } from '../../constants/theme';

export default function TerminalArtwork({ uri, size, onPress }: { uri?: string; size: number; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ width: size, alignSelf: 'center' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 4 }}>
        <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textDim }}>┌─ now_playing ──</Text>
        <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textDim }}>──┐</Text>
      </View>
      <View
        style={{
          width: size,
          height: size,
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.surface,
          overflow: 'hidden',
          borderRadius: 4,
        }}
      >
        <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" />
      </View>
    </Pressable>
  );
}
