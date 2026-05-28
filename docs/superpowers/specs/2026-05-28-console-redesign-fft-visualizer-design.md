# VibeFlow — Console UI Redesign + Real FFT Visualizer

**Date:** 2026-05-28
**Status:** Design — pending user review

## 1. Goal

Two deliverables, frontend-only:

1. **Real audio-reactive FFT visualizer** ("equalizer") in the player — bars driven by actual audio output, not simulation.
2. **Total UI redesign** of the whole app into a futuristic programmer-console / CMD aesthetic with a neon-yellow accent. Bold and unconventional — a music player that looks nothing like the usual.

## 2. Hard Constraints

**Backend / playback logic is UNTOUCHABLE.** Reverse-engineered, hard-won. Do NOT modify:
- `services/youtube.ts` — stream resolution, `getBasicInfo`, `ANDROID_VR` client cascade, download URL pipeline, client headers.
- Download pipeline in `app/player.tsx` handlers (`handleDownload` / pause / resume, resumeData refs, `.webm`/`.m4a` logic).
- `videoId` matching in `app/_layout.tsx` `PlaybackActiveTrackChanged`.
- Skip handlers using store queue + `playQueue()` in `player.tsx`.
- `resolveSource()` local-path-first logic in `stores/playerStore.ts`.
- `services/db.ts`, `services/trackPlayerService.ts`, all store *logic* (download/library/player).

Changes are limited to **styles, markup, layout, the new visualizer, and behavior-preserving refactoring** (see §11). The reverse-engineered logic may be **relocated/extracted into cleaner modules but never edited** — moved verbatim. "Don't touch backend" means don't change *behavior*; reorganizing where it lives is allowed and wanted, as long as it works identically (verified by typecheck + device).

**Platform:** Android-only sideload. iOS path is a no-op. Native pieces require a local build (`expo run:android`) — they cannot be verified in a JS-only run.

**Remove:** the spinning vinyl/disc artwork in the player. It does not read as "console." No rotation, no circular disc.

## 3. Design System (the "CMD futurista" language)

### Palette (dark, neutral-cool — replaces the warm browns)
| Token | Hex | Use |
|---|---|---|
| `bg` | `#0b0c0b` | app background (near-black) |
| `surface` | `#121413` | cards, rows |
| `surface2` | `#1a1d1b` | raised surfaces, inputs |
| `text` | `#e6ebe3` | primary text |
| `textDim` | `#6f7a6c` | secondary text |
| `textFaint` | `#3a423a` | tertiary, disabled |
| `accent` (neon yellow) | `#e5ff3a` | focus, active, primary actions, prompts, caret |
| `secondary` (cyan) | `#3df5e0` | positive/ready states (SAVED ✓, READY, favorited, online) |
| `error` | `#ff4d4d` | errors/alarms only |
| `border` | `rgba(230,235,227,0.08)` | neutral subtle; switches to accent on focus |

Neon glow: yellow elements get soft text/box-shadow glow; cyan glow on positive states. Exact yellow `#e5ff3a` is tweakable.

### Typography (both already installed)
- **JetBrains Mono** — labels, data, numbers, timestamps, prompts, section headers, track meta, status lines. The console feel.
- **Manrope** (display sans) — large titles and long-form body (lyrics) where mono would fatigue.

### Console motifs
- **Prompt headers** per screen: `vibeflow ~/discover $` + blinking block caret (yellow).
- **Section headers**: mono with brackets/rule lines, e.g. `[ TRENDING ]────────[12]`.
- **TrackRow**: columnar mono — `01 │ [art] │ title / artist │ 4:03`. Active row marked with `▶` + yellow.
- **Tab bar**: console style — mono labels `[discover] [search] [library] [settings]`, active bracketed with yellow caret/underline. Icons minimized or dropped.
- **MiniPlayer → status line**: now-playing as a console status bar — `▶ PLAYING · 1:23 / 4:03 · ONLINE` (cyan/yellow), sits above the tab bar.
- **Chips** (moods): tags `#chill #focus #hype`.
- **Buttons/chips**: bracketed `[ play ]`, small radius (4–6px), no 999 pills.
- **CRT texture**: very low-opacity scanline/grid overlay behind content (static, cheap). Optional toggle in settings.

## 4. Per-Screen Plan (all frontend, logic preserved)

Global:
- New theme tokens module `constants/theme.ts` (colors, spacing, glow helpers). Wire into `tailwind.config.js` colors + reused in inline styles.
- Font registration unchanged (already loaded in `app/_layout.tsx`).

Screens & components restyled to the console language:
- `app/(tabs)/_layout.tsx` — console tab bar.
- `components/MiniPlayer.tsx` — console now-playing status line.
- `components/TrackRow.tsx` — mono columnar row.
- `app/(tabs)/index.tsx` (Discover), `search.tsx`, `library.tsx`, `favorites.tsx`, `history.tsx`, `downloads.tsx`, `settings.tsx`.
- `app/playlist/[id].tsx`.
- `components/DownloadButton.tsx`, `components/AddToPlaylistModal.tsx`.
- `app/player.tsx` — full console redesign (see §5).

## 5. Player Redesign + Visualizer UX

- **No vinyl.** Default artwork: square cover inside a "terminal window" frame — title bar like `┌─ now_playing ──────────┐`, bracketed corners, no rotation.
- Track title (Manrope display) + artist/meta in mono. Progress bar as a mono scrub with `[####----]`-style fill or thin neon line + mono timestamps. Controls bracketed/console-styled. All existing handlers (play/pause, skip, shuffle, repeat, fav, lyrics, download) preserved.
- **Immersive visualizer mode** (chosen option C): tapping the artwork toggles `visualizerMode` (same pattern as the lyrics toggle). The framed artwork fades out; a full-bleed Skia spectrum fills the center.
  - Bars: vertical, neon-yellow with cyan tips/glow, bottom-anchored, smooth decay (gradual fall).
  - FFT capture runs ONLY when `visualizerMode` is ON **and** playing → released otherwise (battery).

## 6. Native FFT Module

**Approach:** custom local Expo native module (chosen over npm libs — old-arch/unmaintained — and over simulation — user wants real FFT).

- **Module:** local Expo module (e.g. `modules/audio-spectrum`), name `AudioSpectrum`.
- **Android (Kotlin):** `android.media.audiofx.Visualizer` on **audio session 0** (global output mix) — avoids depending on RNTP's session id. `setCaptureSize(512/1024)`, `setDataCaptureListener` → `onFftDataCapture`. Convert FFT bytes → magnitude → downsample to **N bands (start 32)** → emit `onSpectrum { bands: number[] }` throttled to ~**30fps**.
- **Permission:** `RECORD_AUDIO` (required for session-0 Visualizer). Add to manifest (app.json `android.permissions` / config plugin) + request at runtime before enabling.
- **Lifecycle:** `enable()` creates Visualizer + listener; `disable()`/release on unmount or when visualizer mode is off. Never capture when not visible.
- **iOS:** no-op stub.
- **JS API:** `useAudioSpectrum()` hook subscribes to native events and writes the latest band array into a Reanimated `useSharedValue` (keeps high-freq data off React render + off Zustand).

## 7. Data Flow

`Visualizer(session 0)` → FFT bytes → Kotlin band reduction → Expo event `onSpectrum {bands}` (~30fps) → JS hook → `useSharedValue` → Skia `useDerivedValue` builds Path → renders at 60fps on the UI thread. No Zustand involvement for spectrum data. Enable/disable gated by player `visualizerMode` + playing state.

`components/AudioVisualizer.tsx` is rewritten: keep the Skia canvas, replace the random-phase simulation with consumption of the shared-value band array.

## 8. Risks / Spikes

- **Spike #1 — session-0 capture:** some devices/Android versions block global-mix capture. Fallback chain: try RNTP audio session id if exposed → else show "visualizer unavailable" + simulated mode. Validate first on a real build.
- **Permission UX:** `RECORD_AUDIO` prompt must be explained (it's for the visualizer, not recording).
- **Bridge perf:** 30fps band arrays via Expo events should be fine with shared values; if janky, downsample further or move to JSI/Nitro (nitro-modules already present).

## 9. Verification

- TypeCheck must stay clean (`tsc`).
- UI redesign: visually verify each screen on an Android build/device.
- **Visualizer reactivity is only verifiable on an APK build on a device** — not in a JS-only run. This will be stated explicitly; no false "it works" claims without a device check.

## 10. Architecture & Refactoring

This restructure is also a chance to clean up. Goal: **coherent logical units, UI separated from logic, focused files, reusable + scalable.** No giant files mixing UI + state machines.

**Rule:** any move of reverse-engineered/playback/download logic is **behavior-preserving** — relocate verbatim, do not edit the logic. Verify identical behavior via typecheck + device run.

Target structure:
- `constants/theme.ts` — palette, type, spacing, glow helpers (single source of truth).
- `components/ui/` — reusable console primitives: `ConsoleHeader` (prompt + blinking caret), `SectionHeader`, `Tag`/`Bracket`, `ConsoleButton`, `StatusLine`, `ScanlineOverlay`, `Caret`. Used across all screens.
- `components/player/` — split the 772-line `player.tsx` into focused presentational parts: `TerminalArtwork` (framed cover, no vinyl), `ProgressScrub`, `PlayerControls`, `SecondaryActions`, `LyricsView`, `VisualizerView`.
- `hooks/` — extract stateful/imperative logic out of screens:
  - `useTrackDownload.ts` — the full download state machine + resumeData/url refs + handlers, **moved verbatim** from `player.tsx`.
  - `useAudioSpectrum.ts` — native spectrum subscription → shared value.
  - `useLyrics.ts` — lyric fetch + active-line tracking (extracted from `player.tsx`).
- `modules/audio-spectrum/` — native Expo module (Kotlin + JS bindings).
- Stores stay the logic/state layer; screens become thin, composing hooks + `components/ui` + feature components.

Outcome: `player.tsx` becomes a lean composition (~150 lines) wiring hooks to presentational components; screens reuse shared console primitives instead of duplicating inline styles.

## 11. Out of Scope (YAGNI)

- iOS visualizer.
- Real DSP equalizer that *changes* the sound (bands/presets) — not requested; this is a visualizer.
- Radial/alternate visualizer layouts (vertical bars first; revisit later).
- Any backend/playback/download logic change.
