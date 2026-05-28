export interface ParsedTrack {
  title: string;
  artist: string;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

const TITLE_KEYS = new Set(['title', 'track name', 'track_name', 'track', 'name', 'song', 'song title']);
const ARTIST_KEYS = new Set(['artist', 'artist name(s)', 'artist name', 'artist_names', 'artist_name', 'author', 'channel', 'artists']);

function detectHeader(
  headers: string[]
): { titleIdx: number; artistIdx: number } | null {
  let titleIdx = -1;
  let artistIdx = -1;

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toLowerCase().trim();
    if (TITLE_KEYS.has(h)) titleIdx = i;
    if (ARTIST_KEYS.has(h)) artistIdx = i;
  }

  if (titleIdx === -1 || artistIdx === -1) return null;
  return { titleIdx, artistIdx };
}

export function parseCSV(text: string): ParsedTrack[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const mapping = detectHeader(headers);
  if (!mapping) return [];

  const tracks: ParsedTrack[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    const title = fields[mapping.titleIdx]?.trim();
    const artist = fields[mapping.artistIdx]?.trim();
    if (title && artist) {
      tracks.push({ title, artist });
    }
  }
  return tracks;
}
