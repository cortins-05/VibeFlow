# Theme Selector — Design Spec

## Overview

Add 3 switchable themes to VibeFlow with an inline dropdown on the Settings screen. Zero restart required — theme changes instantly.

## Architecture

### Theme Definitions → `constants/themes.ts`

Three complete theme objects, each containing all `COLORS` + `FONTS` keys.

#### Theme 1: `neon` (current — unchanged)
| Key | Value |
|-----|-------|
| bg | `#0b0c0b` |
| surface | `#121413` |
| surface2 | `#1a1d1b` |
| text | `#e6ebe3` |
| textDim | `#6f7a6c` |
| textFaint | `#3a423a` |
| accent | `#e5ff3a` |
| secondary | `#3df5e0` |
| error | `#ff4d4d` |
| border | `rgba(230,235,227,0.08)` |
| borderAccent | `rgba(229,255,58,0.35)` |
| mono | JetBrainsMono_400Regular |
| monoMed | JetBrainsMono_500Medium |
| sans | Manrope_500Medium |
| sansLight | Manrope_300Light |
| sansReg | Manrope_400Regular |

#### Theme 2: `frost` (light variant)
| Key | Value |
|-----|-------|
| bg | `#f5f0eb` |
| surface | `#ebe5df` |
| surface2 | `#e0dad4` |
| text | `#1c1c1a` |
| textDim | `#6b655f` |
| textFaint | `#a09a94` |
| accent | `#00bfff` |
| secondary | `#800020` |
| error | `#cc3333` |
| border | `rgba(28,28,26,0.08)` |
| borderAccent | `rgba(0,191,255,0.35)` |
| mono | JetBrainsMono_400Regular |
| monoMed | JetBrainsMono_500Medium |
| sans | Manrope_500Medium |
| sansLight | Manrope_300Light |
| sansReg | Manrope_400Regular |

#### Theme 3: `industrial` (brutalist)
| Key | Value |
|-----|-------|
| bg | `#1c1c1c` |
| surface | `#242424` |
| surface2 | `#2a2a2a` |
| text | `#e8e6e3` |
| textDim | `#8a8a8a` |
| textFaint | `#5a5a5a` |
| accent | `#ff6b35` |
| secondary | `#ffb100` |
| error | `#cc3333` |
| border | `rgba(255,107,53,0.15)` |
| borderAccent | `rgba(255,107,53,0.35)` |
| mono | IBMPlexMono_400Regular |
| monoMed | IBMPlexMono_500Medium |
| sans | Inter_500Medium |
| sansLight | Inter_300Light |
| sansReg | Inter_400Regular |

### Theme Store → `stores/themeStore.ts`

Zustand store with persist middleware:

```ts
type ThemeName = 'neon' | 'frost' | 'industrial';

interface ThemeStore {
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
}
```

- Persisted to AsyncStorage (key: `vibeflow-theme`)
- `partialize` — only persist `themeName`
- On error/undefined → default to `'neon'`

### Hook → `constants/theme.ts` modification

Replace the static exports with a reactive hook:

```ts
export function useTheme() {
  const themeName = useThemeStore((s) => s.themeName);
  return THEMES[themeName]; // { colors: COLORS, fonts: FONTS }
}
```

Keep `THEMES` export for direct access when needed.

### Font Loading → `app/_layout.tsx`

Add Inter + IBMPlexMono to the existing font loading so Industrial theme fonts are available at runtime. Load all fonts unconditionally at startup (negligible size impact).

```ts
import { Inter_300Light, Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
```

## Theme Conversion (26 files)

Every file that imports `COLORS` / `FONTS` from `constants/theme` changes to:

```ts
// Before
import { COLORS, FONTS } from '../../constants/theme';
...
<View style={{ backgroundColor: COLORS.bg }}>
<Text style={{ fontFamily: FONTS.sans, color: COLORS.text }}>

// After
import { useTheme } from '../../constants/theme';
...
const { colors, fonts } = useTheme();
...
<View style={{ backgroundColor: colors.bg }}>
<Text style={{ fontFamily: fonts.sans, color: colors.text }}>
```

**Mechanized migration**: one-by-one, each file verified by `npx tsc --noEmit` after every 3-5 files. Any missed reference → TS error caught immediately. This is the "error-proof" guarantee.

### Files to migrate
1. `app/_layout.tsx`
2. `app/player.tsx`
3. `app/(tabs)/_layout.tsx`
4. `app/(tabs)/index.tsx`
5. `app/(tabs)/search.tsx`
6. `app/(tabs)/library.tsx`
7. `app/(tabs)/favorites.tsx`
8. `app/(tabs)/history.tsx`
9. `app/(tabs)/downloads.tsx`
10. `app/(tabs)/settings.tsx`
11. `app/playlist/[id].tsx`
12. `components/TrackActionsModal.tsx`
13. `components/TrackRow.tsx`
14. `components/DownloadButton.tsx`
15. `components/MiniPlayer.tsx`
16. `components/player/TerminalArtwork.tsx`
17. `components/player/LyricsView.tsx`
18. `components/player/VisualizerView.tsx`
19. `components/player/ProgressScrub.tsx`
20. `components/player/PlayerControls.tsx`
21. `components/player/QueuePanel.tsx`
22. `components/ui/ConsoleHeader.tsx`
23. `components/ui/SectionHeader.tsx`
24. `components/ui/StatusLine.tsx`
25. `components/ui/ConsoleButton.tsx`
26. `components/ui/Tag.tsx`
27. `components/ui/Caret.tsx`

## Settings UI: Theme Selector Inline

Added as a new "Appearance" section before the existing "Audio" section.

```
┌─────────────────────────────────────┐
│  ◎  Theme                     neon  │  ← tap to expand
│─────────────────────────────────────│
│  ◉  neon                           │  ← selected
│  ○  frost                          │
│  ○  industrial                     │
└─────────────────────────────────────┘
```

Behavior:
- Row shows glyph `◎`, label "Theme", current theme name in `valueColor`
- Tap row → expands 3 options below with `◉`/`○` radio indicators
- Each option shows a tiny color swatch of its accent color (5×5 circle) + name
- Tap an option → updates store, collapses
- Uses same `Animated` / `LayoutAnimation` as the console aesthetic (simple, no gesture)
- The expanded row uses `overflow: 'hidden'` with animated height

## Error Handling

- **AsyncStorage fails**: Zustand persist catches → falls back to default `'neon'`
- **Font not loaded**: fonts are loaded at splash screen, all themes reference preloaded fonts → never an issue
- **Store undefined**: `useThemeStore` uses `'neon'` as initial state
- **Migration miss**: TS strict mode catches any un-migrated `COLORS.xxx` because `COLORS` no longer exists as a direct export
