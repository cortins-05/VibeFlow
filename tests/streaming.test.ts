import { describe, it, expect, beforeAll } from 'vitest';
import { restGetStreamSource, type StreamSource } from '../services/youtubeRest';
import { probeHead, probeRange, sniffContainer } from './helpers/streamProbe';
import { ALL_VIDEOS, skipIfUpstreamBlocked } from './helpers/network';

/**
 * STREAMING CONTRACT
 *
 * react-native-track-player hands the URL + headers straight to ExoPlayer,
 * which will:
 *   1. request the start of the stream,
 *   2. keep requesting further byte ranges as playback advances,
 *   3. request arbitrary offsets when the user seeks.
 *
 * A URL that only serves the first megabyte plays for ~30s and then dies —
 * indistinguishable, to the user, from "no funciona". So sustained access gets
 * its own assertions, separate from the start-of-stream one. This is exactly
 * the case that a resolver trusting `playabilityStatus: OK` misses.
 *
 * Each video is resolved once and the source shared: re-resolving per assertion
 * multiplies InnerTube calls and trips YouTube's bot detection, which would make
 * the suite fail for reasons unrelated to the code under test.
 */
describe('streaming: resolved sources must actually play', () => {
  for (const video of ALL_VIDEOS) {
    describe(`${video.label} (${video.id})`, () => {
      let source: StreamSource | null = null;
      let resolveError: Error | null = null;

      beforeAll(async () => {
        try {
          source = await restGetStreamSource(video.id);
        } catch (e) {
          resolveError = e as Error;
        }
      });

      it('resolves to a stream source', async (ctx) => {
        await skipIfUpstreamBlocked(ctx, video.id, resolveError);
        expect(resolveError, `resolution threw: ${resolveError?.message}`).toBeNull();
        expect(source?.url, 'no URL resolved').toBeTruthy();
        expect(source!.url).toMatch(/^https:\/\//);
      });

      it('reports the stream size so completeness can be checked', async (ctx) => {
        await skipIfUpstreamBlocked(ctx, video.id, resolveError);
        expect(resolveError).toBeNull();
        expect(source?.contentLength ?? 0).toBeGreaterThan(0);
      });

      it('serves real audio bytes at the start of the stream', async (ctx) => {
        await skipIfUpstreamBlocked(ctx, video.id, resolveError);
        expect(resolveError).toBeNull();
        const { result, head } = await probeHead(source!.url, source!.headers ?? {});

        expect(
          result.ok,
          `media server rejected the start of the stream: HTTP ${result.status}`,
        ).toBe(true);
        expect(result.bytes, 'media server returned an empty body').toBeGreaterThan(1024);

        const container = sniffContainer(head);
        expect(
          container,
          `expected an audio container, got "${container}" (content-type: ${result.contentType})`,
        ).not.toBe('unknown');
      });

      it('serves bytes from the middle of the stream (playback does not stall)', async (ctx) => {
        await skipIfUpstreamBlocked(ctx, video.id, resolveError);
        expect(resolveError).toBeNull();
        const total = source!.contentLength!;
        const mid = Math.floor(total * 0.5);
        const result = await probeRange(source!.url, source!.headers ?? {}, mid, mid + 65_535);
        expect(
          result.ok,
          `playback would stop mid-song: HTTP ${result.status} at byte ${mid}/${total}`,
        ).toBe(true);
      });

      it('serves the final bytes of the stream (track can finish)', async (ctx) => {
        await skipIfUpstreamBlocked(ctx, video.id, resolveError);
        expect(resolveError).toBeNull();
        const total = source!.contentLength!;
        const late = Math.floor(total * 0.95);
        const result = await probeRange(source!.url, source!.headers ?? {}, late, total - 1);
        expect(
          result.ok,
          `the end of the track is unreachable: HTTP ${result.status} at byte ${late}/${total}`,
        ).toBe(true);
        expect(result.bytes).toBeGreaterThan(0);
      });

      it('accepts a large sequential read (ExoPlayer buffers in big chunks)', async (ctx) => {
        await skipIfUpstreamBlocked(ctx, video.id, resolveError);
        expect(resolveError).toBeNull();
        const result = await probeRange(source!.url, source!.headers ?? {}, 0, 1_048_575);
        expect(result.ok, `1 MiB buffer read rejected: HTTP ${result.status}`).toBe(true);
        expect(result.bytes, 'short read on a 1 MiB request').toBeGreaterThan(512 * 1024);
      });
    });
  }
});
