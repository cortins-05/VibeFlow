import { useState, useEffect } from 'react';
import { fetchLyrics, type LyricLine } from '../services/lyrics';
import type { Track } from '../stores/playerStore';

export function useLyrics(currentTrack: Track | null, position: number) {
  const [lyrics, setLyrics] = useState<LyricLine[] | null>(null);
  const [activeLyricIdx, setActiveLyricIdx] = useState(0);

  useEffect(() => {
    if (currentTrack) {
      fetchLyrics(currentTrack.title, currentTrack.artist, currentTrack.duration).then(setLyrics);
    }
  }, [currentTrack?.videoId]);

  useEffect(() => {
    if (!lyrics) return;
    const idx = lyrics.findLastIndex((l) => l.time <= position);
    if (idx !== activeLyricIdx) setActiveLyricIdx(idx);
  }, [position, lyrics]);

  return { lyrics, activeLyricIdx };
}
