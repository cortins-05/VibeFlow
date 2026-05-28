import type { ParsedTrack } from './csvParser';

const TITLE_KEYS = new Set(['title', 'track', 'name', 'song']);
const ARTIST_KEYS = new Set(['artist', 'artists', 'author', 'channel']);

function extractTrack(obj: Record<string, any>): ParsedTrack | null {
  let title = '';
  let artist = '';

  for (const key of Object.keys(obj)) {
    const lk = key.toLowerCase();
    if (TITLE_KEYS.has(lk) && typeof obj[key] === 'string') {
      title = obj[key].trim();
    }
    if (ARTIST_KEYS.has(lk)) {
      const v = obj[key];
      if (typeof v === 'string') artist = v.trim();
      else if (Array.isArray(v)) artist = v.join(', ').trim();
    }
  }

  if (title && artist) return { title, artist };
  return null;
}

function searchForTracks(data: any, depth = 0): ParsedTrack[] {
  if (depth > 8) return [];

  if (Array.isArray(data)) {
    const results: ParsedTrack[] = [];
    for (const item of data) {
      if (item && typeof item === 'object') {
        const direct = extractTrack(item);
        if (direct) {
          results.push(direct);
        } else {
          results.push(...searchForTracks(item, depth + 1));
        }
      }
    }
    return results;
  }

  if (data && typeof data === 'object') {
    // Check for common playlist wrappers
    if (data.tracks && Array.isArray(data.tracks)) {
      return searchForTracks(data.tracks, depth + 1);
    }
    if (data.items && Array.isArray(data.items)) {
      return searchForTracks(data.items, depth + 1);
    }
    if (data.entries && Array.isArray(data.entries)) {
      return searchForTracks(data.entries, depth + 1);
    }

    const results: ParsedTrack[] = [];
    for (const val of Object.values(data)) {
      if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
        results.push(...searchForTracks(val, depth + 1));
      }
    }
    return results;
  }

  return [];
}

export function parseJSON(text: string): ParsedTrack[] {
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    return [];
  }
  return searchForTracks(data);
}
