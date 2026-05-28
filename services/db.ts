import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('vibeflow.db');

export function initDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      artwork TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS playlist_tracks (
      id TEXT PRIMARY KEY,
      playlist_id TEXT NOT NULL,
      video_id TEXT NOT NULL,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      artwork TEXT,
      duration INTEGER NOT NULL,
      position INTEGER NOT NULL,
      added_at INTEGER NOT NULL,
      FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id TEXT NOT NULL,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      artwork TEXT,
      duration INTEGER NOT NULL,
      played_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cache_index (
      video_id TEXT PRIMARY KEY,
      file_path TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      last_access INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS downloaded_tracks (
      video_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      artwork TEXT,
      duration INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      downloaded_at INTEGER NOT NULL
    );
  `);
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  artwork?: string;
  created_at: number;
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  video_id: string;
  title: string;
  artist: string;
  artwork?: string;
  duration: number;
  position: number;
  added_at: number;
}

export interface HistoryEntry {
  id?: number;
  video_id: string;
  title: string;
  artist: string;
  artwork?: string;
  duration: number;
  played_at: number;
}

export function getPlaylists(): Playlist[] {
  return db.getAllSync('SELECT * FROM playlists ORDER BY created_at DESC') as Playlist[];
}

export function createPlaylist(playlist: Omit<Playlist, 'created_at'>): void {
  db.runSync(
    'INSERT INTO playlists (id, name, description, artwork, created_at) VALUES (?, ?, ?, ?, ?)',
    playlist.id, playlist.name, playlist.description ?? null, playlist.artwork ?? null, Date.now()
  );
}

export function deletePlaylist(id: string): void {
  db.runSync('DELETE FROM playlists WHERE id = ?', id);
}

export function renamePlaylist(id: string, name: string): void {
  db.runSync('UPDATE playlists SET name = ? WHERE id = ?', name, id);
}

export function reorderPlaylistTrack(itemId: string, newPosition: number): void {
  db.runSync('UPDATE playlist_tracks SET position = ? WHERE id = ?', newPosition, itemId);
}

export function getNextPosition(playlistId: string): number {
  const result = db.getFirstSync(
    'SELECT MAX(position) as mp FROM playlist_tracks WHERE playlist_id = ?',
    playlistId
  ) as any;
  return (result?.mp ?? -1) + 1;
}

export function swapTrackPositions(itemIdA: string, itemIdB: string): void {
  db.runSync(
    `UPDATE playlist_tracks SET position = CASE id WHEN ? THEN (SELECT position FROM playlist_tracks WHERE id = ?) WHEN ? THEN (SELECT position FROM playlist_tracks WHERE id = ?) END WHERE id IN (?, ?)`,
    itemIdA, itemIdB, itemIdB, itemIdA, itemIdA, itemIdB
  );
}

export function getPlaylistTracks(playlistId: string): PlaylistTrack[] {
  return db.getAllSync(
    'SELECT * FROM playlist_tracks WHERE playlist_id = ? ORDER BY position ASC',
    playlistId
  ) as PlaylistTrack[];
}

export function addTrackToPlaylist(track: PlaylistTrack): void {
  const maxPos = (db.getFirstSync(
    'SELECT MAX(position) as mp FROM playlist_tracks WHERE playlist_id = ?',
    track.playlist_id
  ) as any)?.mp ?? -1;
  db.runSync(
    'INSERT OR REPLACE INTO playlist_tracks (id, playlist_id, video_id, title, artist, artwork, duration, position, added_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    track.id, track.playlist_id, track.video_id, track.title, track.artist,
    track.artwork ?? null, track.duration, maxPos + 1, Date.now()
  );
}

export function removeTrackFromPlaylist(id: string): void {
  db.runSync('DELETE FROM playlist_tracks WHERE id = ?', id);
}

export function addToHistory(entry: Omit<HistoryEntry, 'id' | 'played_at'>): void {
  db.runSync(
    'DELETE FROM history WHERE video_id = ?',
    entry.video_id
  );
  db.runSync(
    'INSERT INTO history (video_id, title, artist, artwork, duration, played_at) VALUES (?, ?, ?, ?, ?, ?)',
    entry.video_id, entry.title, entry.artist, entry.artwork ?? null, entry.duration, Date.now()
  );
  db.runSync('DELETE FROM history WHERE id NOT IN (SELECT id FROM history ORDER BY played_at DESC LIMIT 100)');
}

export function getHistory(): HistoryEntry[] {
  return db.getAllSync('SELECT * FROM history ORDER BY played_at DESC LIMIT 50') as HistoryEntry[];
}

export interface DownloadedTrack {
  video_id: string;
  title: string;
  artist: string;
  artwork?: string;
  duration: number;
  file_path: string;
  file_size?: number;
  downloaded_at: number;
}

export function addDownload(track: DownloadedTrack): void {
  db.runSync(
    `INSERT OR REPLACE INTO downloaded_tracks (video_id, title, artist, artwork, duration, file_path, file_size, downloaded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    track.video_id, track.title, track.artist, track.artwork ?? null,
    track.duration, track.file_path, track.file_size ?? null, track.downloaded_at
  );
}

export function removeDownload(videoId: string): void {
  db.runSync('DELETE FROM downloaded_tracks WHERE video_id = ?', videoId);
}

export function getDownloads(): DownloadedTrack[] {
  return db.getAllSync('SELECT * FROM downloaded_tracks ORDER BY downloaded_at DESC') as DownloadedTrack[];
}

export function getDownload(videoId: string): DownloadedTrack | null {
  return db.getFirstSync('SELECT * FROM downloaded_tracks WHERE video_id = ?', videoId) as DownloadedTrack | null;
}
