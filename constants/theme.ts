import { useThemeStore } from '../stores/themeStore';
import { THEMES, type Theme } from './themes';

export type { ThemeName, ThemeColors, ThemeFonts, Theme } from './themes';
export { THEMES };

export function useTheme(): Theme {
  const themeName = useThemeStore((s) => s.themeName);
  return THEMES[themeName];
}

export const COLORS = THEMES.neon.colors;
export const FONTS = THEMES.neon.fonts;

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

export function glow(color: string, radius = 12, opacity = 0.6) {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: 8,
  };
}
