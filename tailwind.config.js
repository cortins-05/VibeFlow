/** @type {import('tailwindcss').Config} */
// Console / CMD palette.
// Dark neutral-cool base + neon yellow accent + cyan secondary.
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0b0c0b', surface: '#121413', elevated: '#1a1d1b' },
        surface: { DEFAULT: '#121413', raised: '#1a1d1b' },
        text: { DEFAULT: '#e6ebe3', dim: '#6f7a6c', faint: '#3a423a' },
        accent: { DEFAULT: '#e5ff3a', glow: 'rgba(229,255,58,0.12)' },
        secondary: { DEFAULT: '#3df5e0' },
        error: '#ff4d4d',
        // legacy aliases kept so any leftover class still resolves to the new theme
        cream: '#e6ebe3',
        amber: { DEFAULT: '#3df5e0', dim: '#2bbfae' },
      },
      fontFamily: {
        mono: ['JetBrainsMono_400Regular'],
        'mono-medium': ['JetBrainsMono_500Medium'],
        sans: ['Manrope_400Regular'],
        'sans-medium': ['Manrope_500Medium'],
        display: ['Manrope_300Light'],
      },
    },
  },
  plugins: [],
};
