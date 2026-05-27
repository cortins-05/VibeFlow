export interface LyricLine {
  time: number;
  text: string;
}

export async function fetchLyrics(
  title: string,
  artist: string,
  duration?: number
): Promise<LyricLine[] | null> {
  try {
    const params = new URLSearchParams({ track_name: title, artist_name: artist });
    if (duration) params.set('duration', String(Math.round(duration)));
    const res = await fetch(`https://lrclib.net/api/get?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.syncedLyrics) return null;
    return parseLRC(data.syncedLyrics);
  } catch {
    return null;
  }
}

function parseLRC(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  for (const raw of lrc.split('\n')) {
    const match = raw.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
    if (!match) continue;
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const centis = parseInt(match[3].padEnd(3, '0'), 10);
    const time = minutes * 60 + seconds + centis / 1000;
    const text = match[4].trim();
    if (text) lines.push({ time, text });
  }
  return lines;
}
