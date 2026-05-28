// constants/theme.ts — single source of truth for the console theme.
export const COLORS = {
  bg: '#0b0c0b',
  surface: '#121413',
  surface2: '#1a1d1b',
  text: '#e6ebe3',
  textDim: '#6f7a6c',
  textFaint: '#3a423a',
  accent: '#e5ff3a', // neon yellow — focus/active/primary
  secondary: '#3df5e0', // cyan — positive/ready states
  error: '#ff4d4d',
  border: 'rgba(230,235,227,0.08)',
  borderAccent: 'rgba(229,255,58,0.35)',
} as const;

export const FONTS = {
  mono: 'JetBrainsMono_400Regular',
  monoMed: 'JetBrainsMono_500Medium',
  sans: 'Manrope_500Medium',
  sansLight: 'Manrope_300Light',
  sansReg: 'Manrope_400Regular',
} as const;

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

// Neon glow helper for yellow/cyan elements.
export function glow(color: string, radius = 12, opacity = 0.6) {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: 8,
  };
}
