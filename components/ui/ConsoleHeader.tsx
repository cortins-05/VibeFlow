import { View, Text } from 'react-native';
import { useTheme } from '../../constants/theme';
import Caret from './Caret';

export default function ConsoleHeader({ path, title }: { path: string; title?: string }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.textDim }}>
          vibeflow <Text style={{ color: colors.secondary }}>~/{path}</Text>{' '}
          <Text style={{ color: colors.accent }}>$</Text>
        </Text>
        <Caret size={13} />
      </View>
      {title ? (
        <Text style={{ fontFamily: fonts.sansLight, fontSize: 40, lineHeight: 44, color: colors.text, marginTop: 6 }}>
          {title}
        </Text>
      ) : null}
    </View>
  );
}
