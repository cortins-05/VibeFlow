import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import {
  getPlaylists,
  createPlaylist,
  deletePlaylist,
  getPlaylistTracks,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  getHistory,
  type Playlist,
  type PlaylistTrack,
  type HistoryEntry,
} from '../services/db';
import type { Track } from './playerStore';

const storage = createMMKV();

export interface FavoriteTrack {
  videoId: string;
  title: string;
  artist: string;
  artwork?: string;
  duration: number;
  addedAt: number;
}

interface LibraryStore {
  playlists: Playlist[];
  history: HistoryEntry[];
  favorites: Set<string>;
  favoriteTracks: FavoriteTrack[];
  loadLibrary: () => void;
  createPlaylist: (name: string, description?: string) => void;
  deletePlaylist: (id: string) => void;
  getPlaylistTracks: (playlistId: string) => PlaylistTrack[];
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (itemId: string) => void;
  toggleFavorite: (videoId: string, track?: Omit<Track, 'id'>) => void;
  isFavorite: (videoId: string) => boolean;
}

function loadFavorites(): Set<string> {
  const raw = storage.getString('favorites');
  if (!raw) return new Set();
  return new Set(JSON.parse(raw));
}

function saveFavorites(set: Set<string>) {
  storage.set('favorites', JSON.stringify([...set]));
}

function loadFavoriteTracks(): FavoriteTrack[] {
  const raw = storage.getString('favoriteTracks');
  if (!raw) return [];
  return JSON.parse(raw);
}

function saveFavoriteTracks(tracks: FavoriteTrack[]) {
  storage.set('favoriteTracks', JSON.stringify(tracks));
}

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  playlists: [],
  history: [],
  favorites: loadFavorites(),
  favoriteTracks: loadFavoriteTracks(),

  loadLibrary: () => {
    set({
      playlists: getPlaylists(),
      history: getHistory(),
    });
  },

  createPlaylist: (name, description) => {
    const id = `pl_${Date.now()}`;
    createPlaylist({ id, name, description });
    set((s) => ({ playlists: [{ id, name, description, created_at: Date.now() }, ...s.playlists] }));
  },

  deletePlaylist: (id) => {
    deletePlaylist(id);
    set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) }));
  },

  getPlaylistTracks: (playlistId) => getPlaylistTracks(playlistId),

  addTrackToPlaylist: (playlistId, track) => {
    const item: PlaylistTrack = {
      id: `pt_${Date.now()}`,
      playlist_id: playlistId,
      video_id: track.videoId,
      title: track.title,
      artist: track.artist,
      artwork: track.artwork,
      duration: track.duration,
      position: 0,
      added_at: Date.now(),
    };
    addTrackToPlaylist(item);
  },

  removeTrackFromPlaylist: (itemId) => {
    removeTrackFromPlaylist(itemId);
  },

  toggleFavorite: (videoId, track) => {
    const favs = new Set(get().favorites);
    const tracks = [...get().favoriteTracks];
    if (favs.has(videoId)) {
      favs.delete(videoId);
      set({ favorites: favs, favoriteTracks: tracks.filter((t) => t.videoId !== videoId) });
    } else {
      favs.add(videoId);
      if (track) {
        tracks.unshift({
          videoId,
          title: track.title,
          artist: track.artist,
          artwork: track.artwork,
          duration: track.duration,
          addedAt: Date.now(),
        });
      }
      set({ favorites: favs, favoriteTracks: tracks });
    }
    saveFavorites(favs);
    saveFavoriteTracks(get().favoriteTracks);
  },

  isFavorite: (videoId) => get().favorites.has(videoId),
}));
