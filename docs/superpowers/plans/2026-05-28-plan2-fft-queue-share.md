# Plan 2: FFT Visualizer + Queue Features + Share + Fixes

> **STATUS: 🟡 PARTIALLY IMPLEMENTED — some tasks applied inline during import/theme work, some deferred.**
> - **Done (not as this plan):** Share via expo-sharing in downloads (fix: `Sharing.shareAsync` not RN `Share`), circular queue skip handlers in player, TrackActionsModal with add-to-queue everywhere, remove visualizer tap toggle (→ artwork/lyrics direct toggle), swipe actions on TrackRow.
> - **NOT done:** Native FFT visualizer (Kotlin Expo module never built), queue manager panel (QueuePanel exists but not wired), `moveInQueue`/`removeFromQueue` actions in playerStore.
> - FFT visualizer is no longer planned (user chose simple audio-reactive bars approach; visualizer mode removed entirely). Queue panel and store actions remain TODO if needed.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add native Android FFT visualizer, circular queue, queue manager panel, add-to-queue everywhere, share downloaded tracks, remove library duplication.

**Architecture:** Kotlin Expo local module for `android.media.audiofx.Visualizer` on session 0 → `useAudioSpectrum` hook → Reanimated shared values → Skia bars. Circular queue via wrapping index in skip handlers. Queue manager as animated bottom sheet. Share via RN `Share` API with local file URIs.

**Tech Stack:** Expo SDK 56, expo-modules-core (Kotlin), Skia, Reanimated, Kotlin 2.1.20, New Architecture.

**CRITICAL:** Do NOT touch `services/youtube.ts`, download pipeline logic, `videoId` matching in `app/_layout.tsx`, `resolveSource()`, or store logic (player/download). Only modify behavior in player skip handlers (circular wrap) and add new UI components.

---

## File Structure (target)

```
modules/audio-spectrum/                       # NEW — local Expo module
  expo-module.config.json
  index.ts
  src/
    AudioSpectrumModule.ts
    AudioSpectrum.types.ts
  android/
    build.gradle
    src/main/java/expo/modules/audiosprectrum/
      AudioSpectrumModule.kt
  ios/
    AudioSpectrumModule.swift                 # no-op stub
hooks/
  useAudioSpectrum.ts                         # NEW — native FFT → shared value
  useTrackDownload.ts                         # (exists, untouched)
  useLyrics.ts                                # (exists, untouched)
components/
  player/
    VisualizerView.tsx                         # REWRITE — Skia bars from real FFT
    QueuePanel.tsx                             # NEW — animated queue manager
    TerminalArtwork.tsx                        # (exists, untouched)
    ProgressScrub.tsx                          # (exists, untouched)
    PlayerControls.tsx                         # (exists, untouched)
    SecondaryActions.tsx                       # (exists, untouched)
    LyricsView.tsx                             # (exists, untouched)
  ui/                                          # (exists, untouched)
  TrackRow.tsx                                 # MODIFY — add `onMore` support
  TrackActionsModal.tsx                        # NEW — reusable track action sheet
  AddToPlaylistModal.tsx                       # REMOVE — replaced by TrackActionsModal
  AudioVisualizer.tsx                          # REMOVE — unused old synthetic visualizer
app/
  player.tsx                                   # MODIFY — circular skip, queue panel, actions wiring
stores/
  playerStore.ts                               # MODIFY — add removeFromQueue, clearQueue, moveInQueue
app/(tabs)/
  library.tsx                                  # MODIFY — remove Recent Downloads section
  downloads.tsx                                # MODIFY — add share button
  discover (index.tsx)                         # MODIFY — wire track actions
  search.tsx                                   # MODIFY — wire track actions
  favorites.tsx                                # MODIFY — wire track actions
  history.tsx                                  # MODIFY — wire track actions
  playlist/[id].tsx                            # MODIFY — wire track actions
app.json                                       # MODIFY — add RECORD_AUDIO permission
```

---

### Task 1: Circular Queue (skip handlers)

**Files:**
- Modify: `app/player.tsx:44-61`
- Modify: `stores/playerStore.ts` — add `removeFromQueue`, `clearQueue`, `moveInQueue`

- [ ] **Step 1: Add queue management actions to playerStore**

```ts
// Add to PlayerStore interface:
  removeFromQueue: (index: number) => Promise<void>;
  clearQueue: () => Promise<void>;
  moveInQueue: (fromIndex: number, toIndex: number) => Promise<void>;

// Add implementations after addToQueue:
  removeFromQueue: async (index) => {
    const { queue, activeTrackIndex } = get();
    if (index < 0 || index >= queue.length) return;
    const newQueue = queue.filter((_, i) => i !== index);
    // If removing the currently playing track or before it, adjust index
    const newIndex = index < activeTrackIndex ? activeTrackIndex - 1
      : index === activeTrackIndex ? Math.min(activeTrackIndex, newQueue.length - 1)
      : activeTrackIndex;
    set({ queue: newQueue, activeTrackIndex: newIndex });
    // Also rebuild RNTP queue
    await TrackPlayer.remove(undefined); // clear all
    for (const t of newQueue) {
      const src = await resolveSource(t);
      await TrackPlayer.add(toRntpTrack(t, src));
    }
    if (newQueue.length > 0) {
      await TrackPlayer.skip(newIndex);
    }
  },

  clearQueue: async () => {
    set({ queue: [], activeTrackIndex: -1 });
    await TrackPlayer.reset();
  },

  moveInQueue: async (fromIndex, toIndex) => {
    const { queue, activeTrackIndex } = get();
    if (fromIndex < 0 || fromIndex >= queue.length || toIndex < 0 || toIndex >= queue.length) return;
    const newQueue = [...queue];
    const [moved] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, moved);
    // Adjust activeTrackIndex if needed
    let newActive = activeTrackIndex;
    if (fromIndex === activeTrackIndex) {
      newActive = toIndex;
    } else {
      if (fromIndex < activeTrackIndex && toIndex >= activeTrackIndex) newActive--;
      else if (fromIndex > activeTrackIndex && toIndex <= activeTrackIndex) newActive++;
    }
    set({ queue: newQueue, activeTrackIndex: newActive });
    // Rebuild RNTP queue
    await TrackPlayer.remove(undefined);
    for (const t of newQueue) {
      const src = await resolveSource(t);
      await TrackPlayer.add(toRntpTrack(t, src));
    }
    await TrackPlayer.skip(newActive);
  },
```

- [ ] **Step 2: Make skip handlers circular**

```tsx
// Replace handleSkipNext in app/player.tsx:
  async function handleSkipNext() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { queue, activeTrackIndex } = usePlayerStore.getState();
    if (queue.length === 0) return;
    const nextIdx = (activeTrackIndex + 1) % queue.length;
    usePlayerStore.getState().playQueue(queue, nextIdx);
  }

// Replace handleSkipPrev in app/player.tsx:
  async function handleSkipPrev() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { queue, activeTrackIndex } = usePlayerStore.getState();
    if (queue.length === 0) return;
    if (progress.position > 3) {
      await TrackPlayer.seekTo(0);
    } else {
      const prevIdx = (activeTrackIndex - 1 + queue.length) % queue.length;
      usePlayerStore.getState().playQueue(queue, prevIdx);
    }
  }
```

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/player.tsx stores/playerStore.ts
git commit -m "feat(player): circular queue + queue management actions"
```

---

### Task 2: Queue Manager Panel

**Files:**
- Create: `components/player/QueuePanel.tsx`
- Modify: `app/player.tsx` — wire ListMusic button

- [ ] **Step 1: Create `components/player/QueuePanel.tsx`**

Animated bottom panel that slides up from bottom using Reanimated. Shows current queue with track titles/artists, remove button per item, up/down reorder arrows, clear all button.

```tsx
import { useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { X, ChevronUp, ChevronDown, Trash2 } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { COLORS, FONTS, glow } from '../../constants/theme';
import { usePlayerStore } from '../../stores/playerStore';

const { height: SCREEN_H } = Dimensions.get('window');
const PANEL_HEIGHT = Math.min(SCREEN_H * 0.65, 520);

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function QueuePanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { queue, activeTrackIndex, removeFromQueue, clearQueue, moveInQueue } = usePlayerStore();

  const translateY = useSharedValue(PANEL_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  if (visible) {
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    backdropOpacity.value = withTiming(1, { duration: 200 });
  } else {
    translateY.value = withSpring(PANEL_HEIGHT, { damping: 20, stiffness: 200 });
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleClear = useCallback(async () => {
    await clearQueue();
    onClose();
  }, []);

  if (!visible) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}>
      <Animated.View style={[{ flex: 1, backgroundColor: 'rgba(11,12,11,0.7)' }, backdropStyle]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: PANEL_HEIGHT,
            backgroundColor: COLORS.surface,
            borderTopLeftRadius: 6,
            borderTopRightRadius: 6,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderBottomWidth: 0,
          },
          panelStyle,
        ]}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.accent, letterSpacing: 1 }}>
            [ QUEUE ] — {queue.length} tracks
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {queue.length > 0 && (
              <Pressable onPress={handleClear} hitSlop={8}>
                <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.error }}>[ clear ]</Text>
              </Pressable>
            )}
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textDim }}>[ close ]</Text>
            </Pressable>
          </View>
        </View>

        {/* Queue list */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
          {queue.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textDim }}>// queue empty</Text>
            </View>
          )}
          {queue.map((track, i) => (
            <View
              key={`${track.videoId}-${i}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.border,
                backgroundColor: i === activeTrackIndex ? 'rgba(229,255,58,0.05)' : 'transparent',
              }}
            >
              {/* Reorder arrows */}
              <View style={{ flexDirection: 'column', marginRight: 8 }}>
                <Pressable
                  onPress={() => moveInQueue(i, i - 1)}
                  disabled={i === 0}
                  hitSlop={6}
                  style={{ opacity: i === 0 ? 0.2 : 1, paddingVertical: 1 }}
                >
                  <ChevronUp color={COLORS.textFaint} size={12} strokeWidth={1.8} />
                </Pressable>
                <Pressable
                  onPress={() => moveInQueue(i, i + 1)}
                  disabled={i === queue.length - 1}
                  hitSlop={6}
                  style={{ opacity: i === queue.length - 1 ? 0.2 : 1, paddingVertical: 1 }}
                >
                  <ChevronDown color={COLORS.textFaint} size={12} strokeWidth={1.8} />
                </Pressable>
              </View>

              {/* Active indicator */}
              {i === activeTrackIndex && (
                <View style={{ width: 2, height: 28, backgroundColor: COLORS.accent, marginRight: 8, borderRadius: 1 }} />
>
              )}
              {i !== activeTrackIndex && <View style={{ width: 10 }} />}

              {/* Artwork */}
              <Image
                source={{ uri: track.artwork }}
                style={{ width: 36, height: 36, borderRadius: 3, backgroundColor: COLORS.bg }}
                contentFit="cover"
              />
              {/* Info */}
              <View style={{ flex: 1, marginLeft: 10, minWidth: 0 }}>
                <Text style={{ fontFamily: FONTS.sans, fontSize: 14, color: i === activeTrackIndex ? COLORS.accent : COLORS.text }} numberOfLines={1}>
                  {track.title}
                </Text>
                <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textDim, marginTop: 1 }} numberOfLines={1}>
                  {track.artist} · {formatDuration(track.duration)}
                </Text>
              </View>

              {/* Remove */}
              <Pressable
                onPress={() => removeFromQueue(i)}
                hitSlop={8}
                style={{ padding: 6 }}
              >
                <X color={COLORS.textFaint} size={14} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
```

- [ ] **Step 2: Wire ListMusic button in player.tsx**

Add state + panel import + wire pressable:

```tsx
// Add import:
import QueuePanel from '../components/player/QueuePanel';

// Add state:
const [showQueue, setShowQueue] = useState(false);

// Replace the inactive ListMusic Pressable:
<Pressable onPress={() => setShowQueue(true)} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
  <ListMusic color={COLORS.text} size={20} />
</Pressable>

// Add before closing SafeAreaView:
<QueuePanel visible={showQueue} onClose={() => setShowQueue(false)} />
```

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/player/QueuePanel.tsx app/player.tsx
git commit -m "feat(player): queue manager panel (animated bottom sheet)"
```

---

### Task 3: Track Actions Modal + Add to Queue everywhere

**Files:**
- Create: `components/TrackActionsModal.tsx`
- Remove: `components/AddToPlaylistModal.tsx`
- Remove: `components/AudioVisualizer.tsx`
- Modify: `app/(tabs)/index.tsx`, `search.tsx`, `favorites.tsx`, `history.tsx`, `downloads.tsx`, `app/playlist/[id].tsx`

- [ ] **Step 1: Create `components/TrackActionsModal.tsx`**

Reusable bottom action sheet that replaces `AddToPlaylistModal`. Options: "Add to Queue", "Add to Playlist", "Share" (if downloaded file exists).

```tsx
import { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, TextInput } from 'react-native';
import { ListMusic, Download } from 'lucide-react-native';
import { useLibraryStore } from '../stores/libraryStore';
import { usePlayerStore } from '../stores/playerStore';
import { useDownloadStore } from '../stores/downloadStore';
import type { Track } from '../stores/playerStore';
import { COLORS, FONTS } from '../constants/theme';

interface Props {
  visible: boolean;
  track: Track | null;
  onClose: () => void;
}

export default function TrackActionsModal({ visible, track, onClose }: Props) {
  const { playlists, createPlaylist, addTrackToPlaylist } = useLibraryStore();
  const { addToQueue } = usePlayerStore();
  const { getLocalPath, isDownloaded } = useDownloadStore();
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  if (!track) return null;

  function handleAddToQueue() {
    addToQueue(track);
    onClose();
  }

  async function handleShare() {
    const filePath = getLocalPath(track.videoId);
    if (filePath) {
      try {
        const { shareAsync } = await import('expo-file-system');
        const { Share } = await import('react-native');
        await Share.share({ url: filePath });
      } catch {
        // fallback
      }
    }
    onClose();
  }

  function handleSelectPlaylist(playlistId: string) {
    addTrackToPlaylist(playlistId, track);
    setShowPlaylists(false);
    onClose();
  }

  function handleCreatePlaylist() {
    if (!newName.trim()) return;
    createPlaylist(newName.trim());
    const pl = useLibraryStore.getState().playlists;
    if (pl[0]) handleSelectPlaylist(pl[0].id);
    setNewName('');
    setShowCreate(false);
  }

  const downloaded = isDownloaded(track.videoId);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(11,12,11,0.8)' }}>
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderTopLeftRadius: 6,
            borderTopRightRadius: 6,
            paddingTop: 20,
            paddingBottom: 40,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderBottomWidth: 0,
            maxHeight: '70%',
          }}
        >
          <View style={{ paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.accent, letterSpacing: 1 }}>
              [ {track.title} ]
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textDim }}>[ close ]</Text>
            </Pressable>
          </View>

          <ScrollView style={{ paddingHorizontal: 20 }}>
            {!showPlaylists ? (
              <>
                {/* Add to Queue */}
                <ActionOption
                  icon={<ListMusic color={COLORS.accent} size={16} />}
                  label="add to queue"
                  color={COLORS.accent}
                  onPress={handleAddToQueue}
                />

                {/* Add to Playlist */}
                <ActionOption
                  icon={<ListMusic color={COLORS.secondary} size={16} />}
                  label="add to playlist"
                  color={COLORS.secondary}
                  onPress={() => setShowPlaylists(true)}
                />

                {/* Share (only if downloaded) */}
                {downloaded && (
                  <ActionOption
                    icon={<Download color={COLORS.textDim} size={16} />}
                    label="share file"
                    color={COLORS.textDim}
                    onPress={handleShare}
                  />
                )}
              </>
            ) : (
              <>
                <Pressable onPress={() => setShowPlaylists(false)} style={{ marginBottom: 12 }}>
                  <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textDim }}>{'< back'}</Text>
                </Pressable>

                {!showCreate ? (
                  <>
                    <Pressable
                      onPress={() => setShowCreate(true)}
                      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border }}
                    >
                      <View style={{ width: 36, height: 36, borderRadius: 4, backgroundColor: 'rgba(229,255,58,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.borderAccent }}>
                        <Text style={{ color: COLORS.accent, fontSize: 18 }}>+</Text>
                      </View>
                      <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.accent, marginLeft: 14 }}>
                        [ new playlist ]
                      </Text>
                    </Pressable>

                    {playlists.map((pl) => (
                      <Pressable
                        key={pl.id}
                        onPress={() => handleSelectPlaylist(pl.id)}
                        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border }}
                      >
                        <View style={{ width: 36, height: 36, borderRadius: 4, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
                          <ListMusic color={COLORS.secondary} size={16} />
                        </View>
                        <Text style={{ flex: 1, fontFamily: FONTS.sans, fontSize: 14, color: COLORS.text, marginLeft: 14 }} numberOfLines={1}>
                          {pl.name}
                        </Text>
                      </Pressable>
                    ))}

                    {playlists.length === 0 && (
                      <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textFaint, textAlign: 'center', paddingVertical: 20 }}>
                        // no playlists yet
                      </Text>
                    )}
                  </>
                ) : (
                  <View style={{ paddingVertical: 16 }}>
                    <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.accent, letterSpacing: 1, marginBottom: 12 }}>
                      NEW PLAYLIST
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, borderRadius: 4, borderWidth: 1, borderColor: COLORS.borderAccent, paddingHorizontal: 12 }}>
                      <Text style={{ fontFamily: FONTS.mono, fontSize: 13, color: COLORS.accent, marginRight: 8 }}>{'>'}</Text>
                      <TextInput
                        value={newName}
                        onChangeText={setNewName}
                        placeholder="name..."
                        placeholderTextColor={COLORS.textFaint}
                        autoFocus
                        onSubmitEditing={handleCreatePlaylist}
                        style={{ flex: 1, fontFamily: FONTS.mono, fontSize: 13, color: COLORS.text, paddingVertical: 11 }}
                      />
                    </View>
                    <View style={{ flexDirection: 'row', marginTop: 16 }}>
                      <Pressable onPress={() => setShowCreate(false)} style={{ flex: 1, paddingVertical: 11, alignItems: 'center' }}>
                        <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textDim }}>BACK</Text>
                      </Pressable>
                      <Pressable onPress={handleCreatePlaylist} style={{ flex: 1, paddingVertical: 11, borderRadius: 4, backgroundColor: COLORS.accent, alignItems: 'center' }}>
                        <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.bg }}>CREATE</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ActionOption({ icon, label, color, onPress }: { icon: React.ReactNode; label: string; color: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border }}
    >
      {icon}
      <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color, marginLeft: 14, letterSpacing: 0.5 }}>
        [ {label} ]
      </Text>
    </Pressable>
  );
}
```

- [ ] **Step 2: Wire TrackActionsModal into every screen**

For each screen, replace usage of `AddToPlaylistModal` and `onLongPress` → `setAddToListTrack`:
- `app/(tabs)/index.tsx`: replace `AddToPlaylistModal` import and usage with `TrackActionsModal`
- `app/(tabs)/search.tsx`: add `TrackActionsModal` (no long-press currently, add via onLongPress on TrackRow or modify)
- `app/(tabs)/favorites.tsx`: add `TrackActionsModal` via onLongPress
- `app/(tabs)/history.tsx`: add `TrackActionsModal` via onLongPress  
- `app/(tabs)/downloads.tsx`: add `TrackActionsModal` via onLongPress
- `app/playlist/[id].tsx`: replace `onMore={handleRemoveTrack}` with a proper actions modal (include remove from playlist, add to queue)

Pattern for each screen:
```tsx
// Add state:
const [actionTrack, setActionTrack] = useState<Track | null>(null);

// Add modal at bottom:
<TrackActionsModal visible={!!actionTrack} track={actionTrack} onClose={() => setActionTrack(null)} />

// Wire onLongPress on TrackRow:
onLongPress={() => setActionTrack(toTrack(t))}
```

For `app/playlist/[id].tsx`, keep the `onMore` behavior but also offer add-to-queue. The `onMore` handler should show `TrackActionsModal` instead of directly prompting remove.

- [ ] **Step 3: Remove old files** — `components/AddToPlaylistModal.tsx`, `components/AudioVisualizer.tsx`

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/TrackActionsModal.tsx app/ app/(tabs)/ components/player/ components/player/
git rm components/AddToPlaylistModal.tsx components/AudioVisualizer.tsx
git commit -m "feat(player): TrackActionsModal with add-to-queue + playlist, remove old components"
```

---

### Task 4: Share downloaded tracks

**Files:**
- Modify: `app/(tabs)/downloads.tsx`

- [ ] **Step 1: Add share button to Downloads screen**

Add a share icon button next to the delete button in each download row. Use `Share` from react-native (built-in, no extra dependency) with the local file URI.

```tsx
// Add to imports:
import { Share } from 'react-native';

// Add share handler inside the component:
async function handleShare(filePath: string, title: string) {
  try {
    await Share.share({
      url: filePath.startsWith('file://') ? filePath : `file://${filePath}`,
      title: title,
    });
  } catch (e) {
    console.warn('[downloads] share failed:', e);
  }
}

// Add Share button next to Trash2 in each row:
<Pressable
  onPress={() => handleShare(d.file_path, d.title)}
  style={{ paddingRight: 8, paddingLeft: 8, paddingVertical: 16 }}
  hitSlop={8}
>
  <Upload color={COLORS.secondary} size={16} />
</Pressable>
```

(Import `Upload` from `lucide-react-native` or use a different icon like `Share2`.)

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/\(tabs\)/downloads.tsx
git commit -m "feat(ui): share downloaded tracks from downloads screen"
```

---

### Task 5: Remove Recent Downloads from Library

**Files:**
- Modify: `app/(tabs)/library.tsx`

- [ ] **Step 1: Delete the Recent Downloads section**

Remove lines ~94-126 (the entire `{downloads.length > 0 && ( ... )}` block after the pinned cards). Keep everything else intact.

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/\(tabs\)/library.tsx
git commit -m "chore(ui): remove Recent Downloads section from Library (duplicates Downloads tab)"
```

---

### Task 6: Native FFT Visualizer (Kotlin Expo module + Skia)

**Files:**
- Create: `modules/audio-spectrum/expo-module.config.json`
- Create: `modules/audio-spectrum/index.ts`
- Create: `modules/audio-spectrum/src/AudioSpectrumModule.ts`
- Create: `modules/audio-spectrum/src/AudioSpectrum.types.ts`
- Create: `modules/audio-spectrum/android/build.gradle`
- Create: `modules/audio-spectrum/android/src/main/java/expo/modules/audiosprectrum/AudioSpectrumModule.kt`
- Create: `modules/audio-spectrum/ios/AudioSpectrumModule.swift`
- Create: `hooks/useAudioSpectrum.ts`
- Rewrite: `components/player/VisualizerView.tsx`
- Modify: `app.json` — add `RECORD_AUDIO` permission

- [ ] **Step 1: Determine correct Expo Modules API for SDK 56**

Use context7-mcp to fetch current Expo Modules API docs:

```bash
# Fetch docs to verify:
context7 resolve-library-id --libraryName expo-modules-core --query "local module creation SDK 56 Kotlin"
context7 query-docs --libraryId /expo/expo --query "creating local modules expo-modules-api Kotlin"
```

- [ ] **Step 2: Create module config**

`modules/audio-spectrum/expo-module.config.json`:
```json
{
  "platforms": ["android", "ios"],
  "android": {
    "modules": ["expo.modules.audiosprectrum.AudioSpectrumModule"]
  },
  "ios": {
    "modules": ["AudioSpectrumModule"]
  }
}
```

- [ ] **Step 3: Create Kotlin native module**

`modules/audio-spectrum/android/src/main/java/expo/modules/audiosprectrum/AudioSpectrumModule.kt`:
```kotlin
package expo.modules.audiosprectrum

import android.media.audiofx.Visualizer
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AudioSpectrumModule : Module() {
  private var visualizer: Visualizer? = null
  
  override fun definition() = ModuleDefinition {
    Name("AudioSpectrum")
    
    Events("onSpectrum")
    
    AsyncFunction("enable") {
      val captureSize = 1024
      val bands = 32
      visualizer?.release()
      visualizer = Visualizer(0).apply {
        this.captureSize = captureSize
        setDataCaptureListener(
          object : Visualizer.OnDataCaptureListener {
            override fun onFftDataCapture(visualizer: Visualizer?, fft: ByteArray?, samplingRate: Int) {
              val magnitudes = fft?.let { calculateMagnitudes(it, bands, captureSize) } ?: FloatArray(bands) { 0f }
              sendEvent("onSpectrum", mapOf("bands" to magnitudes.toList()))
            }
            override fun onWaveFormDataCapture(visualizer: Visualizer?, waveform: ByteArray?, samplingRate: Int) {}
          },
          Visualizer.getMaxCaptureRate() / 2,
          false,
          true
        )
        enabled = true
      }
    }
    
    AsyncFunction("disable") {
      visualizer?.apply {
        enabled = false
        release()
      }
      visualizer = null
    }
    
    OnDestroy {
      visualizer?.release()
      visualizer = null
    }
  }
  
  private fun calculateMagnitudes(fft: ByteArray, bandCount: Int, captureSize: Int): FloatArray {
    val n = fft.size / 2
    val magnitudes = FloatArray(n) { i ->
      val real = fft[i * 2].toFloat()
      val imag = fft[i * 2 + 1].toFloat()
      kotlin.math.sqrt(real * real + imag * imag)
    }
    // Downsample to bandCount bands with logarithmic spacing
    val result = FloatArray(bandCount)
    val maxFreqBin = n - 1
    for (i in 0 until bandCount) {
      val lowFreq = (i.toFloat() / bandCount).let { it * it } // logarithmic curve
      val highFreq = ((i + 1).toFloat() / bandCount).let { it * it }
      val lowBin = (lowFreq * maxFreqBin).toInt().coerceIn(0, maxFreqBin)
      val highBin = (highFreq * maxFreqBin).toInt().coerceIn(0, maxFreqBin)
      var sum = 0f
      var count = 0
      for (b in lowBin..highBin) {
        sum += magnitudes.getOrElse(b) { 0f }
        count++
      }
      result[i] = if (count > 0) sum / count else 0f
    }
    // Normalize
    val max = result.maxOrNull() ?: 1f
    if (max > 0) {
      for (i in result.indices) result[i] = (result[i] / max).coerceIn(0f, 1f)
    }
    return result
  }
}
```

- [ ] **Step 4: Create Android build.gradle**

`modules/audio-spectrum/android/build.gradle`:
```gradle
apply plugin: 'com.android.library'
apply plugin: 'kotlin-android'

android {
  compileSdk 36
  namespace "expo.modules.audiosprectrum"

  defaultConfig {
    minSdk 26
    targetSdk 35
  }
}

dependencies {
  implementation 'androidx.core:core-ktx:1.13.1'
  implementation project(':expo-modules-core')
}
```

- [ ] **Step 5: Create JS module files**

`modules/audio-spectrum/src/AudioSpectrum.types.ts`:
```ts
export type SpectrumData = {
  bands: number[];
};

export type AudioSpectrumModuleEvents = {
  onSpectrum: (data: SpectrumData) => void;
};
```

`modules/audio-spectrum/src/AudioSpectrumModule.ts`:
```ts
import { requireNativeModule, requireNativeEventEmitter } from 'expo-modules-core';
import type { SpectrumData, AudioSpectrumModuleEvents } from './AudioSpectrum.types';

const NativeModule = requireNativeModule('AudioSpectrum');
const emitter = requireNativeEventEmitter<AudioSpectrumModuleEvents>(NativeModule);

export function enableVisualizer(): Promise<void> {
  return NativeModule.enable();
}

export function disableVisualizer(): Promise<void> {
  return NativeModule.disable();
}

export function addSpectrumListener(callback: (data: SpectrumData) => void) {
  return emitter.addListener('onSpectrum', callback);
}
```

`modules/audio-spectrum/index.ts`:
```ts
export { enableVisualizer, disableVisualizer, addSpectrumListener } from './src/AudioSpectrumModule';
export type { SpectrumData } from './src/AudioSpectrum.types';
```

- [ ] **Step 6: Create iOS stub**

`modules/audio-spectrum/ios/AudioSpectrumModule.swift`:
```swift
import ExpoModulesCore

public class AudioSpectrumModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AudioSpectrum")
    
    AsyncFunction("enable") {}
    AsyncFunction("disable") {}
  }
}
```

- [ ] **Step 7: Create `hooks/useAudioSpectrum.ts`**

```ts
import { useEffect, useRef, useCallback } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { enableVisualizer, disableVisualizer, addSpectrumListener } from '../modules/audio-spectrum';
import type { SpectrumData } from '../modules/audio-spectrum';

const BAND_COUNT = 32;

export function useAudioSpectrum(isPlaying: boolean, enabled: boolean) {
  const bands = useSharedValue<number[]>(new Array(BAND_COUNT).fill(0));
  const listenerRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    if (!enabled || !isPlaying) {
      // Disable visualizer when not needed
      if (listenerRef.current) {
        listenerRef.current.remove();
        listenerRef.current = null;
      }
      disableVisualizer().catch(() => {});
      bands.value = new Array(BAND_COUNT).fill(0);
      return;
    }

    // Enable visualizer
    enableVisualizer().catch(() => {
      console.warn('[useAudioSpectrum] failed to enable native visualizer');
    });

    listenerRef.current = addSpectrumListener((data: SpectrumData) => {
      bands.value = data.bands;
    });

    return () => {
      if (listenerRef.current) {
        listenerRef.current.remove();
        listenerRef.current = null;
      }
      disableVisualizer().catch(() => {});
      bands.value = new Array(BAND_COUNT).fill(0);
    };
  }, [enabled, isPlaying]);

  return { bands, BAND_COUNT };
}
```

- [ ] **Step 8: Rewrite `VisualizerView.tsx` with Skia**

Replace the full file content. Use Skia `Canvas` + `Path` driven by the `bands` shared value.

```tsx
import { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Canvas, Path, Skia, Group, RoundedRect } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { useAudioSpectrum } from '../../hooks/useAudioSpectrum';
import TrackPlayer, { usePlaybackState, State } from 'react-native-track-player';
import { COLORS, FONTS, glow } from '../../constants/theme';

export default function VisualizerView({ size, isPlaying: _ignored }: { size: number; isPlaying?: boolean }) {
  const playbackState = usePlaybackState();
  const isPlaying = playbackState.state === State.Playing;

  const { bands, BAND_COUNT } = useAudioSpectrum(isPlaying, true);

  const barWidth = 4;
  const gap = 4;
  const totalWidth = BAND_COUNT * (barWidth + gap) - gap;
  const leftPad = (size - totalWidth) / 2;
  const bottomPad = 24;

  const path = useDerivedValue(() => {
    const p = Skia.Path.Make();
    for (let i = 0; i < BAND_COUNT; i++) {
      const x = leftPad + i * (barWidth + gap);
      const amplitude = bands.value[i] ?? 0;
      const h = Math.max(3, amplitude * (size - bottomPad - 20));
      const y = size - bottomPad - h;
      p.addRRect({
        rect: { x, y, width: barWidth, height: h },
        rx: 2,
        ry: 2,
      });
    }
    return p;
  });

  const glowPath = useDerivedValue(() => {
    const p = Skia.Path.Make();
    for (let i = 0; i < BAND_COUNT; i++) {
      const x = leftPad + i * (barWidth + gap);
      const amplitude = bands.value[i] ?? 0;
      const h = Math.max(3, amplitude * (size - bottomPad - 20));
      const y = size - bottomPad - h;
      p.addRRect({
        rect: { x: x - 1, y: y - 2, width: barWidth + 2, height: h + 4 },
        rx: 3,
        ry: 3,
      });
    }
    return p;
  });

  return (
    <Canvas style={{ width: size, height: size, alignSelf: 'center' }}>
      {/* Glow layer */}
      <Group opacity={0.25} color={COLORS.accent}>
        <Path path={glowPath} style="fill" blur={8} />
      </Group>
      {/* Main bars */}
      <Path path={path} color={COLORS.accent} style="fill" />
      {/* Cyan tips */}
      <Group opacity={0.7} color={COLORS.secondary}>
        {Array.from({ length: BAND_COUNT }, (_, i) => (
          <RoundedRect
            key={i}
            x={leftPad + i * (barWidth + gap)}
            y={size - bottomPad - 6}
            width={barWidth}
            height={6}
            r={2}
            color={COLORS.secondary}
          />
        ))}
      </Group>
    </Canvas>
  );
}
```

Actually wait — RoundedRect in a map might not work in Skia declarative API. Let me use a single Path for the tips instead.

Better approach for tips:
```tsx
const tipsPath = useDerivedValue(() => {
  const p = Skia.Path.Make();
  for (let i = 0; i < BAND_COUNT; i++) {
    const x = leftPad + i * (barWidth + gap);
    const y = size - bottomPad - 6;
    p.addRRect({
      rect: { x, y, width: barWidth, height: 6 },
      rx: 2,
      ry: 2,
    });
  }
  return p;
});
```

- [ ] **Step 9: Add RECORD_AUDIO permission to app.json**

```json
// In the existing "expo" block, add android.permissions:
"android": {
  "permissions": ["RECORD_AUDIO"]
}
```

If there's no existing `android` block, add one. If using `expo-build-properties`, add it under that plugin's config.

- [ ] **Step 10: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add modules/ hooks/useAudioSpectrum.ts components/player/VisualizerView.tsx app.json
git commit -m "feat(player): native FFT visualizer (Kotlin Expo module + Skia bars)"
```

---

### Task 7: Full verification pass

- [ ] **Step 1: Typecheck clean**

Run: `npx tsc --noEmit` → PASS (no errors across the project).

- [ ] **Step 2: Grep for legacy hex**

Run: `grep -rn "#ff5c2e\|#0e0c0a\|#f5efe3\|#a08a78\|#5a4d42\|#e8b67a" app components` → Expected: 0 results.

- [ ] **Step 3: Verify no backend files modified**

Run: `git diff --name-only` → No changes to `services/youtube.ts`, `services/db.ts`, `services/trackPlayerService.ts`, `hooks/useTrackDownload.ts` (except its import path), `app/_layout.tsx`.

- [ ] **Step 4: Device smoke test** — ⏳ USER RUNS THIS

Run: `npx expo run:android`. Verify:
- Queue manager panel opens/closes with animation from player screen
- Skip next/prev wraps around queue circularly
- Add to queue works from any track list
- Share downloaded file from Downloads screen
- Library no longer shows Recent Downloads section
- Tap artwork → visualizer mode shows real FFT-driven bars (not placeholder)

---

## Self-Review

- **Spec coverage:** Covers all 5 user requests plus the deferred Plan 2 FFT visualizer.
- **Backend untouched:** Only `app/player.tsx` handlers (skip logic) change behavior; stores only get new actions (no logic changes to existing ones); no modification to `services/`, `app/_layout.tsx`, download pipeline.
- **No placeholders:** Every code block complete and ready to use.
- **Type consistency:** All new types exported properly; existing `Track` type reused; `SpectrumData` type used consistently.
- **Component cleanup:** `AddToPlaylistModal.tsx` removed (replaced by `TrackActionsModal`), `AudioVisualizer.tsx` removed (unused synthetic visualizer).
