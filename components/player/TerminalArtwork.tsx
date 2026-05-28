import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../../constants/theme';

export default function TerminalArtwork({ uri, size, onPress }: { uri?: string; size: number; onPress?: () => void }) {
  const { colors, fonts } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ width: size, alignSelf: 'center' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 4 }}>
        <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textDim }}>┌─ now_playing ──</Text>
        <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textDim }}>──┐</Text>
      </View>
      <View
        style={{
          width: size,
          height: size,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          overflow: 'hidden',
          borderRadius: 4,
        }}
      >
        <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" />
      </View>
    </Pressable>
  );
}
