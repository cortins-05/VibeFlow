import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { THEMES, type ThemeName } from '../constants/themes';

const THEME_NAMES: ThemeName[] = ['neon', 'frost', 'industrial'];
const THEME_LABELS: Record<ThemeName, string> = {
  neon: 'neon',
  frost: 'frost',
  industrial: 'industrial',
};

export default function ThemeSelector() {
  const { colors, fonts } = useTheme();
  const themeName = useThemeStore((s) => s.themeName);
  const setTheme = useThemeStore((s) => s.setTheme);
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={{ flexDirection: 'column' }}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 16,
        }}
      >
        <Text style={{ fontFamily: fonts.mono, fontSize: 16, color: colors.textDim, width: 28 }}>
          ⊙
        </Text>
        <Text style={{
          flex: 1,
          fontFamily: fonts.sans,
          fontSize: 16,
          lineHeight: 20,
          color: colors.text,
          marginLeft: 12,
        }}>
          Theme
        </Text>
        <Text style={{
          fontFamily: fonts.mono,
          fontSize: 11,
          color: colors.accent,
          letterSpacing: 0.5,
        }}>
          {THEME_LABELS[themeName]}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <View style={{ paddingBottom: 8 }}>
          {THEME_NAMES.map((name) => {
            const theme = THEMES[name];
            const active = name === themeName;
            return (
              <TouchableOpacity
                key={name}
                onPress={() => { setTheme(name); setExpanded(false); }}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  paddingLeft: 56,
                }}
              >
                <Text style={{
                  fontFamily: fonts.mono,
                  fontSize: 14,
                  color: active ? colors.accent : colors.textDim,
                  width: 20,
                }}>
                  {active ? '◉' : '○'}
                </Text>
                <View style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: theme.colors.accent,
                  marginHorizontal: 10,
                }} />
                <Text style={{
                  fontFamily: fonts.sans,
                  fontSize: 15,
                  color: active ? colors.text : colors.textDim,
                }}>
                  {THEME_LABELS[name]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}
