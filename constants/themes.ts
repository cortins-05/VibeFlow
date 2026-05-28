export type ThemeName = 'neon' | 'frost' | 'industrial';

export interface ThemeColors {
  bg: string;
  surface: string;
  surface2: string;
  text: string;
  textDim: string;
  textFaint: string;
  accent: string;
  secondary: string;
  error: string;
  border: string;
  borderAccent: string;
}

export interface ThemeFonts {
  mono: string;
  monoMed: string;
  sans: string;
  sansLight: string;
  sansReg: string;
}

export interface Theme {
  name: ThemeName;
  label: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
}

export const THEMES: Record<ThemeName, Theme> = {
  neon: {
    name: 'neon',
    label: 'neon',
    colors: {
      bg: '#0b0c0b',
      surface: '#121413',
      surface2: '#1a1d1b',
      text: '#e6ebe3',
      textDim: '#6f7a6c',
      textFaint: '#3a423a',
      accent: '#e5ff3a',
      secondary: '#3df5e0',
      error: '#ff4d4d',
      border: 'rgba(230,235,227,0.08)',
      borderAccent: 'rgba(229,255,58,0.35)',
    },
    fonts: {
      mono: 'JetBrainsMono_400Regular',
      monoMed: 'JetBrainsMono_500Medium',
      sans: 'Manrope_500Medium',
      sansLight: 'Manrope_300Light',
      sansReg: 'Manrope_400Regular',
    },
  },
  frost: {
    name: 'frost',
    label: 'frost',
    colors: {
      bg: '#f5f0eb',
      surface: '#ebe5df',
      surface2: '#e0dad4',
      text: '#1c1c1a',
      textDim: '#6b655f',
      textFaint: '#a09a94',
      accent: '#00bfff',
      secondary: '#800020',
      error: '#cc3333',
      border: 'rgba(28,28,26,0.08)',
      borderAccent: 'rgba(0,191,255,0.35)',
    },
    fonts: {
      mono: 'JetBrainsMono_400Regular',
      monoMed: 'JetBrainsMono_500Medium',
      sans: 'Manrope_500Medium',
      sansLight: 'Manrope_300Light',
      sansReg: 'Manrope_400Regular',
    },
  },
  industrial: {
    name: 'industrial',
    label: 'industrial',
    colors: {
      bg: '#1c1c1c',
      surface: '#242424',
      surface2: '#2a2a2a',
      text: '#e8e6e3',
      textDim: '#8a8a8a',
      textFaint: '#5a5a5a',
      accent: '#ff6b35',
      secondary: '#ffb100',
      error: '#cc3333',
      border: 'rgba(255,107,53,0.15)',
      borderAccent: 'rgba(255,107,53,0.35)',
    },
    fonts: {
      mono: 'IBMPlexMono_400Regular',
      monoMed: 'IBMPlexMono_500Medium',
      sans: 'Inter_500Medium',
      sansLight: 'Inter_300Light',
      sansReg: 'Inter_400Regular',
    },
  },
};
