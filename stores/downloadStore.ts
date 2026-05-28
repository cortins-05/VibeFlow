import { create } from 'zustand';
import * as FileSystem from 'expo-file-system/legacy';
import { getDownloads, addDownload, removeDownload, type DownloadedTrack } from '../services/db';
import type { Track } from './playerStore';

interface DownloadStore {
  downloads: DownloadedTrack[];
  loadDownloads: () => void;
  registerDownload: (track: Track, filePath: string, fileSize?: number) => void;
  deleteDownload: (videoId: string) => Promise<void>;
  isDownloaded: (videoId: string) => boolean;
  getLocalPath: (videoId: string) => string | null;
}

export const useDownloadStore = create<DownloadStore>((set, get) => ({
  downloads: [],

  loadDownloads: () => {
    set({ downloads: getDownloads() });
  },

  registerDownload: (track, filePath, fileSize) => {
    const entry: DownloadedTrack = {
      video_id: track.videoId,
      title: track.title,
      artist: track.artist,
      artwork: track.artwork,
      duration: track.duration,
      file_path: filePath,
      file_size: fileSize,
      downloaded_at: Date.now(),
    };
    addDownload(entry);
    set((s) => ({ downloads: [entry, ...s.downloads] }));
  },

  deleteDownload: async (videoId) => {
    const entry = get().downloads.find((d) => d.video_id === videoId);
    if (entry) {
      try {
        await FileSystem.deleteAsync(entry.file_path, { idempotent: true });
      } catch {}
    }
    removeDownload(videoId);
    set((s) => ({ downloads: s.downloads.filter((d) => d.video_id !== videoId) }));
  },

  isDownloaded: (videoId) => {
    return get().downloads.some((d) => d.video_id === videoId);
  },

  getLocalPath: (videoId) => {
    const entry = get().downloads.find((d) => d.video_id === videoId);
    return entry?.file_path ?? null;
  },
}));
