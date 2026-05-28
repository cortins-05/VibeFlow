import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sliders, Trash2, Info, Headphones } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { useState, useEffect } from 'react';
import ConsoleHeader from '../../components/ui/ConsoleHeader';
import SectionHeader from '../../components/ui/SectionHeader';
import StatusLine from '../../components/ui/StatusLine';
import { useTheme } from '../../constants/theme';

export default function SettingsScreen() {
  const { colors, fonts } = useTheme();
  const [cacheSize, setCacheSize] = useState('0.0');

  useEffect(() => {
    calculateCacheSize();
  }, []);

  async function calculateCacheSize() {
    try {
      const dir = (FileSystem.cacheDirectory ?? '') + 'audio/';
      const info = await FileSystem.getInfoAsync(dir);
      if (!info.exists) {
        setCacheSize('0.0');
        return;
      }
      const files = await FileSystem.readDirectoryAsync(dir);
      let total = 0;
      for (const f of files) {
        const fi = await FileSystem.getInfoAsync(dir + f);
        if (fi.exists && (fi as any).size) total += (fi as any).size;
      }
      setCacheSize((total / 1024 / 1024).toFixed(1));
    } catch {
      setCacheSize('—');
    }
  }

  async function clearCache() {
    try {
      const dir = (FileSystem.cacheDirectory ?? '') + 'audio/';
      await FileSystem.deleteAsync(dir, { idempotent: true });
      setCacheSize('0.0');
    } catch {}
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ConsoleHeader path="settings" title="Settings" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
        >
          {/* Audio */}
          <SectionHeader label="audio" />
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
              glyph="≈"
              glyphColor={colors.accent}
              label="Equalizer"
              value="SOON"
              valueColor={colors.textFaint}
            />
            <Divider />
            <SettingsRow
              glyph="◉"
              glyphColor={colors.secondary}
              label="Audio Quality"
              value="HQ · adaptive"
              valueColor={colors.secondary}
            />
          </View>

          {/* Storage */}
          <SectionHeader label="storage" />
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
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 }}>
              <Text style={{ fontFamily: fonts.mono, fontSize: 16, color: colors.textDim, width: 28 }}>⊙</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontFamily: fonts.sans, fontSize: 16, lineHeight: 20, color: colors.text }}>
                  Cache
                </Text>
                <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textDim, marginTop: 2 }}>
                  {cacheSize} MB
                </Text>
              </View>
              <TouchableOpacity
                onPress={clearCache}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textDim }}>
                  [ clear ]
                </Text>
              </TouchableOpacity>
            </View>
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
