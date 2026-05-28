# Playlist Importer — Design Spec

## Overview

Import Spotify playlists into VibeFlow. User exports a playlist from any web tool (Soundiiz, TuneMyMusic, etc.) as CSV, JSON, or TXT → picks the file in VibeFlow → app parses it, searches each track on YouTube, and creates a playlist.

## Architecture

```
[expo-document-picker] → file URI
       ↓
[PlaylistImporter service] → reads file, detects format, parses
       ↓
  (artist, title)[] pairs
       ↓
[searchYouTube() × N] → each track searched in parallel (batched)
       ↓
  { original, match, confidence }[]
       ↓
[ReviewModal] → user confirms/rejects low-confidence matches
       ↓
[Naming prompt] → user names the playlist
       ↓
[libraryStore.createPlaylist() + addTrackToPlaylist()]
```

## New Files

### `services/playlistImporter.ts`

**Detect format** by file extension + content sniffing:
- `.csv` → parse rows, detect headers by known names
- `.json` → `JSON.parse`, find array of objects with title/artist keys
- `.txt` → split lines, try `"Artist - Title"` pattern or YouTube URLs

**Column/key mapping** (normalize any input):

```
title | Title | Track Name | track_name | track | name → title
artist | Artist | Artist Name(s) | artist_name | author | channel → artist
```

**`parseFile(uri: string): Promise<{artist: string; title: string}[]>`**
- Reads file via `expo-file-system`
- Detects format
- Returns normalized track list

**`async function searchAndMatch(tracks: TrackInput[]): Promise<MatchedTrack[]>`**
- Batches searches (5 at a time to avoid rate limits)
- For each: calls `searchYouTube("artist - title")` repeatedly (up to 3 retries with fallback: try just title if artist-title fails)
- Computes confidence score (0-100)
- Returns array of `{ original, match: VideoInfo | null, confidence }`

**Confidence function** (no external libs):
- Normalize: lowercase, remove punctuation, collapse whitespace
- If normalized YT title **contains** normalized original title → 95
- If ≥70% word overlap → 70 + (overlap% × 0.3)
- If <70% → overlap%
- If no results → 0

### `services/csvParser.ts`
Simple CSV parser without dependencies:
- Reads raw text
- Splits by newline
- Parses headers from first row (comma-separated, handles quotes)
- Maps rows by detected header names

### `services/jsonParser.ts`
- `JSON.parse` the text
- Recursively searches for arrays of objects
- For each object, looks for known keys (title, artist, etc.)
- Returns matches

### `services/txtParser.ts`
- Splits by newline
- For each line: tries regex `^(.+)\s*[-–—]\s*(.+)$` → {artist, title}
- If line is YouTube URL: extracts videoId, skips search (direct match)
- Skips empty lines and common non-track lines

### `components/ImportReviewModal.tsx`
Modal triggered after all tracks are searched:
- "Import Review" header with matched/total count
- List of low-confidence tracks (<70%), each with:
  - Original `"Artist - Title"`
  - Found `"YouTube Title - Channel"`
  - Toggle on/off (default: on)
- "Import X tracks" button at bottom
- TextInput for playlist name (placeholder: imported playlist name or "Imported Playlist")
- On confirm: calls `libraryStore.createPlaylist(name)`, then `addTrackToPlaylist` for each confirmed track

### Import Button in Library
- In the Library screen, below "Playlists" section header, add an "Import" button
- Opens `expo-document-picker` with `type: ['text/csv', 'text/plain', 'application/json', '*/*']`
- On file selected: shows a loading state, runs importer, opens ReviewModal

## Constraints & Golden Rules
- **NO dependencies beyond what's installed** — no csv-parse, no papaparse, no fast-levenshtein
- **backend untouched** — `services/youtube.ts`, download pipeline, etc. not modified
- Uses existing `searchYouTube()` from `services/youtube.ts`
- Stores playlist via existing `libraryStore` methods
- All new code in dedicated files, no logic in components

## Error Handling
- File not readable → alert user, abort
- No tracks found → alert user, abort  
- Search fails for individual track → confidence 0, shows in dudosos
- User cancels picker → no-op
- Review modal without confirmed tracks → disabled import button
