import type { ParsedTrack } from './csvParser';

// Matches "Artist - Title", "Artist – Title" (en dash), "Artist — Title" (em dash)
const TRACK_REGEX = /^(.+?)\s*[-–—]\s*(.+)$/;
const YT_URL_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function parseTXT(text: string): ParsedTrack[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const tracks: ParsedTrack[] = [];
  for (const line of lines) {
    // Skip common non-track lines
    if (
      /^#/.test(line) ||
      /^\/\//.test(line) ||
      /^(playlist|spotify|youtube|track|song|artist)/i.test(line)
    )
      continue;

    // YouTube URL: extract videoId, skip (can't get title/artist without search)
    const ytMatch = line.match(YT_URL_REGEX);
    if (ytMatch) continue;

    const match = line.match(TRACK_REGEX);
    if (match) {
      const artist = match[1].trim();
      const title = match[2].trim();
      if (artist && title) {
        tracks.push({ artist, title });
      }
    }
  }
  return tracks;
}
