import { create } from 'zustand';
import TrackPlayer, { RepeatMode, TrackType } from 'react-native-track-player';
import { getStreamSource, type StreamSource } from '../services/youtube';
import { addToHistory } from '../services/db';
import { useDownloadStore } from './downloadStore';

export interface Track {
  id: string;
  videoId: string;
  url?: string;
  title: string;
  artist: string;
  artwork?: string;
  duration: number;
}

interface PlayerStore {
  currentTrack: Track | null;
  queue: Track[];
  activeTrackIndex: number;
  isPlaying: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  isPlayerVisible: boolean;
  setCurrentTrack: (track: Track | null) => void;
  setQueue: (tracks: Track[]) => void;
  setActiveTrackIndex: (index: number) => void;
  setIsPlaying: (v: boolean) => void;
  setShuffle: (v: boolean) => void;
  setRepeat: (mode: RepeatMode) => void;
  setPlayerVisible: (v: boolean) => void;
  playTrack: (track: Track) => Promise<void>;
  playQueue: (tracks: Track[], startIndex?: number) => Promise<void>;
  addToQueue: (track: Track) => Promise<void>;
  removeFromQueue: (index: number) => Promise<void>;
  clearQueue: () => Promise<void>;
  moveInQueue: (fromIndex: number, toIndex: number) => Promise<void>;
}

function toTrackType(t: StreamSource['type']): TrackType {
  switch (t) {
    case 'hls':
      return TrackType.HLS;
    case 'dash':
      return TrackType.Dash;
    case 'smoothstreaming':
      return TrackType.SmoothStreaming;
    default:
      return TrackType.Default;
  }
}

function toRntpTrack(track: Track, src: StreamSource) {
  return {
    id: track.videoId,
    url: src.url,
    type: toTrackType(src.type),
    headers: src.headers,
    title: track.title,
    artist: track.artist,
    artwork: track.artwork,
    duration: track.duration,
  };
}

async function resolveSource(track: Track): Promise<StreamSource> {
  const localPath = useDownloadStore.getState().getLocalPath(track.videoId);
  if (localPath) {
    console.log('[playerStore] playing from local file:', localPath);
    return { url: localPath, type: 'default' };
  }
  return getStreamSource(track.videoId);
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  queue: [],
  activeTrackIndex: -1,
  isPlaying: false,
  shuffle: false,
  repeat: RepeatMode.Off,
  isPlayerVisible: false,

  setCurrentTrack: (track) => set({ currentTrack: track }),
  setQueue: (tracks) => set({ queue: tracks }),
  setActiveTrackIndex: (index) => set({ activeTrackIndex: index }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setShuffle: (v) => set({ shuffle: v }),
  setRepeat: (mode) => set({ repeat: mode }),
  setPlayerVisible: (v) => set({ isPlayerVisible: v }),

  playTrack: async (track) => {
    console.log('[playerStore] playTrack:', track.title);
    try {
      const src = await resolveSource(track);
      console.log('[playerStore] resolved url, starting playback');
      await TrackPlayer.reset();
      await TrackPlayer.add(toRntpTrack(track, src));
      await TrackPlayer.play();
      set({
        currentTrack: { ...track, url: src.url },
        queue: [track],
        activeTrackIndex: 0,
        isPlaying: true,
        isPlayerVisible: true,
      });
      addToHistory({
        video_id: track.videoId,
        title: track.title,
        artist: track.artist,
        artwork: track.artwork,
        duration: track.duration,
      });
    } catch (e) {
      console.error('[playerStore] playTrack failed:', track.title, e);
    }
  },

  playQueue: async (tracks, startIndex = 0) => {
    const start = tracks[startIndex];
    if (!start) {
      console.warn('[playerStore] playQueue called with empty list');
      return;
    }
    console.log('[playerStore] playQueue start:', start.title, 'index:', startIndex);

    // Show instant visual feedback — set track + queue before URL resolution
    set({
      queue: tracks,
      currentTrack: start,
      activeTrackIndex: startIndex,
      isPlaying: true,
      isPlayerVisible: true,
    });

    try {
      const src = await resolveSource(start);
      console.log('[playerStore] resolved start url, beginning playback');
      await TrackPlayer.reset();
      await TrackPlayer.add(toRntpTrack(start, src));
      await TrackPlayer.play();
      set({ currentTrack: { ...start, url: src.url } });
      addToHistory({
        video_id: start.videoId,
        title: start.title,
        artist: start.artist,
        artwork: start.artwork,
        duration: start.duration,
      });
    } catch (e) {
      console.error('[playerStore] playQueue start failed:', start.title, e);
      return;
    }

    const rest = tracks.slice(startIndex + 1);
    for (const t of rest) {
      try {
        const src = await resolveSource(t);
        await TrackPlayer.add(toRntpTrack(t, src));
      } catch (e) {
        console.warn('[playerStore] skipping unresolvable track:', t.title);
      }
    }
  },

  addToQueue: async (track) => {
    try {
      const src = await resolveSource(track);
      await TrackPlayer.add(toRntpTrack(track, src));
      set((state) => ({ queue: [...state.queue, track] }));
    } catch (e) {
      console.error('[playerStore] addToQueue failed:', track.title, e);
    }
  },

  removeFromQueue: async (index) => {
    const { queue, activeTrackIndex } = get();
    if (index < 0 || index >= queue.length) return;
    const newQueue = queue.filter((_, i) => i !== index);
    const newIndex = index < activeTrackIndex ? activeTrackIndex - 1
      : index === activeTrackIndex ? Math.min(activeTrackIndex, newQueue.length - 1)
      : activeTrackIndex;
    set({ queue: newQueue, activeTrackIndex: newIndex });
    await TrackPlayer.reset();
    for (const t of newQueue) {
      try {
        const src = await resolveSource(t);
        await TrackPlayer.add(toRntpTrack(t, src));
      } catch (e) {
        console.warn('[playerStore] skipping unresolvable track:', t.title);
      }
    }
    if (newQueue.length > 0) {
      await TrackPlayer.skip(newIndex);
    }
  },

  clearQueue: async () => {
    set({ queue: [], activeTrackIndex: -1, currentTrack: null, isPlaying: false });
    await TrackPlayer.reset();
  },

  moveInQueue: async (fromIndex, toIndex) => {
    const { queue, activeTrackIndex } = get();
    if (fromIndex < 0 || fromIndex >= queue.length || toIndex < 0 || toIndex >= queue.length) return;
    const newQueue = [...queue];
    const [moved] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, moved);
    let newActive = activeTrackIndex;
    if (fromIndex === activeTrackIndex) {
      newActive = toIndex;
    } else {
      if (fromIndex < activeTrackIndex && toIndex >= activeTrackIndex) newActive--;
      else if (fromIndex > activeTrackIndex && toIndex <= activeTrackIndex) newActive++;
    }
    set({ queue: newQueue, activeTrackIndex: newActive });
    await TrackPlayer.reset();
    for (const t of newQueue) {
      try {
        const src = await resolveSource(t);
        await TrackPlayer.add(toRntpTrack(t, src));
      } catch (e) {
        console.warn('[playerStore] skipping unresolvable track:', t.title);
      }
    }
    await TrackPlayer.skip(newActive);
  },
}));
