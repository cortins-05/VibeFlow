# Theme Selector Implementation Plan

> **STATUS: ✅ COMPLETED (2026-05-28)** — All 6 tasks implemented on `main`. See commits: `2a517bc` (ThemeSelector), `a0fc68c` (useTheme + fonts), `27ea7b6` (app/ migration), `dce3dea` (components/ migration).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 3 switchable themes (neon, frost, industrial) with an inline dropdown on the Settings screen.

**Architecture:** Zustand store (`themeName` persisted to AsyncStorage) → reactive `useTheme()` hook exported from `constants/theme.ts` → all 26 components destructure `{ colors, fonts }` from the hook. Fonts (Inter, IBMPlexMono) loaded at splash screen alongside existing fonts.

**Tech Stack:** Zustand + persist, expo-font + @expo-google-fonts, react-native Animated for dropdown expand

---

### Task 1: Install fonts + create theme definitions and store

**Files:**
- Install: `@expo-google-fonts/inter`, `@expo-google-fonts/ibm-plex-mono`
- Create: `constants/themes.ts`
- Create: `stores/themeStore.ts`

- [ ] **Step 1: Install Inter and IBMPlexMono fonts**

```bash
npx expo install @expo-google-fonts/inter @expo-google-fonts/ibm-plex-mono
```

- [ ] **Step 2: Create `constants/themes.ts` with all 3 theme definitions**

```ts
import type { TextStyle } from 'react-native';

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
```

- [ ] **Step 3: Create `stores/themeStore.ts`**

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ThemeName } from '../constants/themes';

interface ThemeStore {
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      themeName: 'neon',
      setTheme: (name) => set({ themeName: name }),
    }),
    {
      name: 'vibeflow-theme',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ themeName: state.themeName }),
    },
  ),
);
```

- [ ] **Step 4: Commit**

```bash
git add constants/themes.ts stores/themeStore.ts package.json
git commit -m "feat: add theme definitions and theme store"
```

---

### Task 2: Modify `constants/theme.ts` to export `useTheme()` + update `_layout.tsx` font loading

**Files:**
- Modify: `constants/theme.ts`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Rewrite `constants/theme.ts` to export reactive hook**

```ts
import { useThemeStore } from '../stores/themeStore';
import { THEMES, type Theme } from './themes';

export type { ThemeName, ThemeColors, ThemeFonts, Theme } from './themes';
export { THEMES };

export function useTheme(): Theme {
  const themeName = useThemeStore((s) => s.themeName);
  return THEMES[themeName];
}

// Static defaults for direct imports (backward compat for files not yet migrated)
import { COLORS as _defaultColors, FONTS as _defaultFonts } from './themes';
export const COLORS = THEMES.neon.colors;
export const FONTS = THEMES.neon.fonts;
```

- [ ] **Step 2: Update `app/_layout.tsx` — add Inter + IBMPlexMono imports and font loading**

Add these imports:

```ts
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
} from '@expo-google-fonts/inter';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono';
```

Add to the `useFonts` object:

```ts
const [fontsLoaded] = useFonts({
  Fraunces_400Regular,
  Fraunces_700Bold,
  Fraunces_700Bold_Italic,
  Fraunces_900Black,
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
});
```

- [ ] **Step 3: Run TS check**

```bash
npx tsc --noEmit
```

Expected: OK (no errors from the new files; existing COLORS/FONTS imports still resolve to the static fallback exports)

- [ ] **Step 4: Commit**

```bash
git add app/_layout.tsx constants/theme.ts
git commit -m "feat: reactive useTheme() hook + new fonts loaded"
```

---

### Task 3: Migrate `app/` route files to `useTheme()`

**Files (11):**
- Modify: `app/_layout.tsx`
- Modify: `app/player.tsx`
- Modify: `app/(tabs)/_layout.tsx`
- Modify: `app/(tabs)/index.tsx`
- Modify: `app/(tabs)/search.tsx`
- Modify: `app/(tabs)/library.tsx`
- Modify: `app/(tabs)/favorites.tsx`
- Modify: `app/(tabs)/history.tsx`
- Modify: `app/(tabs)/downloads.tsx`
- Modify: `app/(tabs)/settings.tsx`
- Modify: `app/playlist/[id].tsx`

**Pattern for each file:**

```ts
// Before:
import { COLORS, FONTS } from '../../constants/theme';
// ...inside component:
<View style={{ backgroundColor: COLORS.bg, flex: 1 }}>
<Text style={{ fontFamily: FONTS.sans, fontSize: 28, color: COLORS.text }}>

// After:
import { useTheme } from '../../constants/theme';
// ...inside component, first line:
const { colors, fonts } = useTheme();
// ...replace COLORS.xxx -> colors.xxx, FONTS.xxx -> fonts.xxx:
<View style={{ backgroundColor: colors.bg, flex: 1 }}>
<Text style={{ fontFamily: fonts.sans, fontSize: 28, color: colors.text }}>
```

Files that import `glow` keep it as-is (it takes color strings directly, not the COLORS object).

- [ ] **Step 1: Migrate `app/_layout.tsx`**

Remove `COLORS` import from `../../constants/theme`. It currently imports `{ COLORS }` — change to `{ useTheme }`. Inside the component, add `const { colors } = useTheme()` and replace `COLORS.bg` → `colors.bg`.

- [ ] **Step 2: Migrate `app/(tabs)/_layout.tsx`**

Change import `{ COLORS, FONTS, glow }` → `{ useTheme }`. Add `const { colors, fonts } = useTheme()`. Replace `COLORS.accent` → `colors.accent`, `COLORS.bg` → `colors.bg`, `FONTS.mono` → `fonts.mono`, `glow(COLORS.accent, ...)` → `glow(colors.accent, ...)`.

- [ ] **Step 3: Migrate `app/(tabs)/index.tsx`** — same pattern: import `{ useTheme }`, destructure `{ colors, fonts }`, replace references.

- [ ] **Step 4: Migrate `app/(tabs)/search.tsx`** — same pattern.

- [ ] **Step 5: Migrate `app/(tabs)/library.tsx`** — same pattern. Uses `glow(COLORS.accent, ...)` too → `glow(colors.accent, ...)`.

- [ ] **Step 6: Migrate `app/(tabs)/favorites.tsx`** — same pattern.

- [ ] **Step 7: Migrate `app/(tabs)/history.tsx`** — same pattern.

- [ ] **Step 8: Migrate `app/(tabs)/downloads.tsx`** — same pattern.

- [ ] **Step 9: Migrate `app/(tabs)/settings.tsx`** — same pattern.

- [ ] **Step 10: Migrate `app/player.tsx`** — same pattern. Uses `glow(COLORS.accent, ...)` too.

- [ ] **Step 11: Migrate `app/playlist/[id].tsx`** — same pattern. Uses `glow(COLORS.accent, ...)` too.

- [ ] **Step 12: Run TS check**

```bash
npx tsc --noEmit
```

Expected: OK. No remaining `COLORS.xxx` or `FONTS.xxx` references in `app/` directory. If errors, fix and repeat.

- [ ] **Step 13: Commit**

```bash
git add app/
git commit -m "feat: migrate app/ routes to useTheme() hook"
```

---

### Task 4: Migrate `components/` files to `useTheme()`

**Files (16):**
- Modify: `components/TrackActionsModal.tsx`
- Modify: `components/TrackRow.tsx`
- Modify: `components/DownloadButton.tsx`
- Modify: `components/MiniPlayer.tsx`
- Modify: `components/player/TerminalArtwork.tsx`
- Modify: `components/player/LyricsView.tsx`
- Modify: `components/player/VisualizerView.tsx`
- Modify: `components/player/ProgressScrub.tsx`
- Modify: `components/player/PlayerControls.tsx`
- Modify: `components/player/QueuePanel.tsx`
- Modify: `components/ui/ConsoleHeader.tsx`
- Modify: `components/ui/SectionHeader.tsx`
- Modify: `components/ui/StatusLine.tsx`
- Modify: `components/ui/ConsoleButton.tsx`
- Modify: `components/ui/Tag.tsx`
- Modify: `components/ui/Caret.tsx`

**Pattern (identical to Task 3 for each file):**

```ts
// Before:
import { COLORS, FONTS, glow } from '../constants/theme';
// ...inside component render:
<View style={{ backgroundColor: COLORS.bg }}>

// After:
import { useTheme } from '../../constants/theme';
// ...inside component, first line of render:
const { colors, fonts } = useTheme();
// ...replace:
<View style={{ backgroundColor: colors.bg }}>
```

Note on glow: used in `ConsoleButton.tsx`, `Caret.tsx`, `PlayerControls.tsx`, `ProgressScrub.tsx`, `MiniPlayer.tsx`, `VisualizerView.tsx`, library, tab layout, player, playlist — anywhere `glow(COLORS.accent, ...)` appears, change to `glow(colors.accent, ...)`.

Note on imports path: components use `../../constants/theme` (from components/player/) or `../constants/theme` (from components/ or components/ui/). Keep the relative path as-is, just change the named import.

- [ ] **Step 1: Migrate `components/player/` files** — TerminalArtwork, LyricsView, VisualizerView, ProgressScrub, PlayerControls, QueuePanel (6 files)

- [ ] **Step 2: Migrate `components/ui/` files** — ConsoleHeader, SectionHeader, StatusLine, ConsoleButton, Tag, Caret (6 files)

- [ ] **Step 3: Migrate `components/` root files** — TrackActionsModal, TrackRow, DownloadButton, MiniPlayer (4 files)

- [ ] **Step 4: Run TS check**

```bash
npx tsc --noEmit
```

Expected: OK. If errors, fix (likely missed COLORS.xxx reference).

- [ ] **Step 5: Commit**

```bash
git add components/
git commit -m "feat: migrate components/ to useTheme() hook"
```

---

### Task 5: Add ThemeSelector inline dropdown + Settings Appearance section

**Files:**
- Create: `components/ThemeSelector.tsx`
- Modify: `app/(tabs)/settings.tsx`

- [ ] **Step 1: Create `components/ThemeSelector.tsx`**

```tsx
import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
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
        <Text style={{ fontFamily: fonts.mono, fontSize: 16, color: colors.textDim, width: 28 }}>⊙</Text>
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
```

- [ ] **Step 2: Update `app/(tabs)/settings.tsx`**

Import `ThemeSelector` from `../../components/ThemeSelector`. Add an "Appearance" section before the existing "Audio" section:

```tsx
<SectionHeader label="appearance" />
<View style={{
  marginHorizontal: 20,
  backgroundColor: colors.surface,
  borderRadius: 4,
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: colors.border,
}}>
  <ThemeSelector />
</View>
```

Import change: `import { COLORS, FONTS }` → `import { useTheme }` + `const { colors, fonts } = useTheme()` already done in Task 3.

- [ ] **Step 3: Run TS check**

```bash
npx tsc --noEmit
```

Expected: OK.

- [ ] **Step 4: Commit**

```bash
git add components/ThemeSelector.tsx app/(tabs)/settings.tsx
git commit -m "feat: add ThemeSelector inline dropdown in Settings"
```

---

### Task 6: Final verification

- [ ] **Step 1: Run TS check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2: Build production bundle**

```bash
npx expo export --platform android
```

Or just verify no Metro bundler errors.

- [ ] **Step 3: Final commit if any fixes were needed**

```bash
git add -A && git commit -m "fix: theme selector TS and build fixes"
```
