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

## YouTube Services — Verified Single-Path Resolution

**Sept 1 2026 rewrite.** In mid-August 2026 YouTube began requiring a GVS
Proof-of-Origin token for every ANDROID_VR format except itag 18. ANDROID_VR
had been the app's primary client, so playback and downloads both broke.

The failure is deceptive: the InnerTube *player* response still returns
`playabilityStatus: "OK"` with well-formed URLs. Only the media server rejects
them, with 403 on every byte range. Any resolver that trusts the player response
hands ExoPlayer a dead URL and fails silently — which is exactly what happened.

### `youtubeSession.ts` — visitor identity
- Scrapes `visitorData` once from `https://www.youtube.com/sw.js_data`, caches it.
- Without it most videos come back `LOGIN_REQUIRED` ("Sign in to confirm you're
  not a bot"). Every player request must carry it, in both the context and the
  `X-Goog-Visitor-Id` header.

### `youtubeRest.ts` — the only media resolution path
- Pure `fetch` against InnerTube. Client order: **IOS → IOS 19.45 → IOS_MUSIC →
  IOS (backup key) → ANDROID_VR**.
- `verifySource()` is the important part: before returning any source it fetches
  the *start* of the stream **and a range at 95%**. The tail probe is what
  catches a PO-token-capped client, which serves the first ~1 MB and then 403s —
  playback that dies mid-song. A source that fails verification is skipped and
  the cascade moves on, so the app self-heals when YouTube breaks the next client.
- Returns `contentLength`, `itag` and `client` alongside the URL.
- ANDROID_VR is kept last only because it costs nothing and may be un-broken later.

### `youtube.ts` — search and metadata only
- youtubei.js is still used for `searchYouTube`, `getTrending`, `getVideoInfo`;
  those endpoints need no PO token.
- `getStreamSource` / `getDownloadUrl` delegate straight to `youtubeRest.ts`.
  There is deliberately no second cascade — the old duplicate one was the thing
  returning unverified ANDROID_VR URLs.

### Key YouTube Rules
- **NO JS evaluator** in RN — formats with only `signatureCipher` are unusable;
  the resolver skips anything without a direct `url`.
- Headers MUST match the issuing client or the media server returns 403. This
  applies to *resumed* downloads too — `useTrackDownload` stores the headers and
  replays them.
- **Adaptive audio-only, never progressive** for downloads. itag 18 carries video
  we throw away, and it is the one format ANDROID_VR still serves, which made it
  a tempting trap.
- `playabilityStatus: OK` proves nothing. Only bytes from the media server do.

### Diagnosing a future breakage
```sh
npm run diagnose            # or: node scripts/diagnose-youtube.mjs <videoId>
```
Reports each client as WORKING / RANGE-CAPPED / MEDIA 403 / REFUSED, and
distinguishes a broken client (clients fail differently) from an IP rate limit
(all clients fail identically — wait and re-run).

### Tests
- `npm run test:unit` — network-free; format selection and container sniffing.
- `npm run test:network` — real InnerTube + media-server requests. Asserts that a
  resolved URL serves bytes at the start, mid-song, and at 95%, accepts a 1 MiB
  read, accepts an unranged GET (what `expo-file-system` sends), and transfers a
  complete file. Resolves each video once and shares it; re-resolving per
  assertion trips YouTube's bot detection.
- Network tests failing while unit tests pass usually means this IP is
  rate-limited, not that the code regressed. Run `npm run diagnose` to confirm.

## Key Patterns
- **TrackRow**: memo-ized, accepts `onSwipeRight` (add to queue) and `onSwipeLeft` (remove from playlist). When either is set, wraps content in `Swipeable` from react-native-gesture-handler. Swipe right reveals accent "add to queue" button, swipe left reveals red "remove" button.
- **TrackActionsModal**: bottom sheet used everywhere for long-press actions. Has "add to queue" and "add to playlist" options.
- **Visualizer was removed**: tap on artwork now toggles between TerminalArtwork and LyricsView directly (no visualizer mode).
- **Share in downloads**: uses `expo-sharing` (`Sharing.shareAsync`) with mimeType `audio/mpeg`. Do NOT use RN `Share.share({url})` — it fails on Android with "cannot send empty message".
- **Theme**: COLORS/FONTS from `constants/theme`. Uses Manrope, JetBrains Mono, Fraunces fonts.
- **Gestures**: Swipeable from react-native-gesture-handler imported as `import Swipeable from 'react-native-gesture-handler/Swipeable'`. Ref for imperative close: `useRef<any>(null)`.
- **useTheme()**: All components get colors/fonts via `const { colors, fonts } = useTheme()` from `constants/theme`. Never import COLORS/FONTS directly (static fallback only). Theme changes instantly without restart.
- **Playlist import**: `ImportTrigger` wraps `DocumentPicker` → `FileSystem.copyAsync` to cache (URI permission fix) → `ImportReviewModal` (6-phase: reading→searching→review→saving→done→error). Uses `readAndParseFile()` for format detection, `searchAndMatch()` with batching + confidence scoring.
- **expo-file-system/legacy**: Always import from `expo-file-system/legacy` (not `expo-file-system`). The modern API doesn't expose `cacheDirectory`, `readAsStringAsync`, `copyAsync`, `makeDirectoryAsync`, `DownloadResumable`.

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
10. **Theme selector**: 3 switchable themes (neon/frost/industrial) via `stores/themeStore.ts` (Zustand + AsyncStorage) + reactive `useTheme()` hook in `constants/theme.ts`. `ThemeSelector` inline dropdown in Settings. All 27+ files migrated from static `COLORS`/`FONTS` to `useTheme()`.
11. **Playlist importer**: import Spotify/YouTube playlists from CSV/JSON/TXT files. Parsers in `services/csvParser.ts`, `jsonParser.ts`, `txtParser.ts`. `searchAndMatch()` with batching (5 at a time), confidence scoring (word overlap + containment), AbortSignal support. `readAndParseFile()` with typed `FileError`.
12. **ImportReviewModal**: 6-phase blocking modal (reading → searching → review → saving → done → error) with progress bar, cancellation (AbortController), error screen with retry/close. `components/ImportReviewModal.tsx`.
13. **ImportTrigger**: reusable component wrapping DocumentPicker + file copy + ImportReviewModal. Compact variant in Library header, full-width in Settings Import section.
14. **Settings simplified**: removed Audio (Equalizer/Quality) and Storage (Cache) sections. Only Appearance → Import → About.
15. **URI permission fix**: copy imported file to `FileSystem.cacheDirectory` immediately after picking to bypass Android temporary content:// URI permission expiry.
16. **expo-file-system/legacy**: migrated from `expo-file-system` to `expo-file-system/legacy` for SDK 56 API compatibility (`cacheDirectory`, `readAsStringAsync`, `copyAsync`).
17. **TrackRow useCallback fix**: added `colors`/`fonts` to dependency arrays so swipe actions (add to queue, remove from playlist) reflect theme changes without stale closures.

## User Preferences
- Spanish speaker, fast iterations preferred
- Immediately test changes on device, commit+push frequently
- Prefers direct approach: "no me hagas pensar", just implement
- Release APK build → ADB install → copy to `~/Projects/APKs/`
- User runs `npx expo prebuild --no-install` before builds sometimes

## Recent Changes (Sept 1 2026)
1. **Fixed: nothing streamed or downloaded.** ANDROID_VR became GVS-PO-token-gated
   in mid-Aug 2026; its URLs resolve with `playabilityStatus: OK` but 403 on every
   byte range. Switched media resolution to the IOS client.
2. `services/youtubeSession.ts` — cached `visitorData`, fixes `LOGIN_REQUIRED`
   ("Sign in to confirm you're not a bot") on most videos.
3. `services/youtubeRest.ts` rewritten: IOS-first cascade, `verifySource()` probes
   start **and** 95% before returning, exposes `contentLength`/`itag`/`client`.
   Only IOS 20.x client versions are accepted — 19.x returns HTTP 400.
4. `services/youtube.ts` reduced to search/metadata; media resolution delegates to
   the REST path so there is a single verified route.
5. `hooks/useTrackDownload.ts` — resume now replays the client headers (it passed
   `undefined`, guaranteeing a 403), and the file extension follows the itag
   instead of a substring match on the URL.
6. Test suite (`vitest`): `tests/formatSelection.test.ts` (unit),
   `tests/streaming.test.ts` + `tests/download.test.ts` (real network contract).
7. `scripts/diagnose-youtube.mjs` — per-client WORKING / RANGE-CAPPED verdicts.
