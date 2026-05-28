# Información Relevante — VibeFlow

## Arquitectura

### Stack
- **Framework:** Expo (React Native) con expo-router (file-based routing)
- **Reproductor:** react-native-track-player (v4)
- **YouTube:** youtubei.js (librería Innertube API)
- **DB local:** expo-sqlite (SQLite síncrono)
- **Descargas:** expo-file-system/legacy (DownloadResumable)
- **Estado:** Zustand stores
- **Navegación:** expo-router con tabs + stack anidados

### Stores (Zustand)
| Store | Archivo | Propósito |
|-------|---------|-----------|
| playerStore | `stores/playerStore.ts` | Track actual, queue, play/resolve |
| libraryStore | `stores/libraryStore.ts` | Favoritos, playlists, historial |
| downloadStore | `stores/downloadStore.ts` | Registro de descargas, CRUD |

### DB (SQLite — `services/db.ts`)
Tablas: `playlists`, `playlist_tracks`, `history`, `cache_index`, `downloaded_tracks`

`DownloadedTrack` schema:
```
video_id TEXT PK, title, artist, artwork?, duration, file_path, file_size?, downloaded_at
```

### Track type (`stores/playerStore.ts`)
```ts
interface Track {
  id: string;
  videoId: string;
  url?: string;
  title: string;
  artist: string;
  artwork?: string;
  duration: number;
}
```

---

## YouTube — Consideraciones Críticas

### No hay JS evaluator en React Native
youtubei.js necesita el módulo `vm` de Node para `decipher()`. React Native **no lo tiene**. Error típico:

> "To decipher URLs, you must provide your own JavaScript evaluator"

### Solución: ANDROID_VR client
- El client `ANDROID_VR` devuelve URLs **pre-decodificadas** — `best.url` ya viene setteada.
- `best.decipher` existe como función pero **falla** si se invoca (por falta de JS evaluator).
- **Regla de oro:** siempre preferir `best.url ?? best.decipher()`.
- La función `tryResolve()` en `services/youtube.ts` implementa esto.

### Clients cascade
Orden definido en `CLIENT_CASCADE`:
1. `ANDROID_VR` — el más confiable, pre-deciphered URLs
2. `TV_EMBEDDED`, `YTMUSIC_ANDROID`, `YTMUSIC`, `TV`, `ANDROID`, `IOS`, `MWEB` — fallbacks

Cada uno requiere headers específicos (`User-Agent`, `X-YouTube-Client-Name`, `X-YouTube-Client-Version`) que coincidan con el client usado para obtener el streaming_data. YouTube valida estos headers y devuelve 403 si no coinciden.

### getBasicInfo vs getInfo
- **Siempre usar `getBasicInfo`**, nunca `getInfo`.
- `getInfo` intenta parsear la watch page completa; con `ANDROID_VR` el formato de respuesta de YouTube no es parseable por el parser de la librería y crashea.
- `getBasicInfo` extrae `streaming_data` sin parsear la watch page — suficiente para obtener URLs.

### Formatos de stream

**Progressive** (`streaming_data.formats`):
- Contienen audio+video en un archivo autocontenido
- URLs más estables, mejor CDN
- Preferidos para descarga (se elige el de menor bitrate para descargar rápido — descartamos el video igual)
- Se acceden con `ANDROID_VR` (sin cascade loop)

**Adaptive** (`streaming_data.adaptive_formats`):
- Solo audio (sin video)
- Preferir Opus codec (mejor calidad/tamaño)
- Target: 96kbps minimum
- URLs pueden expirar más rápido
- Se usa como fallback cuando no hay progressive

### Descargas
- Flujo: `getDownloadUrl()` → progressive (ANDROID_VR) → fallback adaptive (cascade)
- Formato de archivo: `.webm` si la URL contiene `.webm`, sino `.m4a`
- Directorio: `documentDirectory/audio/`
- Nombre sanitizado: `title.replace(/[/\\?%*:|"<>]/g, '_')`
- Se usa `expo-file-system/legacy` (no el moderno) porque el legacy exporta `DownloadResumable`, `deleteAsync`, etc.

---

## Reproductor (TrackPlayer)

### PlaybackActiveTrackChanged
- El event handler recibe `event.index` que **siempre es 0** (TrackPlayer maneja 1 track a la vez).
- **No se puede matchear por index.** En su lugar, matchear por `videoId`.
- Implementado en `app/_layout.tsx`:
  ```ts
  if (event.track?.videoId === playerStoreState.currentTrack?.videoId) return;
  playerStoreState.playTrack(event.track as Track);
  ```

### Skip (Next/Previous)
- `TrackPlayer.skipToNext()` / `skipToPrevious()` **no funcionan** porque solo hay 1 track en la cola.
- Solución: handlers en `player.tsx` usan la queue del store + `playQueue()`.
  - `handleNext()`: avanza índice en store queue y llama `playQueue()`
  - `handlePrev()`: retrocede (o restart si > 3s de progreso)

### ResolveSource
- `playerStore.resolveSource()` chequea primero `downloadStore.getLocalPath(videoId)`.
- Si existe archivo local, retorna URI `file://` en vez de hacer fetch a YouTube.
- Esto permite reproducción offline.

---

## Descargas — Sistema Completo

### Pipeline
1. `getDownloadUrl(videoId)` → obtiene URL del stream
2. `createDownloadResumable(url, destFile, headers, callback, resumeData?)`
3. `resumable.downloadAsync()` → descarga archivo
4. `registerDownload(track, result.uri)` → guarda en DB + store

### Estados del botón
| Estado | UI |
|--------|----|
| `idle` | "Download" outline |
| `downloading` | Progress bar + % + pause button |
| `pausing` | Spinner (transición breve) |
| `paused` | Progress bar amber + play resume |
| `done` | "Saved ✓" green badge |
| `error` | "Failed – tap retry" red badge |

### Pause/Resume
- `pauseAsync()` devuelve `{ resumeData }` — contiene la URL original + bytes descargados
- Se guarda `resumeData` en un ref (`downloadResumeDataRef`)
- Al reanudar: se crea un nuevo `DownloadResumable` con el mismo `resumeData`
- Se guarda la URL original en `downloadUrlRef` para no re-fetchearla al reanudar
- Los errores que contienen "cancelled" o "pause" se ignoran (no muestran error)

### Prevención de descargas duplicadas
- Al cambiar de track, useEffect chequea `isDownloaded(videoId)`
- Si ya descargado, estado = `'done'` desde el inicio
- También se inicializa en `'done'` si `currentTrack` ya está descargado

---

## UI/UX Patterns

### Estilos globales (Neon theme, default)
- Fondo: `#0b0c0b`
- Texto primario: `#e6ebe3`
- Texto secundario: `#6f7a6c`
- Texto muted: `#3a423a`
- Acento (neon yellow): `#e5ff3a`
- Secundario (cyan): `#3df5e0`
- Bordes: `rgba(230,235,227,0.08)` sutil
- Fuentes: Manrope (display), JetBrains Mono (mono/etiquetas), Fraunces (títulos decorativos)
- Layout: prompts `vibeflow ~/path $ ` + blinking caret, headers `[ SECTION ]──[NN]`, buttons `[ label ]`, radius 4-6px (no pills)

### TrackRow
- Componente reutilizable en `components/TrackRow.tsx`
- Muestra: número, artwork (o placeholder gradient), título, artista
- Recibe `track`, `index`, `onPress`

### Bottom Sheet en discover
- Sheet personalizada (React Native `Modal` + `PanResponder` + `Animated`)
- Snap points: 60%, 85%, 100%
- Drag handle + indicador de scroll

---

## Theme System (3 temas switchables)

### Arquitectura
```
constants/themes.ts → definiciones de 3 temas (neon/frost/industrial)
stores/themeStore.ts → Zustand + persist (AsyncStorage) guarda themeName
constants/theme.ts → exporta useTheme() hook reactivo, exporta COLORS/FONTS estáticos (default neon)
```

### Hook reactivo
```ts
// En cualquier componente:
const { colors, fonts } = useTheme();
// colors.bg, colors.text, colors.accent, fonts.mono, fonts.sans, etc.
```

### Temas
| Tema | bg | accent | fonts |
|------|----|--------|-------|
| **neon** | `#0b0c0b` | `#e5ff3a` (amarillo) | JetBrains Mono + Manrope |
| **frost** | `#f5f0eb` (claro) | `#00bfff` (azul) | JetBrains Mono + Manrope |
| **industrial** | `#1c1c1c` | `#ff6b35` (naranja) | IBM Plex Mono + Inter |

### Migración
- 27+ archivos migrados de `import { COLORS, FONTS }` → `const { colors, fonts } = useTheme()`
- `ThemeSelector` en Settings: inline dropdown con 3 opciones, radio indicators, color swatch
- Cambio instantáneo sin reinicio (Zustand reactivo)
- Fonts de industrial (Inter, IBM Plex Mono) cargados en splash junto con los demás
- **TrackRow useCallback fix**: colors/fonts en dependency arrays para evitar closures stale al cambiar tema

---

## Playlist Importer

### Pipeline
```
expo-document-picker → file URI → copyAsync a cacheDirectory (permiso URI)
  → readAndParseFile() → detecta formato (csv|json|txt) → parsea
  → [(artist, title)] → searchAndMatch() con batching 5 en paralelo
  → [{original, match, confidence}] → ImportReviewModal (6 fases)
  → createPlaylist() + addTrackToPlaylist()
```

### Archivos
| Archivo | Rol |
|---------|-----|
| `services/playlistImporter.ts` | Orquestador: detectFormat, parseFile, searchAndMatch, computeConfidence, matchedTracksToTracks, readAndParseFile |
| `services/csvParser.ts` | CSV sin dependencias: split por newline, headers case-insensitive, soporta quotes, mapea columnas Title/Artist/track_name/etc |
| `services/jsonParser.ts` | JSON: recursive search de arrays con objetos que tengan keys title/artist |
| `services/txtParser.ts` | TXT: regex `^(.+)\s*[-–—]\s*(.+)$`, ignora URLs de YouTube, salta líneas vacías |
| `components/ImportReviewModal.tsx` | Modal de 6 fases (reading→searching→review→saving→done→error) con barra de progreso, cancelación via AbortController, pantalla de error con reintentar/cerrar |
| `components/ImportTrigger.tsx` | Componente reutilizable: DocumentPicker + copyAsync + ImportReviewModal. Variante compact (Library) y full-width (Settings) |

### Confidence scoring
- normalize(): lowercase, remove punctuation, collapse whitespace
- removeNoise(): quita "(Official Video)", "(Lyrics)", "| ...", "vevo", etc.
- wordOverlap(): Set-based word intersection/union
- computeConfidence(): 
  - title exact match → 98
  - YT title contains original title → 95
  - word overlap ≥70% → 70 + overlap×25 + artistMatch bonus
  - <70% → overlap%
  - no results → 0

### Manejo de errores
- `FileError` con tipos: read_error, parse_error, no_tracks, unsupported_format
- ImportReviewModal muestra título + mensaje + botones reintentar/cerrar
- AbortController cancela búsquedas entre batches (checked cada 5 tracks)
- `cancelled` flag + `signal.aborted` check en search loop

### URI Permission Fix
Android revoca permisos de content:// URIs cuando el Activity pierde foco. Solución: copiar el archivo a `FileSystem.cacheDirectory + 'import/'` inmediatamente después de `DocumentPicker.getDocumentAsync()`, antes de cualquier operación async que pueda causar un re-render o cambio de Activity.

---

## UI/UX Patterns

### Bug: Click en trending no reproduce la canción correcta
**Causa:** `PlaybackActiveTrackChanged` matcheaba por `event.index === 0`, pero
cuando se saltaban tracks en la lista (por caching o lazy load), el índice
no correspondía al track clickeado.

**Fix:** Matchear por `videoId`.

### Bug: SkipToNext/SkipToPrevious no funcionan
**Causa:** TrackPlayer solo tiene 1 track en cola; `skipToNext()` y
`skipToPrevious()` no tienen adónde ir.

**Fix:** Handlers que iteran sobre la queue del store.

### Bug: Downloads fallan con "cannot decipher URL"
**Causa:** `tryResolve()` usaba `best.decipher()` sin chequear `best.url` primero.

**Fix:** `const url = best.url ?? (best.decipher ? await best.decipher(...) : undefined)`

### Bug: Downloads fallan mid-stream (403/timestamp expirado)
**Causa:** Faltaban headers específicos del client ANDROID_VR en la request de descarga.
El User-Agent genérico de Chrome no coincidía con el client usado para obtener la URL.

**Fix:** Siempre incluir `CLIENT_HEADERS.ANDROID_VR` en las requests de descarga,
incluyendo `Accept: '*/*'`.

---

## Build / Deploy

- **No usar `expo build`.** Usar `npx expo run:android` (build local con Android Studio/Gradle).
- **Release APK**:
  ```sh
  npx expo prebuild --no-install    # solo si hay cambios en Gradle
  cd android && ./gradlew app:createBundleReleaseJsAndAssets app:assembleRelease
  adb install -r android/app/build/outputs/apk/release/app-release.apk
  cp android/app/build/outputs/apk/release/app-release.apk ~/Projects/APKs/
  ```
- El proyecto usa config-plugin para track player (expo-build-properties).
- SDK 56 (Expo), RN 0.85.3.
- Las builds release se copian automáticamente a `~/Projects/APKs/` con timestamp.
- Para probar descargas offline: build APK, instalar en dispositivo, descargar, poner en modo avión.
