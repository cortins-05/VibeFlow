// Direct REST fallback for YouTube playback.
// Zero dependency on youtubei.js — raw fetch against the InnerTube API.
//
// -------------------------------------------------------------------------
// Why this file looks the way it does (August 2026 breakage)
// -------------------------------------------------------------------------
// ANDROID_VR used to be the one client that returned pre-deciphered URLs with
// no Proof-of-Origin token. In mid-August 2026 YouTube started demanding a GVS
// PO token for every ANDROID_VR format except itag 18, so its media URLs now
// answer 403 to every byte range.
//
// The trap is that the *player* response still comes back with
// playabilityStatus === 'OK' and perfectly well-formed URLs. Only the media
// server rejects them. A resolver that trusts the player response therefore
// hands ExoPlayer a dead URL and the app fails silently.
//
// Two consequences shape the code below:
//   1. IOS leads the cascade — it still serves full, unthrottled media.
//   2. Nothing is returned without being *verified* against the media server
//      first (see `verifySource`). That keeps the cascade self-healing: when
//      YouTube breaks the next client, resolution falls through to a working
//      one instead of silently returning a URL that cannot play.

import { getVisitorData } from './youtubeSession';

const INNERTUBE_API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
const INNERTUBE_BACKUP_KEY = 'AIzaSyB-63vPrJDKp1nR7Ho9QFnB39E2Kj6Y6QU';

interface ClientConfig {
  label: string;
  clientId: number;
  userAgent: string;
  apiKey?: string;
  /** Extra fields merged into context.client */
  context: Record<string, unknown> & { clientName: string; clientVersion: string };
}

// Ordered by what actually delivers bytes today. Keep ANDROID_VR last: it
// resolves but is PO-token-capped, so verification will reject it — it stays
// only because it costs nothing and may be un-broken later.
const REST_CLIENTS: ClientConfig[] = [
  {
    label: 'IOS 20.10.4',
    clientId: 5,
    userAgent: 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)',
    context: {
      clientName: 'IOS',
      clientVersion: '20.10.4',
      deviceMake: 'Apple',
      deviceModel: 'iPhone16,2',
      osName: 'iPhone',
      osVersion: '18.3.2.22D82',
    },
  },
  // Only 20.x client versions are accepted; 19.x is rejected with HTTP 400.
  {
    label: 'IOS 20.14.2',
    clientId: 5,
    userAgent: 'com.google.ios.youtube/20.14.2 (iPhone16,2; U; CPU iOS 18_4_0 like Mac OS X;)',
    context: {
      clientName: 'IOS',
      clientVersion: '20.14.2',
      deviceMake: 'Apple',
      deviceModel: 'iPhone16,2',
      osName: 'iPhone',
      osVersion: '18.4.0.22E240',
    },
  },
  {
    label: 'IOS 20.03.02',
    clientId: 5,
    userAgent: 'com.google.ios.youtube/20.03.02 (iPhone16,2; U; CPU iOS 18_2_1 like Mac OS X;)',
    context: {
      clientName: 'IOS',
      clientVersion: '20.03.02',
      deviceMake: 'Apple',
      deviceModel: 'iPhone16,2',
      osName: 'iPhone',
      osVersion: '18.2.1.22C161',
    },
  },
  // IOS_MUSIC (client 26) is deliberately absent: it answers LOGIN_REQUIRED for
  // anonymous requests regardless of visitorData, so it only ever costs a round
  // trip.
  {
    label: 'IOS 20.10.4 (bk)',
    clientId: 5,
    apiKey: INNERTUBE_BACKUP_KEY,
    userAgent: 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)',
    context: {
      clientName: 'IOS',
      clientVersion: '20.10.4',
      deviceMake: 'Apple',
      deviceModel: 'iPhone16,2',
      osName: 'iPhone',
      osVersion: '18.3.2.22D82',
    },
  },
  {
    label: 'ANDROID_VR 1.65.10',
    clientId: 28,
    userAgent:
      'com.google.android.apps.youtube.vr.oculus/1.65.10 (Linux; U; Android 14; SM-Q900Y) gzip',
    context: { clientName: 'ANDROID_VR', clientVersion: '1.65.10', androidSdkVersion: 34 },
  },
];

export interface StreamSource {
  url: string;
  type?: 'default' | 'dash' | 'hls' | 'smoothstreaming';
  headers?: Record<string, string>;
  /** Total size in bytes, when YouTube reports it. Used to verify completeness. */
  contentLength?: number;
  itag?: number;
  /** Which client produced this source — useful in logs. */
  client?: string;
}

function buildHeaders(
  client: ClientConfig,
  visitorData?: string | null,
): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': client.userAgent,
    'X-YouTube-Client-Name': String(client.clientId),
    'X-YouTube-Client-Version': client.context.clientVersion,
    Accept: '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    Origin: 'https://www.youtube.com',
    Referer: 'https://www.youtube.com/',
  };
  if (visitorData) headers['X-Goog-Visitor-Id'] = visitorData;
  return headers;
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs = 15_000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function restFetchPlayer(videoId: string, client: ClientConfig): Promise<any> {
  const apiKey = client.apiKey ?? INNERTUBE_API_KEY;
  const visitorData = await getVisitorData();

  const body = {
    context: {
      client: {
        ...client.context,
        hl: 'en',
        gl: 'US',
        ...(visitorData ? { visitorData } : {}),
      },
    },
    videoId,
    contentCheckOk: true,
    racyCheckOk: true,
  };

  const response = await fetchWithTimeout(
    `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...buildHeaders(client, visitorData) },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    console.warn(`[youtubeRest] ${client.label}: HTTP ${response.status}`);
    return null;
  }

  const data = await response.json();
  const playability = data.playabilityStatus;
  if (!playability || playability.status !== 'OK') {
    console.warn(
      `[youtubeRest] ${client.label}: ${playability?.status ?? 'NO_STATUS'} — ${playability?.reason ?? ''}`,
    );
    return null;
  }
  return data;
}

/**
 * Choose the audio format to play.
 *
 * Prefers Opus (better quality per byte than AAC at these bitrates) and, within
 * the preferred codec, the lowest bitrate that still clears 96 kbps. Formats
 * without a `url` are unusable here: deciphering `signatureCipher` needs a JS
 * evaluator, which React Native does not provide.
 *
 * Exported for unit testing.
 */
export function pickBestAudio(formats: any[]): any | null {
  const audioOnly = formats.filter((f: any) => (f.mimeType ?? '').startsWith('audio/') && f.url);
  if (audioOnly.length === 0) return null;

  const MIN_BITRATE = 96_000;
  const opus = audioOnly.filter((f: any) => (f.mimeType ?? '').includes('opus'));
  const candidates = opus.length > 0 ? opus : audioOnly;
  return (
    candidates.find((f: any) => (f.bitrate ?? 0) >= MIN_BITRATE) ??
    candidates[candidates.length - 1]
  );
}

function isHls(url: string): boolean {
  return /\.m3u8(\?|$)/.test(url);
}

/**
 * Confirm the media server will actually serve this URL.
 *
 * Checks the start of the stream and, when the size is known, a range near the
 * end. The deep probe is the important one: a PO-token-capped client serves the
 * first ~1 MB and then 403s, which looks fine at the start and dies mid-song.
 */
export async function verifySource(source: StreamSource): Promise<boolean> {
  const headers = source.headers ?? {};
  try {
    const head = await fetchWithTimeout(
      source.url,
      { headers: { ...headers, Range: 'bytes=0-65535' } },
      12_000,
    );
    head.body?.cancel?.();
    if (head.status !== 200 && head.status !== 206) {
      console.warn(`[youtubeRest] verify: start rejected HTTP ${head.status} (${source.client})`);
      return false;
    }

    const total = source.contentLength ?? 0;
    if (total > 131_072) {
      const start = Math.floor(total * 0.95);
      const tail = await fetchWithTimeout(
        source.url,
        { headers: { ...headers, Range: `bytes=${start}-${total - 1}` } },
        12_000,
      );
      tail.body?.cancel?.();
      if (tail.status !== 200 && tail.status !== 206) {
        console.warn(
          `[youtubeRest] verify: tail rejected HTTP ${tail.status} — ${source.client} is range-capped`,
        );
        return false;
      }
    }
    return true;
  } catch (e) {
    console.warn(`[youtubeRest] verify failed for ${source.client}:`, (e as Error).message);
    return false;
  }
}

function toSource(format: any, client: ClientConfig, visitorData: string | null): StreamSource {
  return {
    url: format.url,
    type: isHls(format.url) ? 'hls' : 'default',
    headers: buildHeaders(client, visitorData),
    contentLength: Number(format.contentLength) || undefined,
    itag: format.itag,
    client: client.label,
  };
}

/** Resolve an audio stream, verifying it plays before returning it. */
export async function restGetStreamSource(videoId: string): Promise<StreamSource> {
  const visitorData = await getVisitorData();
  const failures: string[] = [];

  for (const client of REST_CLIENTS) {
    try {
      const data = await restFetchPlayer(videoId, client);
      if (!data) {
        failures.push(`${client.label}: no player response`);
        continue;
      }

      const best = pickBestAudio(data.streamingData?.adaptiveFormats ?? []);
      if (!best) {
        failures.push(`${client.label}: no audio formats`);
        continue;
      }

      const source = toSource(best, client, visitorData);
      if (!(await verifySource(source))) {
        failures.push(`${client.label}: media server rejected the URL`);
        continue;
      }

      console.log(`[youtubeRest] stream via ${client.label} (itag ${source.itag}) for ${videoId}`);
      return source;
    } catch (e) {
      failures.push(`${client.label}: ${(e as Error).message}`);
    }
  }

  throw new Error(`[youtubeRest] no playable audio for ${videoId} — ${failures.join('; ')}`);
}

/**
 * Resolve a URL suitable for downloading to a file.
 *
 * expo-file-system issues an unranged GET, so the source must accept one.
 * Adaptive audio-only is preferred: it is what we want on disk, and it is far
 * smaller than a progressive audio+video stream.
 */
export async function restGetDownloadUrl(videoId: string): Promise<StreamSource> {
  const visitorData = await getVisitorData();
  const failures: string[] = [];

  for (const client of REST_CLIENTS) {
    try {
      const data = await restFetchPlayer(videoId, client);
      if (!data) {
        failures.push(`${client.label}: no player response`);
        continue;
      }

      const best = pickBestAudio(data.streamingData?.adaptiveFormats ?? []);
      if (!best) {
        failures.push(`${client.label}: no audio formats`);
        continue;
      }

      const source = toSource(best, client, visitorData);
      if (!(await verifySource(source))) {
        failures.push(`${client.label}: media server rejected the URL`);
        continue;
      }

      console.log(`[youtubeRest] download via ${client.label} (itag ${source.itag}) for ${videoId}`);
      return source;
    } catch (e) {
      failures.push(`${client.label}: ${(e as Error).message}`);
    }
  }

  throw new Error(`[youtubeRest] no downloadable audio for ${videoId} — ${failures.join('; ')}`);
}
