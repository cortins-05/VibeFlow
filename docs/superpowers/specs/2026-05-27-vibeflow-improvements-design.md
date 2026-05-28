# VibeFlow Improvements Design

## Issues to address

### 1. Track sync (bug)
- **Problem**: `playerStore.currentTrack` only updates on explicit `playQueue`/`playTrack` calls. RNTP `skipToNext()`/`skipToPrevious()` advances the internal queue but the store stays stale.
- **Fix**: Subscribe to RNTP `Event.PlaybackActiveTrackChanged` in root layout and sync `currentTrack` + `activeTrackIndex` in the store.

### 2. Downloads (bug)
- **Problem**: Download to `Paths.cache` fails or shows unusable location prompt.
- **Fix**: Use `expo-file-system/legacy` to download to `documentDirectory/audio/`, then `expo-sharing` for the save/share prompt.

### 3. UX improvements
- Playlist → rename, inline edit
- Track reorder in playlists (move up/down)
- Track context menu → add to playlist, remove
- Bottom sheet for track actions

### 4. Performance
- `FlatList` with `getItemLayout`, `windowSize`, `maxToRenderPerBatch`
- `React.memo` on `TrackRow`, `MiniPlayer`
- Optimized Zustand selectors (atomic selectors to minimize re-renders)

### 7. Discover page
- Fix trending: fallback to search query if `getHomeFeed` fails
- Remove JetBrains Mono badge texts across the app
- More interactive (animated sections, tap-to-explore)

### 8. Build & icon
- Set app icon from `~/Descargas/logoApp.png`
- Build debug APK via Gradle
- Install via ADB
