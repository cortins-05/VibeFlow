import { View, Text } from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';
import Caret from './Caret';

export default function ConsoleHeader({ path, title }: { path: string; title?: string }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.textDim }}>
          vibeflow <Text style={{ color: COLORS.secondary }}>~/{path}</Text>{' '}
          <Text style={{ color: COLORS.accent }}>$</Text>
        </Text>
        <Caret size={13} />
      </View>
      {title ? (
        <Text style={{ fontFamily: FONTS.sansLight, fontSize: 40, lineHeight: 44, color: COLORS.text, marginTop: 6 }}>
          {title}
        </Text>
      ) : null}
    </View>
  );
}
