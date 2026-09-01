import { Innertube } from 'youtubei.js';
import {
  restGetStreamSource,
  restGetDownloadUrl,
  type StreamSource,
} from './youtubeRest';

export type { StreamSource };

// -------------------------------------------------------------------------
// Division of labour
// -------------------------------------------------------------------------
// youtubei.js handles search, the home feed and metadata. Those endpoints need
// no Proof-of-Origin token and the library's parsers are worth having.
//
// Media resolution does NOT go through the library. It lives in youtubeRest.ts,
// which verifies every URL against the media server before returning it. The
// library's own client cascade used to duplicate that job and got it wrong: it
// trusted playabilityStatus === 'OK' from ANDROID_VR, a client that has
// answered 403 to every byte range since August 2026. Keeping a single,
// verified resolution path means playback and downloads cannot silently
// diverge from what the tests check.

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

/** Resolve a playable audio stream. The URL is verified before it is returned. */
export async function getStreamSource(videoId: string): Promise<StreamSource> {
  return restGetStreamSource(videoId);
}

// Back-compat shim — old callers expect just the URL.
export async function getStreamUrl(videoId: string): Promise<string> {
  return (await getStreamSource(videoId)).url;
}

/** Resolve a URL suitable for downloading a track's audio to a file. */
export async function getDownloadUrl(videoId: string): Promise<StreamSource> {
  return restGetDownloadUrl(videoId);
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
