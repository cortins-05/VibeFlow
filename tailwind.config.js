/** @type {import('tailwindcss').Config} */
// Brutalist Newsprint palette.
// Paper cream + ink black + ONE red accent + yellow highlight.
// Sharp corners, no gradients, heavy rules. Anti-AI editorial.
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Newsprint paper
        paper: {
          DEFAULT: '#f4efe2',
          deep: '#ebe4d2',
          dim: '#dcd3bd',
        },
        // Ink (text + rules + borders)
        ink: {
          DEFAULT: '#111110',
          soft: '#2a2824',
          mid: '#4a4640',
          dim: '#6b675e',
          faint: '#9a948a',
        },
        // ONE action color
        red: {
          DEFAULT: '#c4231a',
          deep: '#8a1812',
        },
        // Editorial highlight
        marker: '#f5d547',

        // -- Aliases so legacy class names still resolve --
        bg: {
          primary: '#f4efe2',
          surface: '#ebe4d2',
          elevated: '#ebe4d2',
          card: '#dcd3bd',
        },
        accent: {
          DEFAULT: '#c4231a',
          dim: '#8a1812',
          glow: 'rgba(196,35,26,0.12)',
        },
        amber: {
          DEFAULT: '#c4231a',
          dim: '#8a1812',
        },
        cream: '#111110',
        text: {
          primary: '#111110',
          secondary: '#4a4640',
          muted: '#6b675e',
          faint: '#9a948a',
        },
        surface: {
          DEFAULT: 'rgba(17,17,16,0.04)',
          hover: 'rgba(17,17,16,0.08)',
          border: '#111110',
          divider: '#111110',
        },
      },
      fontFamily: {
        // Serif editorial display
        serif: ['Fraunces_700Bold'],
        'serif-italic': ['Fraunces_700Bold_Italic'],
        'serif-black': ['Fraunces_900Black'],
        'serif-light': ['Fraunces_400Regular'],
        // Mono captions / labels / numerals
        mono: ['JetBrainsMono_400Regular'],
        'mono-medium': ['JetBrainsMono_500Medium'],

        // -- Aliases for legacy class names --
        display: ['Fraunces_900Black'],
        'display-thin': ['Fraunces_400Regular'],
        sans: ['JetBrainsMono_400Regular'],
        'sans-medium': ['JetBrainsMono_500Medium'],
        'sans-semibold': ['Fraunces_700Bold'],
        'sans-bold': ['Fraunces_900Black'],
      },
    },
  },
  plugins: [],
};
