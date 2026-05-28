# VibeFlow — Project Context

## Expo
- SDK 56 — read exact docs at https://docs.expo.dev/versions/v56.0.0/ before writing code.
- `react-native-track-player` for audio. Uses `resolveSource()` in playerStore to switch between local file (download) and streaming URL.
- Reanimated + Moti for animations.
- react-native-gesture-handler v2 for swipe gestures. `GestureHandlerRootView` already at root layout. `Swipeable` component from `react-native-gesture-handler/Swipeable` works with `renderLeftActions` / `renderRightActions`.
- expo-router for navigation (file based). Tabs in `app/(tabs)/`, modal routes at `app/player.tsx`, `app/playlist/[id].tsx`.
- expo-sharing available for file sharing (already in dependencies).

## Required Skills
- **brainstorming** — before any creative/feature work
- **systematic-debugging** — before fixing any bug
- **test-driven-development** — before implementing anything new
- **requesting-code-review** — when completing tasks, before merge

## Build & Deploy
```sh
npx expo prebuild --no-install    # if Gradle changes needed
cd android && ./gradlew app:createBundleReleaseJsAndAssets app:assembleRelease
adb install -r android/app/build/outputs/apk/release/app-release.apk
cp android/app/build/outputs/apk/release/app-release.apk ~/Projects/APKs/
```
`gradlew` lives in `android/` not project root. For debug: `npx expo run:android`.

## Project Structure
- `app/(tabs)/` — tab screens (index=discover, search, library, favorites, history, downloads, settings)
- `app/player.tsx` — full-screen player (modal)
- `app/playlist/[id].tsx` — playlist detail
- `components/` — shared UI: TrackRow, TrackActionsModal, SectionHeader, ConsoleHeader
- `components/player/` — player-specific: TerminalArtwork, LyricsView, ProgressScrub, PlayerControls, SecondaryActions, QueuePanel
- `stores/` — Zustand stores: playerStore, libraryStore, downloadStore
- `services/` — db (SQLite), **youtube.ts** (primary), **youtubeRest.ts** (fallback), trackPlayerService

## YouTube Services — 3-Layer Fallback Architecture

### Layer 1: `youtube.ts` (Primary — youtubei.js library)
- Uses `Innertube.create()` + `yt.getBasicInfo(videoId, { client })` 
- Client cascade: ANDROID_VR → TV_EMBEDDED → YTMUSIC_ANDROID → ...
- Each client has matching headers in `CLIENT_HEADERS` (User-Agent, X-YouTube-Client-Name, X-YouTube-Client-Version)
- `tryResolve()` prefers `best.url` (pre-deciphered) over `best.decipher()` — NO JS evaluator in RN

### Layer 2: `youtubeRest.ts` (Fallback — direct REST API)
- Zero dependency on youtubei.js — pure `fetch` to InnerTube API
- 4 client configs: ANDROID_VR 1.65.10 + 1.62.27 × 2 API keys (primary + backup)
- `AbortController` timeout: 15s per attempt
- Returns pre-deciphered URLs (ANDROID_VR only — the only client that does this)
- Same Opus 96kbps selection logic

### Layer 3: Backup API Key
- If primary key fails, tries same clients with `AIzaSyB-63vPrJDKp1nR7Ho9QFnB39E2Kj6Y6QU`
- Combined success rate from terminal tests: ~80% for popular content
- On-device success rate expected higher (mobile IP, real device UA)

### Key YouTube Rules
- **NO JS evaluator** in RN — cannot decipher URLs
- Must use ANDROID_VR (client 28) — only one returning pre-deciphered URLs
- **Use `getBasicInfo` NEVER `getInfo`** — getInfo crashes on ANDROID_VR response format
- Headers MUST match the issuing client or YouTube returns 403 on stream fetch
- Progressive formats (audio+video) preferred for downloads; adaptive audio-only for streaming

## Key Patterns
- **TrackRow**: memo-ized, accepts `onSwipeRight` (add to queue) and `onSwipeLeft` (remove from playlist). When either is set, wraps content in `Swipeable` from react-native-gesture-handler. Swipe right reveals accent "add to queue" button, swipe left reveals red "remove" button.
- **TrackActionsModal**: bottom sheet used everywhere for long-press actions. Has "add to queue" and "add to playlist" options.
- **Visualizer was removed**: tap on artwork now toggles between TerminalArtwork and LyricsView directly (no visualizer mode).
- **Share in downloads**: uses `expo-sharing` (`Sharing.shareAsync`) with mimeType `audio/mpeg`. Do NOT use RN `Share.share({url})` — it fails on Android with "cannot send empty message".
- **Theme**: COLORS/FONTS from `constants/theme`. Uses Manrope, JetBrains Mono, Fraunces fonts.
- **Gestures**: Swipeable from react-native-gesture-handler imported as `import Swipeable from 'react-native-gesture-handler/Swipeable'`. Ref for imperative close: `useRef<any>(null)`.

## Recent Changes (May 28 2026)
1. **3-layer YouTube fallback**: youtubei.js → REST API → backup API key
2. New `services/youtubeRest.ts` — pure REST API, zero library deps
3. `getStreamSource()` and `getDownloadUrl()` now safely handle library init failure
4. Share fix: `Share.share({url})` → `expo-sharing` `shareAsync` in downloads
5. Removed visualizer tap toggle: artwork ↔ lyrics direct toggle (no visualizer mode)
6. Swipe right → add to queue on ALL TrackRows (home, search, favorites, history, downloads, playlist)
7. Swipe left → remove from playlist (only on playlist screen, no confirmation dialog)
8. TrackActionsModal enlarged: bigger padding, fonts, hit areas
9. Responsive layout fix: bottom safe area insets for devices with navigation bar

## User Preferences
- Spanish speaker, fast iterations preferred
- Immediately test changes on device, commit+push frequently
- Prefers direct approach: "no me hagas pensar", just implement
- Release APK build → ADB install → copy to `~/Projects/APKs/`
- User runs `npx expo prebuild --no-install` before builds sometimes
