import * as FileSystem from 'expo-file-system';
import { parseCSV } from './csvParser';
import { parseJSON } from './jsonParser';
import { parseTXT } from './txtParser';
import { searchYouTube, type VideoInfo } from './youtube';
import type { Track } from '../stores/playerStore';

export interface ParsedTrack {
  title: string;
  artist: string;
}

export interface MatchedTrack {
  original: ParsedTrack;
  match: VideoInfo | null;
  confidence: number;
}

type FileFormat = 'csv' | 'json' | 'txt';

function detectFormat(uri: string, text: string): FileFormat {
  const ext = uri.toLowerCase().split('.').pop();
  if (ext === 'csv') return 'csv';
  if (ext === 'json') return 'json';
  if (ext === 'txt') return 'txt';

  // Content sniffing fallback
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
  if (trimmed.includes(',')) return 'csv';
  return 'txt';
}

function parseFile(text: string, format: FileFormat): ParsedTrack[] {
  switch (format) {
    case 'csv':
      return parseCSV(text);
    case 'json':
      return parseJSON(text);
    case 'txt':
      return parseTXT(text);
  }
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function removeNoise(title: string): string {
  return title
    .replace(/\(official\s+(lyric\s+)?video\)/gi, '')
    .replace(/\(official\s+audio\)/gi, '')
    .replace(/\(lyrics?\)/gi, '')
    .replace(/\(audio\)/gi, '')
    .replace(/\(hd\)/gi, '')
    .replace(/\(4k\)/gi, '')
    .replace(/\(60fps\)/gi, '')
    .replace(/\s*\|\s*.+$/, '')
    .replace(/vevo/i, '')
    .trim();
}

function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(a.split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  const union = wordsA.size + wordsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function computeConfidence(original: ParsedTrack, video: VideoInfo): number {
  const normTitle = normalize(removeNoise(video.title));
  const normOrigTitle = normalize(original.title);
  const normArtist = normalize(video.artist);

  // Exact title match
  if (normTitle === normOrigTitle) return 98;

  // YT title contains original title
  if (normTitle.includes(normOrigTitle)) return 95;

  // Artist appears in YT title or channel name
  const normOrigArtist = normalize(original.artist);
  const artistMatch = normTitle.includes(normOrigArtist) || normArtist.includes(normOrigArtist);

  // Word overlap
  const overlap = wordOverlap(normTitle, normOrigTitle);
  if (overlap >= 0.7) {
    return Math.round(70 + overlap * 25 + (artistMatch ? 5 : 0));
  }
  return Math.round(overlap * 100);
}

export async function searchAndMatch(
  tracks: ParsedTrack[],
  onProgress?: (done: number, total: number) => void
): Promise<MatchedTrack[]> {
  const results: MatchedTrack[] = [];
  const BATCH_SIZE = 5;

  for (let i = 0; i < tracks.length; i += BATCH_SIZE) {
    const batch = tracks.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (track) => {
        // Try "Artist - Title" first
        const query1 = `${track.artist} - ${track.title}`;
        const results1 = await searchYouTube(query1);
        if (results1.length > 0) {
          const best = results1[0];
          const conf = computeConfidence(track, best);
          if (conf >= 70) {
            return { original: track, match: best, confidence: conf };
          }
        }

        // Fallback: search just the title
        const results2 = await searchYouTube(track.title);
        if (results2.length > 0) {
          const best = results2[0];
          const conf = computeConfidence(track, best);
          return { original: track, match: best, confidence: conf };
        }

        return { original: track, match: null, confidence: 0 };
      })
    );
    results.push(...batchResults);

    if (onProgress) {
      onProgress(Math.min(i + BATCH_SIZE, tracks.length), tracks.length);
    }
  }

  return results;
}

export function matchedTracksToTracks(matched: MatchedTrack[]): Track[] {
  return matched
    .filter((m) => m.match)
    .map((m) => ({
      id: m.match!.videoId,
      videoId: m.match!.videoId,
      title: m.match!.title,
      artist: m.match!.artist,
      artwork: m.match!.artwork,
      duration: m.match!.duration,
    }));
}

export async function importPlaylistFromFile(
  uri: string
): Promise<{ name: string; tracks: ParsedTrack[] } | null> {
  try {
    const text = await FileSystem.readAsStringAsync(uri);
    const format = detectFormat(uri, text);
    const tracks = parseFile(text, format);
    if (tracks.length === 0) return null;

    const name = uri.split('/').pop()?.replace(/\.[^.]+$/, '') || 'Imported Playlist';
    return { name, tracks };
  } catch {
    return null;
  }
}
