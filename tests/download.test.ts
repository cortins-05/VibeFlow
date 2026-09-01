import { describe, it, expect, beforeAll } from 'vitest';
import { restGetDownloadUrl, type StreamSource } from '../services/youtubeRest';
import { probeHead, sniffContainer, downloadChunked } from './helpers/streamProbe';
import { ALL_VIDEOS, skipIfUpstreamBlocked } from './helpers/network';

/**
 * DOWNLOAD CONTRACT
 *
 * expo-file-system's DownloadResumable issues a plain GET with no Range header
 * and expects the full body. If the media server answers 403 to unranged
 * requests, every download fails — and it fails silently, because the store only
 * registers a download once the file lands.
 *
 * A download is only "working" when the complete file arrives and is playable,
 * so one test transfers the whole thing and checks the byte count against the
 * size YouTube reported.
 */
describe('downloads: resolved sources must produce a complete file', () => {
  for (const video of ALL_VIDEOS) {
    describe(`${video.label} (${video.id})`, () => {
      let source: StreamSource | null = null;
      let resolveError: Error | null = null;

      beforeAll(async () => {
        try {
          source = await restGetDownloadUrl(video.id);
        } catch (e) {
          resolveError = e as Error;
        }
      });

      it('resolves to a download source with a known size', async (ctx) => {
        await skipIfUpstreamBlocked(ctx, video.id, resolveError);
        expect(resolveError, `resolution threw: ${resolveError?.message}`).toBeNull();
        expect(source!.url).toMatch(/^https:\/\//);
        expect(
          source?.contentLength ?? 0,
          'resolver did not report contentLength — completeness cannot be verified',
        ).toBeGreaterThan(0);
      });

      it('carries the client headers the media server requires', async (ctx) => {
        await skipIfUpstreamBlocked(ctx, video.id, resolveError);
        expect(resolveError).toBeNull();
        // Downloads are handed to expo-file-system with these headers; if the
        // User-Agent does not match the client that issued the URL, YouTube
        // answers 403. The resume path must replay them too.
        expect(source!.headers?.['User-Agent']).toBeTruthy();
        expect(source!.headers?.['X-YouTube-Client-Name']).toBeTruthy();
      });

      it('accepts an unranged GET (what expo-file-system actually sends)', async (ctx) => {
        await skipIfUpstreamBlocked(ctx, video.id, resolveError);
        expect(resolveError).toBeNull();
        const res = await fetch(source!.url, { headers: source!.headers ?? {} });
        // Release the body immediately; only the acceptance matters here.
        res.body?.cancel();
        expect(
          res.status,
          `expo-file-system's plain GET would fail with HTTP ${res.status}`,
        ).toBe(200);
      });

      it('is audio-only, not a progressive audio+video stream', async (ctx) => {
        await skipIfUpstreamBlocked(ctx, video.id, resolveError);
        expect(resolveError).toBeNull();
        // itag 18 carries video we immediately discard — a several-fold size
        // penalty per track, and the one format the dead ANDROID_VR path still
        // served, which made it a tempting trap.
        expect(source!.itag).not.toBe(18);
      });

      it('transfers the complete file', async (ctx) => {
        await skipIfUpstreamBlocked(ctx, video.id, resolveError);
        expect(resolveError).toBeNull();
        const total = source!.contentLength!;
        const result = await downloadChunked(source!.url, source!.headers ?? {}, total);

        expect(
          result.complete,
          `download stalled at ${result.bytes}/${total} bytes (HTTP ${result.status})`,
        ).toBe(true);
        expect(result.bytes).toBe(total);
      });

      it('produces a file with a valid audio container', async (ctx) => {
        await skipIfUpstreamBlocked(ctx, video.id, resolveError);
        expect(resolveError).toBeNull();
        const { result, head } = await probeHead(source!.url, source!.headers ?? {});
        expect(result.ok).toBe(true);
        expect(sniffContainer(head)).not.toBe('unknown');
      });
    });
  }
});
