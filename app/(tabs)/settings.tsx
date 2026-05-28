import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConsoleHeader from '../../components/ui/ConsoleHeader';
import SectionHeader from '../../components/ui/SectionHeader';
import StatusLine from '../../components/ui/StatusLine';
import ThemeSelector from '../../components/ThemeSelector';
import ImportTrigger from '../../components/ImportTrigger';
import { useTheme } from '../../constants/theme';

export default function SettingsScreen() {
  const { colors, fonts } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ConsoleHeader path="settings" title="Settings" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
        >
          {/* Appearance */}
          <SectionHeader label="appearance" />
          <View
            style={{
              marginHorizontal: 20,
              backgroundColor: colors.surface,
              borderRadius: 4,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <ThemeSelector />
          </View>

          {/* Import */}
          <SectionHeader label="import" />
          <View
            style={{
              marginHorizontal: 20,
              backgroundColor: colors.surface,
              borderRadius: 4,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <ImportTrigger />
          </View>

          {/* About */}
          <SectionHeader label="about" />
          <View
            style={{
              marginHorizontal: 20,
              backgroundColor: colors.surface,
              borderRadius: 4,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <SettingsRow
              glyph="ℹ"
              glyphColor={colors.textDim}
              label="VibeFlow"
              value="v1.0.0"
              valueColor={colors.textFaint}
            />
          </View>

          <View style={{ marginTop: 32, paddingHorizontal: 20 }}>
            <StatusLine
              segments={[
                { text: 'vibeflow', color: colors.secondary },
                { text: ' · v1.0.0 · android' },
              ]}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SettingsRow({
  glyph,
  glyphColor,
  label,
  value,
  valueColor,
}: {
  glyph: string;
  glyphColor: string;
  label: string;
  value: string;
  valueColor: string;
}) {
  const { colors, fonts } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 }}>
      <Text style={{ fontFamily: fonts.mono, fontSize: 16, color: glyphColor, width: 28 }}>{glyph}</Text>
      <Text style={{ flex: 1, fontFamily: fonts.sans, fontSize: 16, lineHeight: 20, color: colors.text, marginLeft: 12 }}>
        {label}
      </Text>
      <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: valueColor, letterSpacing: 0.5 }}>
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  const { colors } = useTheme();
  return (
    <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 16 }} />
  );
}
