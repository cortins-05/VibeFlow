import { create } from 'zustand';
import TrackPlayer, { RepeatMode, TrackType } from 'react-native-track-player';
import { getStreamSource, type StreamSource } from '../services/youtube';
import { addToHistory } from '../services/db';

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
  isPlaying: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  isPlayerVisible: boolean;
  setCurrentTrack: (track: Track | null) => void;
  setQueue: (tracks: Track[]) => void;
  setIsPlaying: (v: boolean) => void;
  setShuffle: (v: boolean) => void;
  setRepeat: (mode: RepeatMode) => void;
  setPlayerVisible: (v: boolean) => void;
  playTrack: (track: Track) => Promise<void>;
  playQueue: (tracks: Track[], startIndex?: number) => Promise<void>;
  addToQueue: (track: Track) => Promise<void>;
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

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  queue: [],
  isPlaying: false,
  shuffle: false,
  repeat: RepeatMode.Off,
  isPlayerVisible: false,

  setCurrentTrack: (track) => set({ currentTrack: track }),
  setQueue: (tracks) => set({ queue: tracks }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setShuffle: (v) => set({ shuffle: v }),
  setRepeat: (mode) => set({ repeat: mode }),
  setPlayerVisible: (v) => set({ isPlayerVisible: v }),

  playTrack: async (track) => {
    console.log('[playerStore] playTrack:', track.title);
    try {
      const src = await getStreamSource(track.videoId);
      console.log('[playerStore] resolved url, starting playback');
      await TrackPlayer.reset();
      await TrackPlayer.add(toRntpTrack(track, src));
      await TrackPlayer.play();
      set({
        currentTrack: { ...track, url: src.url },
        queue: [track],
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
      isPlaying: true,
      isPlayerVisible: true,
    });

    try {
      const src = await getStreamSource(start.videoId);
      console.log('[playerStore] resolved start url, beginning playback');
      await TrackPlayer.reset();
      await TrackPlayer.add(toRntpTrack(start, src));
      await TrackPlayer.play();
      // Update URL on resolved track
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

    // Resolve remaining tracks in the background
    const rest = tracks.slice(startIndex + 1);
    for (const t of rest) {
      try {
        const src = await getStreamSource(t.videoId);
        await TrackPlayer.add(toRntpTrack(t, src));
      } catch (e) {
        console.warn('[playerStore] skipping unresolvable track:', t.title);
      }
    }
  },

  addToQueue: async (track) => {
    try {
      const src = await getStreamSource(track.videoId);
      await TrackPlayer.add(toRntpTrack(track, src));
      set((state) => ({ queue: [...state.queue, track] }));
    } catch (e) {
      console.error('[playerStore] addToQueue failed:', track.title, e);
    }
  },
}));
