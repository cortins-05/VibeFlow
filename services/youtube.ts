import { Innertube } from 'youtubei.js';
import { restGetStreamSource } from './youtubeRest';

let client: Innertube | null = null;

async function getClient(): Promise<Innertube> {
  if (!client) {
    client = await Innertube.create({
      cache: undefined,
    });
  }
  return client;
}

export function resetClient(): void {
  client = null;
}

export interface VideoInfo {
  videoId: string;
  title: string;
  artist: string;
  artwork?: string;
  duration: number;
}

function extractVideoInfo(item: any): VideoInfo | null {
  const videoId = item.id ?? item.video_id;
  if (!videoId) return null;
  const title = item.title?.text ?? item.title ?? 'Unknown';
  const artist = item.author?.name ?? item.short_byline_text?.runs?.[0]?.text ?? 'Unknown';
  const thumbs = item.thumbnails ?? item.thumbnail?.thumbnails ?? [];
  const artwork = thumbs[thumbs.length - 1]?.url;
  const duration = item.duration?.seconds ?? item.length_seconds ?? 0;
  return { videoId, title, artist, artwork, duration };
}

export async function searchYouTube(query: string): Promise<VideoInfo[]> {
  const yt = await getClient();
  const results = await yt.search(query, { type: 'video' });
  const videos: VideoInfo[] = [];
  for (const item of (results.videos ?? []).slice(0, 20)) {
    const v = extractVideoInfo(item);
    if (v) videos.push(v);
  }
  return videos;
}

export async function getTrending(): Promise<VideoInfo[]> {
  const yt = await getClient();
  const home = await yt.getHomeFeed();
  const videos: VideoInfo[] = [];
  const contents = (home as any).contents;
  const items: any[] = [];

  if (contents?.contents) {
    for (const section of contents.contents) {
      const sectionItems = section?.contents ?? section?.items ?? [];
      for (const item of sectionItems) {
        const inner = item?.content ?? item;
        items.push(inner);
      }
    }
  }

  for (const item of items.slice(0, 20)) {
    const v = extractVideoInfo(item);
    if (v) videos.push(v);
  }
  return videos;
}

// Clients are tried in order until one returns a playable audio stream.
// ANDROID_VR is the only client confirmed to work without PoToken in 2026.
// It uses client version 1.65.10 (downgraded to avoid SABR-only streaming).
// Other clients are kept as fallbacks for edge cases.
const CLIENT_CASCADE = [
  'ANDROID_VR',
  'TV_EMBEDDED',
  'YTMUSIC_ANDROID',
  'YTMUSIC',
  'TV',
  'ANDROID',
  'IOS',
  'MWEB',
] as const;
type Client = (typeof CLIENT_CASCADE)[number];

// User-Agents matched to each InnerTube client. YouTube validates UA on the
// stream request and serves 403 when it doesn't match the issuing client.
const CLIENT_HEADERS: Record<Client, Record<string, string>> = {
  ANDROID: {
    'User-Agent': 'com.google.android.youtube/19.45.39 (Linux; U; Android 14; en_US; Pixel 8) gzip',
    'X-YouTube-Client-Name': '3',
    'X-YouTube-Client-Version': '19.45.39',
  },
  ANDROID_VR: {
    'User-Agent':
      'com.google.android.apps.youtube.vr.oculus/1.62.27 (Linux; U; Android 12L; SM-Q900Y) gzip',
    'X-YouTube-Client-Name': '28',
    'X-YouTube-Client-Version': '1.62.27',
  },
  IOS: {
    'User-Agent':
      'com.google.ios.youtube/19.45.4 (iPhone16,2; U; CPU iOS 18_1 like Mac OS X)',
    'X-YouTube-Client-Name': '5',
    'X-YouTube-Client-Version': '19.45.4',
  },
  TV_EMBEDDED: {
    'User-Agent':
      'Mozilla/5.0 (PlayStation; PlayStation 4/12.00) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
    'X-YouTube-Client-Name': '85',
    'X-YouTube-Client-Version': '2.0',
  },
  TV: {
    'User-Agent':
      'Mozilla/5.0 (ChromiumStylePlatform) Cobalt/24.lts.10.0-qa (unlike Gecko) v8/8.8.278.8-jit gles Starboard/15, SystemIntegratorName_ATVPLATFORM_2025/FW#26.5.45/Chipset_VENDOR_2025/FW#26.5.45 (Brand, Model, Wired) javascript',
    'X-YouTube-Client-Name': '7',
    'X-YouTube-Client-Version': '7.20250101.18.00',
  },
  YTMUSIC: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'X-YouTube-Client-Name': '67',
    'X-YouTube-Client-Version': '1.20250101.01.00',
    Origin: 'https://music.youtube.com',
  },
  YTMUSIC_ANDROID: {
    'User-Agent': 'com.google.android.apps.youtube.music/7.27.52 (Linux; U; Android 14; Pixel 8) gzip',
    'X-YouTube-Client-Name': '21',
    'X-YouTube-Client-Version': '7.27.52',
  },
  MWEB: {
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'X-YouTube-Client-Name': '2',
    'X-YouTube-Client-Version': '2.20241126.01.00',
  },
};

export interface StreamSource {
  url: string;
  type?: 'default' | 'dash' | 'hls' | 'smoothstreaming';
  headers?: Record<string, string>;
}

export async function getStreamSource(videoId: string): Promise<StreamSource> {
  try {
    const yt = await getClient();
    for (const c of CLIENT_CASCADE) {
      try {
        const source = await tryResolve(yt, videoId, c);
        if (source) {
          console.log('[youtube] stream resolved via', c, 'for', videoId);
          return source;
        }
      } catch (e) {
        console.log('[youtube] client', c, 'failed:', (e as Error).message);
      }
    }
  } catch (e) {
    console.warn('[youtube] primary pipeline failed:', (e as Error).message);
  }

  console.warn('[youtube] cascade exhausted, trying REST fallback');
  return restGetStreamSource(videoId);
}

// Back-compat shim — old callers expect just the URL.
export async function getStreamUrl(videoId: string): Promise<string> {
  return (await getStreamSource(videoId)).url;
}

/** Get a URL suitable for downloading a video's audio */
export async function getDownloadUrl(videoId: string): Promise<StreamSource> {
  try {
    const yt = await getClient();
    // Try progressive formats first — self-contained files with stable URLs.
    // Pick the smallest (lowest bitrate) since it contains both audio + video;
    // we only keep the audio, so smaller = faster with no quality loss.
    try {
      const info = await yt.getBasicInfo(videoId, { client: 'ANDROID_VR' });
      const progressive = (info.streaming_data?.formats ?? [])
        .filter((f: any) => f.has_audio)
        .sort((a: any, b: any) => (a.bitrate ?? 0) - (b.bitrate ?? 0));

      for (const f of progressive) {
        const url: string | undefined = f.url;
        if (url) {
          console.log('[youtube] download progressive, mime:', f.mime_type, 'bitrate:', f.bitrate);
          return { url, type: 'default', headers: { ...CLIENT_HEADERS.ANDROID_VR, Accept: '*/*' } };
        }
      }
    } catch (e) {
      console.log('[youtube] progressive download failed, falling back to adaptive:', (e as Error).message);
    }
  } catch (e) {
    console.warn('[youtube] youtubei.js init failed for download:', (e as Error).message);
  }

  // Fallback: adaptive audio via cascade → REST
  return getStreamSource(videoId);
}

function isHls(url: string): boolean {
  return /\.m3u8(\?|$)/.test(url);
}

async function tryResolve(
  yt: Innertube,
  videoId: string,
  c: Client,
): Promise<StreamSource | null> {
  // Use getBasicInfo (not getInfo) — getInfo crashes with ANDROID_VR because
  // YouTube's response format for that client isn't parseable by the library's
  // VideoInfo parser. getBasicInfo extracts streaming_data without parsing the
  // watch page, which is all we need.
  const info = await yt.getBasicInfo(videoId, { client: c });

  const formats = info.streaming_data?.adaptive_formats ?? [];
  const audioOnly = formats
    .filter((f: any) => f.has_audio && !f.has_video)
    .sort((a: any, b: any) => (a.bitrate ?? 0) - (b.bitrate ?? 0));

  console.log(
    '[youtube] tryResolve', videoId, 'client=', c,
    'formats:', formats.length,
    'audioOnly:', audioOnly.length,
  );

  if (audioOnly.length === 0) return null;

  // Target Opus 96k — excellent quality-to-size ratio; prefers Opus codec
  const MIN_BITRATE = 96_000;
  const opusAudio = audioOnly.filter((f: any) => f.mime_type?.includes('opus'));
  const best = (opusAudio.length > 0
    ? (opusAudio.find((f: any) => (f.bitrate ?? 0) >= MIN_BITRATE) ?? opusAudio[opusAudio.length - 1])
    : (audioOnly.find((f: any) => (f.bitrate ?? 0) >= MIN_BITRATE) ?? audioOnly[audioOnly.length - 1]));
  // Prefer pre-deciphered URL to avoid needing a JS evaluator in RN
  const url = best.url ?? (best.decipher ? await best.decipher(yt.session.player) : undefined);

  if (!url) return null;

  const headers = {
    ...CLIENT_HEADERS[c],
    Accept: '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    Origin: 'https://www.youtube.com',
    Referer: 'https://www.youtube.com/',
  };

  return {
    url,
    type: isHls(url) ? 'hls' : 'default',
    headers,
  };
}

export async function getVideoInfo(videoId: string): Promise<VideoInfo> {
  const yt = await getClient();
  const info = await yt.getBasicInfo(videoId);
  const details = info.basic_info;
  const thumbs = details.thumbnail ?? [];
  return {
    videoId,
    title: details.title ?? 'Unknown',
    artist: details.author ?? 'Unknown',
    artwork: thumbs[thumbs.length - 1]?.url,
    duration: details.duration ?? 0,
  };
}
