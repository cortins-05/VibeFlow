// Direct REST API fallback for YouTube streaming.
// Does NOT depend on youtubei.js. Makes raw HTTP POSTs to InnerTube API.
// Only ANDROID_VR client returns pre-deciphered URLs.

const INNERTUBE_API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
const INNERTUBE_BACKUP_KEY = 'AIzaSyB-63vPrJDKp1nR7Ho9QFnB39E2Kj6Y6QU';

interface ClientConfig {
  label: string;
  name: string;
  version: string;
  clientId: number;
  userAgent: string;
  apiKey?: string;
}

const REST_CLIENTS: ClientConfig[] = [
  { label: 'VR 1.65.10', name: 'ANDROID_VR', version: '1.65.10', clientId: 28, userAgent: 'com.google.android.apps.youtube.vr.oculus/1.65.10 (Linux; U; Android 14; SM-Q900Y) gzip' },
  { label: 'VR 1.62.27', name: 'ANDROID_VR', version: '1.62.27', clientId: 28, userAgent: 'com.google.android.apps.youtube.vr.oculus/1.62.27 (Linux; U; Android 12L; SM-Q900Y) gzip' },
  { label: 'VR 1.65.10 (bk)', name: 'ANDROID_VR', version: '1.65.10', clientId: 28, userAgent: 'com.google.android.apps.youtube.vr.oculus/1.65.10 (Linux; U; Android 14; SM-Q900Y) gzip', apiKey: INNERTUBE_BACKUP_KEY },
  { label: 'VR 1.62.27 (bk)', name: 'ANDROID_VR', version: '1.62.27', clientId: 28, userAgent: 'com.google.android.apps.youtube.vr.oculus/1.62.27 (Linux; U; Android 12L; SM-Q900Y) gzip', apiKey: INNERTUBE_BACKUP_KEY },
];

function buildHeaders(client: ClientConfig): Record<string, string> {
  return {
    'User-Agent': client.userAgent,
    'X-YouTube-Client-Name': String(client.clientId),
    'X-YouTube-Client-Version': client.version,
    Accept: '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    Origin: 'https://www.youtube.com',
    Referer: 'https://www.youtube.com/',
  };
}

async function fetchWithTimeout(input: RequestInfo, init: RequestInit, timeoutMs = 15_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function restFetchPlayer(videoId: string, client: ClientConfig): Promise<any> {
  const apiKey = client.apiKey ?? INNERTUBE_API_KEY;
  const url = `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`;

  const body = {
    context: {
      client: {
        clientName: client.name,
        clientVersion: client.version,
        hl: 'en',
        gl: 'US',
      },
    },
    videoId,
  };

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': client.userAgent,
      'X-YouTube-Client-Name': String(client.clientId),
      'X-YouTube-Client-Version': client.version,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    console.warn(`[youtubeRest] ${client.label}: HTTP ${response.status}`);
    return null;
  }

  const data = await response.json();
  const playability = data.playabilityStatus;

  if (!playability || playability.status !== 'OK') {
    console.warn(`[youtubeRest] ${client.label}: ${playability?.status ?? 'NO_STATUS'} — ${playability?.reason ?? ''}`);
    return null;
  }

  return data;
}

function pickBestAudio(formats: any[]): any | null {
  const audioOnly = formats.filter((f: any) => {
    const mime = f.mimeType ?? '';
    return mime.startsWith('audio/') && f.url;
  });
  if (audioOnly.length === 0) return null;

  const MIN_BITRATE = 96_000;
  const opus = audioOnly.filter((f: any) => (f.mimeType ?? '').includes('opus'));
  const candidates = opus.length > 0 ? opus : audioOnly;
  return candidates.find((f: any) => (f.bitrate ?? 0) >= MIN_BITRATE) ?? candidates[candidates.length - 1];
}

function isHls(url: string): boolean {
  return /\.m3u8(\?|$)/.test(url);
}

export interface StreamSource {
  url: string;
  type?: 'default' | 'dash' | 'hls' | 'smoothstreaming';
  headers?: Record<string, string>;
}

export async function restGetStreamSource(videoId: string): Promise<StreamSource> {
  for (const client of REST_CLIENTS) {
    try {
      const data = await restFetchPlayer(videoId, client);
      if (!data) continue;

      const formats = data.streamingData?.adaptiveFormats ?? [];
      const best = pickBestAudio(formats);
      if (!best) continue;

      console.log(`[youtubeRest] stream via ${client.label} for ${videoId}`);
      return { url: best.url, type: isHls(best.url) ? 'hls' : 'default', headers: buildHeaders(client) };
    } catch (e) {
      console.warn(`[youtubeRest] ${client.label} error:`, (e as Error).message);
    }
  }
  throw new Error(`[youtubeRest] no playable audio for ${videoId}`);
}

export async function restGetDownloadUrl(videoId: string): Promise<StreamSource> {
  for (const client of REST_CLIENTS) {
    try {
      const data = await restFetchPlayer(videoId, client);
      if (!data) continue;

      const streamingData = data.streamingData;
      if (!streamingData) continue;

      // Progressive: self-contained audio+video, prefer smallest
      const progressive = (streamingData.formats ?? [])
        .filter((f: any) => f.url && f.audioQuality)
        .sort((a: any, b: any) => (a.bitrate ?? 0) - (b.bitrate ?? 0));

      if (progressive.length > 0) {
        console.log(`[youtubeRest] download progressive via ${client.label} for ${videoId}`);
        return { url: progressive[0].url, type: 'default', headers: buildHeaders(client) };
      }
    } catch (e) {
      console.warn(`[youtubeRest] ${client.label} download error:`, (e as Error).message);
    }
  }

  // No progressive found — fall back to adaptive audio
  return restGetStreamSource(videoId);
}
