# Console Redesign + Modular Refactor — Implementation Plan (Plan 1 of 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

---

## ✅ STATUS: COMPLETE (2026-05-28) — read this first

**Plan 1 fully implemented. All 13 tasks done. Branch: `main`. TypeCheck clean. Working tree clean.**

**Commits on `main` (6 ahead of `origin/main`, NOT yet pushed):**
| Commit | Covers |
|--------|--------|
| `ad8f9f3` | baseline checkpoint (pre-existing app state + this plan) |
| `69c3f7d` | Task 1 — theme tokens (`constants/theme.ts` + `tailwind.config.js`) |
| `f7bc9ec` | Task 2 — `components/ui/` primitives + dark root `app/_layout.tsx` |
| `d2d74b3` | Task 3 — hooks `useTrackDownload` + `useLyrics` (verbatim logic) |
| `214ab5b` | Task 4 — split player into `components/player/`, remove vinyl |
| `1db0eb3` | Task 5 — TrackRow reskin |
| `dcac21b` | Tasks 6–12 — bundled: tab bar, MiniPlayer, all screens, playlist, DownloadButton, AddToPlaylistModal |

**Verification done (Task 13):**
- `npx tsc --noEmit` → PASS (whole project).
- `grep -rn` legacy hex in `app/` + `components/` → 0 results (all tokens).
- Backend untouched confirmed via `git diff`: `services/youtube.ts`, `services/db.ts`, `stores/playerStore.ts`, `stores/downloadStore.ts` NOT modified. `app/_layout.tsx` changed only bg color + StatusBar (videoId/event logic intact).

**NOT done (handled by user, not the agent):**
- ⏳ **Device smoke test** (Task 4 Step 9 + Task 13 Step 3): `npx expo run:android` / APK install on Pixel 10. User runs this manually. APK from prior build at `android/app/build/outputs/apk/debug/app-debug.apk` predates this redesign — **a fresh build is required** to see the console UI on device.
- ⏳ **Push to origin** (6 commits ahead). Not pushed — awaiting user decision.

**Deviations from plan (intentional, all fine):**
- `app/player.tsx` ended at **193 lines** (plan target ~150). Acceptable.
- Tasks 6–12 committed as **one bundle** (`dcac21b`) instead of per-task commits — work was done in a resumed session post-context-compaction.
- Some primitives (`Caret`, `ConsoleButton`, `StatusLine`, `Tag`, `ScanlineOverlay`) exist and are used where relevant; `ScanlineOverlay` is built but not yet mounted on any screen (available for future use).

**Next:** Plan 2 — native Android FFT visualizer (see `## Next` at bottom). The `components/player/VisualizerView.tsx` placeholder is the slot to replace.

---

**Goal:** Re-skin the entire VibeFlow app to a futuristic programmer-console / CMD aesthetic (neon-yellow + cyan on dark), and refactor the codebase into clean modular units (UI separated from logic) — with zero change to playback/download behavior.

**Architecture:** Centralize design tokens in `constants/theme.ts` + `tailwind.config.js`. Build reusable console primitives in `components/ui/`. Extract stateful logic out of `app/player.tsx` into `hooks/` (moved verbatim — no behavior change). Split the 772-line player into focused `components/player/` parts. Re-skin every screen using the primitives. The audio visualizer is a placeholder slot here; the real native FFT engine is **Plan 2**.

**Tech Stack:** Expo SDK 56, expo-router, React Native 0.85, NativeWind v4 + Tailwind 3.4, Reanimated 4, Moti, react-native-track-player, JetBrains Mono + Manrope fonts (already installed).

**Verification model:** This project has **no test runner** (no jest). Per task, verification = `npx tsc --noEmit` passes clean + (where noted) visual check on an Android build (`npx expo run:android`). Do **not** invent unit tests for visual components. Commit after each task.

**Untouchable (behavior-preserving only):** `services/youtube.ts`, download pipeline logic, `videoId` matching in `app/_layout.tsx`, skip handlers, `resolveSource()`. Logic may be **moved verbatim** into hooks but never edited. See `docs/superpowers/specs/2026-05-28-console-redesign-fft-visualizer-design.md` and repo `INFORMACION_RELEVANTE.md`.

---

## File Structure (target)

```
constants/theme.ts            # NEW — single source of truth for colors/fonts/spacing/glow
tailwind.config.js            # REWRITE colors+fonts to console palette
components/ui/                # NEW — reusable console primitives
  Caret.tsx                   #   blinking block cursor
  ConsoleHeader.tsx           #   prompt-style screen header
  SectionHeader.tsx           #   [ LABEL ]────[NN]
  Tag.tsx                     #   #chip / bracketed tag
  ConsoleButton.tsx           #   [ label ] button
  StatusLine.tsx              #   mono status row
  ScanlineOverlay.tsx         #   low-opacity CRT overlay
hooks/                        # NEW — extracted logic
  useTrackDownload.ts         #   download state machine (verbatim from player.tsx)
  useLyrics.ts                #   lyric fetch + active-line tracking
components/player/            # NEW — player presentational parts
  TerminalArtwork.tsx         #   framed square cover (NO vinyl)
  ProgressScrub.tsx           #   mono seek bar + timestamps
  PlayerControls.tsx          #   transport row
  SecondaryActions.tsx        #   save / lyrics / download row
  LyricsView.tsx              #   lyrics overlay
  VisualizerView.tsx          #   PLACEHOLDER spectrum (real engine = Plan 2)
app/player.tsx                # SLIM recompose (~150 lines) wiring hooks + parts
components/TrackRow.tsx       # RESKIN
components/MiniPlayer.tsx     # RESKIN → console status line
components/DownloadButton.tsx # RESKIN
components/AddToPlaylistModal.tsx # RESKIN
app/(tabs)/_layout.tsx        # RESKIN console tab bar
app/(tabs)/*.tsx              # RESKIN all screens
app/playlist/[id].tsx         # RESKIN
```

---

## Task 1: Design tokens

**Files:**
- Create: `constants/theme.ts`
- Modify: `tailwind.config.js` (replace `colors` + `fontFamily`)

- [x] **Step 1: Create `constants/theme.ts`**

```ts
// constants/theme.ts — single source of truth for the console theme.
export const COLORS = {
  bg: '#0b0c0b',
  surface: '#121413',
  surface2: '#1a1d1b',
  text: '#e6ebe3',
  textDim: '#6f7a6c',
  textFaint: '#3a423a',
  accent: '#e5ff3a',      // neon yellow — focus/active/primary
  secondary: '#3df5e0',   // cyan — positive/ready states
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
```

- [x] **Step 2: Rewrite `tailwind.config.js` `theme.extend.colors` and `fontFamily`**

Replace the entire `colors: {...}` block and `fontFamily: {...}` block with:

```js
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
```

- [x] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (no errors). The new `theme.ts` is valid TS; tailwind config is JS (not typechecked).

- [x] **Step 4: Commit**

```bash
git add constants/theme.ts tailwind.config.js
git commit -m "feat(theme): console palette tokens (neon yellow + cyan)"
```

---

## Task 2: Console UI primitives

**Files:**
- Create: `components/ui/Caret.tsx`, `ConsoleHeader.tsx`, `SectionHeader.tsx`, `Tag.tsx`, `ConsoleButton.tsx`, `StatusLine.tsx`, `ScanlineOverlay.tsx`

- [x] **Step 1: `components/ui/Caret.tsx`** (blinking block cursor)

```tsx
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { COLORS, glow } from '@/constants/theme';

export default function Caret({ size = 16, color = COLORS.accent }: { size?: number; color?: string }) {
  const op = useSharedValue(1);
  useEffect(() => {
    op.value = withRepeat(withTiming(0, { duration: 530, easing: Easing.steps(1) }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: op.value }));
  return <Animated.View style={[style, { width: size * 0.55, height: size, backgroundColor: color, marginLeft: 4 }, glow(color, 8, 0.5)]} />;
}
```

- [x] **Step 2: `components/ui/ConsoleHeader.tsx`** (prompt-style screen title)

```tsx
import { View, Text } from 'react-native';
import { COLORS, FONTS } from '@/constants/theme';
import Caret from './Caret';

export default function ConsoleHeader({ path, title }: { path: string; title?: string }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.textDim }}>
          vibeflow <Text style={{ color: COLORS.secondary }}>~/{path}</Text> <Text style={{ color: COLORS.accent }}>$</Text>
        </Text>
        <Caret size={13} />
      </View>
      {title ? (
        <Text style={{ fontFamily: FONTS.sansLight, fontSize: 40, lineHeight: 44, color: COLORS.text, marginTop: 6 }}>{title}</Text>
      ) : null}
    </View>
  );
}
```

- [x] **Step 3: `components/ui/SectionHeader.tsx`**

```tsx
import { View, Text } from 'react-native';
import { COLORS, FONTS } from '@/constants/theme';

export default function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12, marginTop: 8 }}>
      <Text style={{ fontFamily: FONTS.monoMed, fontSize: 12, letterSpacing: 2, color: COLORS.accent }}>[ {label.toUpperCase()} ]</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border, marginHorizontal: 10 }} />
      {count != null ? (
        <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textDim }}>[{String(count).padStart(2, '0')}]</Text>
      ) : null}
    </View>
  );
}
```

- [x] **Step 4: `components/ui/Tag.tsx`**

```tsx
import { Text, Pressable } from 'react-native';
import { COLORS, FONTS } from '@/constants/theme';

export default function Tag({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: 1, borderColor: active ? COLORS.borderAccent : COLORS.border,
        backgroundColor: active ? 'rgba(229,255,58,0.08)' : COLORS.surface,
        borderRadius: 4, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8, marginBottom: 8,
      }}
    >
      <Text style={{ fontFamily: FONTS.mono, fontSize: 12, color: active ? COLORS.accent : COLORS.text }}>#{label}</Text>
    </Pressable>
  );
}
```

- [x] **Step 5: `components/ui/ConsoleButton.tsx`**

```tsx
import { Text, Pressable, ViewStyle } from 'react-native';
import { COLORS, FONTS, glow } from '@/constants/theme';

type Variant = 'accent' | 'secondary' | 'ghost' | 'error';
const C: Record<Variant, string> = { accent: COLORS.accent, secondary: COLORS.secondary, ghost: COLORS.textDim, error: COLORS.error };

export default function ConsoleButton({ label, onPress, variant = 'ghost', filled, style }: {
  label: string; onPress?: () => void; variant?: Variant; filled?: boolean; style?: ViewStyle;
}) {
  const c = C[variant];
  return (
    <Pressable
      onPress={onPress}
      style={[{
        borderWidth: 1, borderColor: c, borderRadius: 4, paddingHorizontal: 14, paddingVertical: 9,
        backgroundColor: filled ? c : 'transparent', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      }, filled ? glow(c, 14, 0.5) : null, style]}
    >
      <Text style={{ fontFamily: FONTS.monoMed, fontSize: 12, letterSpacing: 1, color: filled ? COLORS.bg : c }}>[ {label} ]</Text>
    </Pressable>
  );
}
```

- [x] **Step 6: `components/ui/StatusLine.tsx`**

```tsx
import { View, Text, ViewStyle } from 'react-native';
import { COLORS, FONTS } from '@/constants/theme';

export default function StatusLine({ segments, style }: { segments: { text: string; color?: string }[]; style?: ViewStyle }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      {segments.map((s, i) => (
        <Text key={i} style={{ fontFamily: FONTS.mono, fontSize: 11, color: s.color ?? COLORS.textDim }}>
          {i > 0 ? '  ·  ' : ''}{s.text}
        </Text>
      ))}
    </View>
  );
}
```

- [x] **Step 7: `components/ui/ScanlineOverlay.tsx`** (CRT texture, non-interactive)

```tsx
import { View } from 'react-native';

// Cheap CRT scanlines: stack of 2px transparent rows over a faint dark line grid.
export default function ScanlineOverlay({ opacity = 0.04 }: { opacity?: number }) {
  const rows = Array.from({ length: 200 });
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity }}>
      {rows.map((_, i) => (
        <View key={i} style={{ height: 1, marginTop: 2, backgroundColor: '#000' }} />
      ))}
    </View>
  );
}
```

- [x] **Step 8: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [x] **Step 9: Commit**

```bash
git add components/ui
git commit -m "feat(ui): console primitive components"
```

---

## Task 3: Extract logic hooks (behavior-preserving)

**Files:**
- Create: `hooks/useTrackDownload.ts`, `hooks/useLyrics.ts`
- (No screen wiring yet — wired in Task 4.)

- [x] **Step 1: Create `hooks/useTrackDownload.ts` — move the download state machine VERBATIM**

Move the download logic out of `app/player.tsx` unchanged. Copy the exact bodies of `handleDownload`, `handlePauseDownload`, `handleResumeDownload`, the two `useEffect`s that reset/init download state on track change, and the refs. Do **not** alter any string, header, ref, or branch.

```ts
import { useState, useRef, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import { getDownloadUrl } from '@/services/youtube';
import { useDownloadStore } from '@/stores/downloadStore';
import type { Track } from '@/stores/playerStore';

export type DownloadState = 'idle' | 'downloading' | 'pausing' | 'paused' | 'done' | 'error';

export function useTrackDownload(currentTrack: Track | null) {
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadState, setDownloadState] = useState<DownloadState>(
    currentTrack && useDownloadStore.getState().isDownloaded(currentTrack.videoId) ? 'done' : 'idle'
  );
  const downloadResumableRef = useRef<FileSystem.DownloadResumable | null>(null);
  const downloadResumeDataRef = useRef<string | undefined>(undefined);
  const downloadUrlRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    setDownloadState(
      currentTrack && useDownloadStore.getState().isDownloaded(currentTrack.videoId) ? 'done' : 'idle'
    );
    setDownloadProgress(null);
    downloadResumableRef.current = null;
    downloadResumeDataRef.current = undefined;
    downloadUrlRef.current = undefined;
  }, [currentTrack?.videoId]);

  async function handleDownload() {
    if (!currentTrack) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDownloadState('downloading');
    setDownloadProgress(0);
    try {
      const src = await getDownloadUrl(currentTrack.videoId);
      if (!src?.url) { setDownloadState('error'); return; }
      downloadUrlRef.current = src.url;
      const dir = `${FileSystem.documentDirectory}audio/`;
      const safeName = currentTrack.title.replace(/[/\\?%*:|"<>]/g, '_');
      const ext = src.url.includes('.webm') ? '.webm' : '.m4a';
      const destFile = dir + safeName + ext;
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      const callback: FileSystem.DownloadProgressCallback = (data) => {
        if (data.totalBytesExpectedToWrite > 0) setDownloadProgress(data.totalBytesWritten / data.totalBytesExpectedToWrite);
      };
      const resumable = FileSystem.createDownloadResumable(src.url, destFile, src.headers, callback, downloadResumeDataRef.current);
      downloadResumableRef.current = resumable;
      const result = await resumable.downloadAsync();
      if (result?.uri) {
        downloadResumableRef.current = null;
        downloadResumeDataRef.current = undefined;
        setDownloadState('done');
        setDownloadProgress(1);
        if (currentTrack) useDownloadStore.getState().registerDownload(currentTrack, result.uri);
      } else { setDownloadState('error'); }
    } catch (e) {
      const errMsg = (e as Error).message;
      if (errMsg?.includes('cancelled') || errMsg?.includes('pause')) return;
      console.error('[player] download failed:', errMsg);
      setDownloadState('error');
    }
  }

  async function handlePauseDownload() {
    const r = downloadResumableRef.current;
    if (!r) return;
    setDownloadState('pausing');
    try {
      const pauseState = await r.pauseAsync();
      downloadResumeDataRef.current = pauseState.resumeData;
      downloadResumableRef.current = null;
      setDownloadState('paused');
    } catch { setDownloadState('error'); }
  }

  async function handleResumeDownload() {
    if (!currentTrack || !downloadResumeDataRef.current) return;
    setDownloadState('downloading');
    try {
      const dir = `${FileSystem.documentDirectory}audio/`;
      const safeName = currentTrack.title.replace(/[/\\?%*:|"<>]/g, '_');
      const ext = downloadUrlRef.current?.includes('.webm') ? '.webm' : '.m4a';
      const destFile = dir + safeName + ext;
      const callback: FileSystem.DownloadProgressCallback = (data) => {
        if (data.totalBytesExpectedToWrite > 0) setDownloadProgress(data.totalBytesWritten / data.totalBytesExpectedToWrite);
      };
      const resumable = FileSystem.createDownloadResumable(downloadUrlRef.current!, destFile, undefined, callback, downloadResumeDataRef.current);
      downloadResumableRef.current = resumable;
      downloadResumeDataRef.current = undefined;
      const result = await resumable.downloadAsync();
      if (result?.uri) {
        downloadResumableRef.current = null;
        setDownloadState('done');
        setDownloadProgress(1);
        if (currentTrack) useDownloadStore.getState().registerDownload(currentTrack, result.uri);
      } else { setDownloadState('error'); }
    } catch (e) {
      const errMsg = (e as Error).message;
      if (errMsg?.includes('cancelled') || errMsg?.includes('pause')) return;
      console.error('[player] download resume failed:', errMsg);
      setDownloadState('error');
    }
  }

  return { downloadState, downloadProgress, setDownloadState, handleDownload, handlePauseDownload, handleResumeDownload };
}
```

- [x] **Step 2: Create `hooks/useLyrics.ts` — move lyric fetch + active-line tracking**

```ts
import { useState, useEffect } from 'react';
import { fetchLyrics, type LyricLine } from '@/services/lyrics';
import type { Track } from '@/stores/playerStore';

export function useLyrics(currentTrack: Track | null, position: number) {
  const [lyrics, setLyrics] = useState<LyricLine[] | null>(null);
  const [activeLyricIdx, setActiveLyricIdx] = useState(0);

  useEffect(() => {
    if (currentTrack) fetchLyrics(currentTrack.title, currentTrack.artist, currentTrack.duration).then(setLyrics);
  }, [currentTrack?.videoId]);

  useEffect(() => {
    if (!lyrics) return;
    const idx = lyrics.findLastIndex((l) => l.time <= position);
    if (idx !== activeLyricIdx) setActiveLyricIdx(idx);
  }, [position, lyrics]);

  return { lyrics, activeLyricIdx };
}
```

- [x] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: PASS. (Hooks are unused so far — fine.)

- [x] **Step 4: Commit**

```bash
git add hooks/useTrackDownload.ts hooks/useLyrics.ts
git commit -m "refactor(player): extract download + lyrics logic into hooks (verbatim)"
```

---

## Task 4: Split player into parts + slim recompose

**Files:**
- Create: `components/player/TerminalArtwork.tsx`, `ProgressScrub.tsx`, `PlayerControls.tsx`, `SecondaryActions.tsx`, `LyricsView.tsx`, `VisualizerView.tsx`
- Rewrite: `app/player.tsx`

**CRITICAL:** preserve every handler. `handleSkipNext`/`handleSkipPrev` (store queue + `playQueue`), `togglePlayPause`, `handleShuffle`, `handleRepeat`, `handleSeek` stay exactly as in the current `player.tsx`. Only their JSX presentation changes. The vinyl/rotating disc is removed.

- [x] **Step 1: `components/player/TerminalArtwork.tsx`** (framed square, NO vinyl, tappable to toggle visualizer)

```tsx
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, FONTS } from '@/constants/theme';

export default function TerminalArtwork({ uri, size, onPress }: { uri?: string; size: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ width: size, alignSelf: 'center' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 4 }}>
        <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textDim }}>┌─ now_playing ──</Text>
        <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textDim }}>──┐</Text>
      </View>
      <View style={{ width: size, height: size, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, overflow: 'hidden', borderRadius: 4 }}>
        <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" />
      </View>
      <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textFaint, marginTop: 4, textAlign: 'center' }}>tap → visualizer</Text>
    </Pressable>
  );
}
```

- [x] **Step 2: `components/player/VisualizerView.tsx`** (PLACEHOLDER — static bars; real FFT engine = Plan 2)

```tsx
import { View } from 'react-native';
import { COLORS, glow } from '@/constants/theme';

// Placeholder spectrum. Plan 2 replaces internals with real FFT-driven bars.
export default function VisualizerView({ size }: { size: number }) {
  const bars = [0.3, 0.7, 0.45, 0.9, 0.55, 0.8, 0.4, 0.65, 0.5, 0.75, 0.35, 0.85];
  return (
    <View style={{ width: size, height: size, alignSelf: 'center', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 8 }}>
      {bars.map((h, i) => (
        <View key={i} style={[{ flex: 1, marginHorizontal: 2, height: `${h * 100}%`, backgroundColor: COLORS.accent, borderRadius: 2 }, glow(COLORS.accent, 8, 0.4)]} />
      ))}
    </View>
  );
}
```

- [x] **Step 3: `components/player/ProgressScrub.tsx`** (mono seek bar; keeps the responder-based seek)

```tsx
import { View, Text } from 'react-native';
import { COLORS, FONTS, glow } from '@/constants/theme';

function fmt(s: number) { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${m}:${sec.toString().padStart(2, '0')}`; }

export default function ProgressScrub({ position, duration, trackWidth, onSeek }: {
  position: number; duration: number; trackWidth: number; onSeek: (x: number) => void;
}) {
  const ratio = duration > 0 ? position / duration : 0;
  return (
    <View>
      <View
        style={{ height: 32, justifyContent: 'center' }}
        onStartShouldSetResponder={() => true}
        onResponderGrant={(e) => onSeek(e.nativeEvent.locationX)}
        onResponderMove={(e) => onSeek(e.nativeEvent.locationX)}
      >
        <View style={{ height: 2, backgroundColor: COLORS.border, overflow: 'hidden' }}>
          <View style={[{ height: '100%', width: `${ratio * 100}%`, backgroundColor: COLORS.accent }, glow(COLORS.accent, 6, 0.6)]} />
        </View>
        <View style={[{ position: 'absolute', left: `${ratio * 100}%`, marginLeft: -5, top: 11, width: 10, height: 10, backgroundColor: COLORS.accent }, glow(COLORS.accent, 8, 0.7)]} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
        <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.secondary }}>{fmt(position)}</Text>
        <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textDim }}>-{fmt(Math.max(0, duration - position))}</Text>
      </View>
    </View>
  );
}
```

- [x] **Step 4: `components/player/PlayerControls.tsx`**

Props: `{ isPlaying, shuffle, repeat, onShuffle, onPrev, onPlayPause, onNext, onRepeat }`. Render the same 5-control row (Shuffle, SkipBack, Play/Pause, SkipForward, Repeat/Repeat1) using lucide icons. Active color = `COLORS.accent`, inactive = `COLORS.textFaint`. Center play/pause button: square (radius 6) `backgroundColor: COLORS.accent`, icon color `COLORS.bg`, with `glow(COLORS.accent, 24, 0.5)`. Repeat icon shows `Repeat1` when `repeat === RepeatMode.Track` else `Repeat`, accent when `Queue`/`Track`. Wire `onPress` to the passed callbacks (which are the unchanged player handlers).

```tsx
import { View, Pressable } from 'react-native';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1 } from 'lucide-react-native';
import { RepeatMode } from 'react-native-track-player';
import { COLORS, glow } from '@/constants/theme';

export default function PlayerControls(p: {
  isPlaying: boolean; shuffle: boolean; repeat: RepeatMode;
  onShuffle: () => void; onPrev: () => void; onPlayPause: () => void; onNext: () => void; onRepeat: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28 }}>
      <Pressable onPress={p.onShuffle} hitSlop={8} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
        <Shuffle color={p.shuffle ? COLORS.accent : COLORS.textFaint} size={20} strokeWidth={1.8} />
      </Pressable>
      <Pressable onPress={p.onPrev} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
        <SkipBack color={COLORS.text} size={26} fill={COLORS.text} />
      </Pressable>
      <Pressable onPress={p.onPlayPause} style={[{ width: 72, height: 72, borderRadius: 8, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' }, glow(COLORS.accent, 24, 0.5)]}>
        {p.isPlaying ? <Pause color={COLORS.bg} size={28} fill={COLORS.bg} /> : <Play color={COLORS.bg} size={28} fill={COLORS.bg} style={{ marginLeft: 3 }} />}
      </Pressable>
      <Pressable onPress={p.onNext} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
        <SkipForward color={COLORS.text} size={26} fill={COLORS.text} />
      </Pressable>
      <Pressable onPress={p.onRepeat} hitSlop={8} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
        {p.repeat === RepeatMode.Track
          ? <Repeat1 color={COLORS.accent} size={20} strokeWidth={1.8} />
          : <Repeat color={p.repeat === RepeatMode.Queue ? COLORS.accent : COLORS.textFaint} size={20} strokeWidth={1.8} />}
      </Pressable>
    </View>
  );
}
```

- [x] **Step 5: `components/player/SecondaryActions.tsx`**

Props: `{ fav, onToggleFav, hasLyrics, showLyrics, onToggleLyrics, downloadProps }`. Render the Save and Lyrics pills as bracketed `ConsoleButton`s (Save → `secondary` variant when saved, `ghost` otherwise; Lyrics → `accent` when shown). Render `<DownloadButton {...downloadProps} />` (DownloadButton restyled in Task 12). Wire callbacks to the unchanged handlers.

```tsx
import { View } from 'react-native';
import ConsoleButton from '@/components/ui/ConsoleButton';
import DownloadButton from '@/components/DownloadButton';
import type { DownloadState } from '@/hooks/useTrackDownload';

export default function SecondaryActions(p: {
  fav: boolean; onToggleFav: () => void;
  hasLyrics: boolean; showLyrics: boolean; onToggleLyrics: () => void;
  downloadProps: { state: DownloadState; progress: number | null; onDownload: () => void; onPause: () => void; onResume: () => void; onDismiss: () => void };
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24, gap: 8 }}>
      <ConsoleButton label={p.fav ? 'saved' : 'save'} variant={p.fav ? 'secondary' : 'ghost'} filled={p.fav} onPress={p.onToggleFav} />
      {p.hasLyrics ? <ConsoleButton label="lyrics" variant="accent" filled={p.showLyrics} onPress={p.onToggleLyrics} /> : null}
      <DownloadButton {...p.downloadProps} />
    </View>
  );
}
```

- [x] **Step 6: `components/player/LyricsView.tsx`**

Move the lyrics overlay JSX from the current `player.tsx` (the `BlurView` + `ScrollView` + mapped lines). Props: `{ lyrics, activeLyricIdx }`. Keep the auto-scroll: a local `ScrollView` ref + an effect that scrolls to `Math.max(0, activeLyricIdx - 2) * 56` when `activeLyricIdx` changes. Recolor: active line `COLORS.text` + accent marker bar (`COLORS.accent` with `glow`), past lines `COLORS.textFaint`, future lines `COLORS.textDim`. Active line font `FONTS.sans` size 22; others `FONTS.sansReg` size 15.

- [x] **Step 7: Rewrite `app/player.tsx` — slim composition**

Replace the file with a lean version: keep imports for state/handlers; use `useTrackDownload(currentTrack)` and `useLyrics(currentTrack, progress.position)`; keep `togglePlayPause`, `handleSkipNext`, `handleSkipPrev`, `handleShuffle`, `handleRepeat`, `handleSeek` **unchanged**; add `const [visualizerMode, setVisualizerMode] = useState(false)`; compose header + (`visualizerMode ? <VisualizerView/> : showLyrics ? <LyricsView/> : <TerminalArtwork onPress={() => setVisualizerMode(v => !v)}/>`) + title/artist (mono artist, Manrope title) + `<ProgressScrub/>` + `<PlayerControls/>` + `<SecondaryActions/>`. Background: solid `COLORS.bg` (remove the orange `LinearGradient`). Keep the `if (!currentTrack) { router.back(); return null; }` guard.

```tsx
// Key wiring (abridged — keep all 6 handlers verbatim from the old file):
const { downloadState, downloadProgress, setDownloadState, handleDownload, handlePauseDownload, handleResumeDownload } = useTrackDownload(currentTrack);
const { lyrics, activeLyricIdx } = useLyrics(currentTrack, progress.position);
const [showLyrics, setShowLyrics] = useState(false);
const [visualizerMode, setVisualizerMode] = useState(false);
// ...handlers unchanged...
// SecondaryActions downloadProps:
// { state: downloadState, progress: downloadProgress, onDownload: handleDownload, onPause: handlePauseDownload, onResume: handleResumeDownload, onDismiss: () => setDownloadState('idle') }
```

- [x] **Step 8: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 9: Verify on device** (behavior-preserving check) — ⏳ USER RUNS THIS

Run: `npx expo run:android`
Confirm: play/pause, next/prev, shuffle, repeat, seek, favorite, lyrics toggle, and download (start/pause/resume) all still work. Tapping artwork toggles the placeholder visualizer. No vinyl/rotation.

- [x] **Step 10: Commit**

```bash
git add app/player.tsx components/player
git commit -m "refactor(player): split into modular parts + console reskin, remove vinyl"
```

---

## Task 5: TrackRow reskin

**Files:** Modify `components/TrackRow.tsx`

- [x] **Step 1: Reskin to mono columnar row.** Keep the `Props` interface, `formatDuration`, `memo`, and all callbacks/`MotiView` animation **unchanged**. Change only styles/colors: index numeral `FONTS.mono` color `isActive ? COLORS.accent : COLORS.textFaint`; artwork radius 4, bg `COLORS.surface`; active row `borderLeftColor: COLORS.accent` + `backgroundColor: 'rgba(229,255,58,0.05)'` and the overlay Pause icon color `COLORS.accent`; title `FONTS.sans` `COLORS.text`; artist `FONTS.mono` size 11 `COLORS.textDim`; duration `FONTS.mono` `COLORS.textFaint`; favorite Heart active `COLORS.secondary` (saved = positive) else `COLORS.textFaint`; MoreVertical `COLORS.textFaint`. Replace all old hex (`#ff5c2e`, `#f5efe3`, `#5a4d42`, `#a08a78`, `#15110e`) with tokens.

- [x] **Step 2: Verify typecheck** — Run: `npx tsc --noEmit` → PASS.

- [x] **Step 3: Commit**

```bash
git add components/TrackRow.tsx
git commit -m "feat(ui): console reskin TrackRow"
```

---

## Task 6: Console tab bar

**Files:** Modify `app/(tabs)/_layout.tsx`

- [x] **Step 1: Reskin `TabButton` + tab bar container.** Keep the `TABS` array, `Tabs`/`Tabs.Screen` structure, navigation `emit`/`navigate` logic, and `<MiniPlayer/>` **unchanged**. Change presentation: tab bar container `backgroundColor: COLORS.bg`, `borderTopColor: COLORS.border`. Replace each tab's icon+label with a mono bracketed label: focused → `[label]` in `COLORS.accent` with `glow`; unfocused → `label` in `COLORS.textFaint`. Keep the icon optional/small above (size 16, focused `COLORS.accent` else `COLORS.textFaint`) OR drop icons entirely and keep only the bracketed mono label per the console aesthetic. Keep the animated `scale`/`indicator` shared values; recolor indicator bar to `COLORS.accent`.

- [x] **Step 2: Verify typecheck** — `npx tsc --noEmit` → PASS.

- [x] **Step 3: Commit**

```bash
git add "app/(tabs)/_layout.tsx"
git commit -m "feat(ui): console tab bar"
```

---

## Task 7: MiniPlayer → console status line

**Files:** Modify `components/MiniPlayer.tsx`

- [x] **Step 1: Reskin.** Keep `memo`, store/playback hooks, `translateY` spring animation, the `router.push('/player')` press, and the play/pause + `skipToNext` buttons (logic) **unchanged**. Restyle the card: drop the `BlurView`'s warm bg → `backgroundColor: COLORS.surface`, `borderColor: COLORS.border`, radius 6. Title `FONTS.sans` `COLORS.text`; artist `FONTS.mono` `COLORS.textDim`; add a leading mono status glyph `▶`/`❚❚` in `COLORS.accent` reflecting `isPlaying`. Progress bar fill → `COLORS.accent` with `glow`. Optionally append a mono right-side timestamp `position/duration` in `COLORS.secondary`.

- [x] **Step 2: Verify typecheck** — `npx tsc --noEmit` → PASS.

- [x] **Step 3: Commit**

```bash
git add components/MiniPlayer.tsx
git commit -m "feat(ui): MiniPlayer console status line"
```

---

## Task 8: Discover (index) screen

**Files:** Modify `app/(tabs)/index.tsx`

- [x] **Step 1: Reskin using primitives.** Keep ALL data logic unchanged: `loadTrending`, fallback search, `onRefresh`, `toTrack`, `playQueue`, favorites, `AddToPlaylistModal`. Replace presentation:
  - Remove the orange `LinearGradient`; background `COLORS.bg`.
  - Replace the `Discover.` header block with `<ConsoleHeader path="discover" title="Discover" />`.
  - Replace the mood `TouchableOpacity` chips with `<Tag label={mood.label.toLowerCase()} onPress={...} />` (keep the same `router.push` to search with `mood.query`).
  - Replace inline `SectionHeader` function usage with the new `components/ui/SectionHeader` (`label`, `count`). Delete the local `SectionHeader` defined at the bottom of the file.
  - `ActivityIndicator` color → `COLORS.accent`. Error retry button → `<ConsoleButton label="try again" variant="accent" onPress={loadTrending} />`. Error text `COLORS.textDim`.
  - `RefreshControl` tintColor → `COLORS.accent`.
- [x] **Step 2: Verify typecheck** — `npx tsc --noEmit` → PASS.
- [x] **Step 3: Commit**

```bash
git add "app/(tabs)/index.tsx"
git commit -m "feat(ui): console reskin Discover"
```

---

## Task 9: Search screen

**Files:** Modify `app/(tabs)/search.tsx`

- [x] **Step 1: Read the file first**, then reskin keeping all search logic/state/handlers unchanged. Apply: `<ConsoleHeader path="search" />`; search input styled as a console field — `backgroundColor: COLORS.surface`, `borderColor: COLORS.border` (→ `COLORS.borderAccent` on focus), `FONTS.mono` text `COLORS.text`, placeholder `COLORS.textFaint`, leading `>` prompt glyph in `COLORS.accent`; results use the (already reskinned) `TrackRow`; loading `ActivityIndicator` `COLORS.accent`; empty/hint text `COLORS.textDim`.
- [x] **Step 2: Verify typecheck** — `npx tsc --noEmit` → PASS.
- [x] **Step 3: Commit** — `git add "app/(tabs)/search.tsx" && git commit -m "feat(ui): console reskin Search"`

---

## Task 10: Library, Favorites, History, Downloads

**Files:** Modify `app/(tabs)/library.tsx`, `app/(tabs)/favorites.tsx`, `app/(tabs)/history.tsx`, `app/(tabs)/downloads.tsx`

- [x] **Step 1:** For each file: read it, keep all data/logic/handlers unchanged, and apply the console language — background `COLORS.bg`, `<ConsoleHeader path="library|favorites|history|downloads" title=... />`, `components/ui/SectionHeader` for section titles, `TrackRow` for lists, `ConsoleButton`/`Tag` for actions, empty states in `COLORS.textDim` with a mono hint (e.g. `// no favorites yet`). Replace every legacy hex with tokens.
- [x] **Step 2: Verify typecheck** — `npx tsc --noEmit` → PASS.
- [x] **Step 3: Commit** — `git add "app/(tabs)/library.tsx" "app/(tabs)/favorites.tsx" "app/(tabs)/history.tsx" "app/(tabs)/downloads.tsx" && git commit -m "feat(ui): console reskin library/favorites/history/downloads"`

---

## Task 11: Settings screen

**Files:** Modify `app/(tabs)/settings.tsx`

- [x] **Step 1:** Read it, keep all logic. Reskin: `<ConsoleHeader path="settings" title="Settings" />`, rows as mono `key : value` lines with `COLORS.border` dividers, toggles/buttons via `ConsoleButton`. Use `StatusLine` for any app-info/version row (e.g. `vibeflow · v1.0.0 · android`). If a "CRT scanlines" toggle is trivial to add (writes a boolean to existing settings store), add it; otherwise skip (YAGNI).
- [x] **Step 2: Verify typecheck** — `npx tsc --noEmit` → PASS.
- [x] **Step 3: Commit** — `git add "app/(tabs)/settings.tsx" && git commit -m "feat(ui): console reskin Settings"`

---

## Task 12: playlist/[id], DownloadButton, AddToPlaylistModal

**Files:** Modify `app/playlist/[id].tsx`, `components/DownloadButton.tsx`, `components/AddToPlaylistModal.tsx`

- [x] **Step 1: `components/DownloadButton.tsx`** — read it; keep the state-prop API (`state`, `progress`, `onDownload`, `onPause`, `onResume`, `onDismiss`) and all branching unchanged. Reskin each state to tokens: `idle` → `ConsoleButton label="download"` ghost; `downloading`/`paused` → progress bar + `%` in mono (`COLORS.accent` active, `COLORS.secondary` paused) + pause/resume bracket; `done` → `[ saved ✓ ]` in `COLORS.secondary` (filled, glow); `error` → `[ failed · retry ]` in `COLORS.error`; `pausing` → spinner `COLORS.accent`.
- [x] **Step 2: `components/AddToPlaylistModal.tsx`** — read it; keep all logic/props. Reskin modal surface `COLORS.surface`, border `COLORS.border`, mono header `[ add to playlist ]`, list rows mono, create-button `ConsoleButton accent`.
- [x] **Step 3: `app/playlist/[id].tsx`** — read it; keep logic. Apply `ConsoleHeader path="playlist"` + playlist title, `TrackRow` list, `SectionHeader`, token colors.
- [x] **Step 4: Verify typecheck** — `npx tsc --noEmit` → PASS.
- [x] **Step 5: Commit** — `git add app/playlist/\[id\].tsx components/DownloadButton.tsx components/AddToPlaylistModal.tsx && git commit -m "feat(ui): console reskin playlist + download button + add-to-playlist modal"`

---

## Task 13: Full verification pass

- [x] **Step 1: Typecheck clean** — Run: `npx tsc --noEmit` → PASS (no errors across the project).
- [x] **Step 2: Grep for leftover legacy hex** — Run: `grep -rn "#ff5c2e\|#0e0c0a\|#f5efe3\|#a08a78\|#5a4d42\|#e8b67a" app components` → Expected: no results (all migrated to tokens). Fix any stragglers.
- [ ] **Step 3: Device smoke test** — ⏳ USER RUNS THIS. Run: `npx expo run:android`. Walk every tab + player + playlist. Confirm console look is coherent and all playback/download/favorite/lyrics behavior works. Note: the visualizer is still the placeholder (real FFT = Plan 2).
- [x] **Step 4: Final commit (if any stragglers fixed)** — `git add -A && git commit -m "chore(ui): migrate leftover hex to console tokens"`

---

## Self-Review

- **Spec coverage:** §3 tokens → Task 1; §3 motifs/primitives → Task 2; §10 refactor (hooks + player split) → Tasks 3–4; §4 per-screen + §5 player redesign (no vinyl) → Tasks 4–12. §6/§7 native FFT visualizer → **deferred to Plan 2** (placeholder slot delivered in Task 4). §9 verification → per-task `tsc` + Task 13.
- **Untouchable logic:** download state machine moved verbatim (Task 3); player handlers preserved (Task 4 CRITICAL note); youtube.ts/_layout/playerStore not modified.
- **No test runner:** verification adapted to typecheck + device, stated up front.
- **Type consistency:** `DownloadState` exported from `useTrackDownload` and consumed by `SecondaryActions`/`DownloadButton`; `COLORS`/`FONTS`/`glow` names consistent across all tasks.

## Next

Plan 2 (`docs/superpowers/plans/<date>-native-fft-visualizer.md`) builds the Android `audiofx.Visualizer` Expo module + `useAudioSpectrum` hook and replaces `VisualizerView`'s placeholder internals with real FFT-driven Skia bars.
