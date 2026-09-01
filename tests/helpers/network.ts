import { restGetStreamSource, type StreamSource } from '../../services/youtubeRest';

/**
 * These suites talk to a live, adversarial upstream. YouTube blocks by IP
 * reputation, and a machine that has made a burst of requests gets 403s from
 * the media server for videos it served happily minutes earlier.
 *
 * That produces two failures that look identical from inside a test but mean
 * opposite things:
 *
 *   - the resolver is broken            -> a real regression, must fail the build
 *   - this IP is blocked for that video -> environmental, must not fail the build
 *
 * A *control video* separates them. The control is resolved once per run. If it
 * resolves and streams end to end, the pipeline demonstrably works and any other
 * video that cannot be resolved is being blocked upstream, so its tests are
 * skipped with a reason instead of reported as failures. If the control itself
 * fails, nothing is masked: every suite fails loudly.
 *
 * Set YT_STRICT=1 to disable skipping and require every video to pass — use it
 * from a clean network when you want to prove the full set works.
 */

/** Resolves reliably and is the least likely to be region- or rights-blocked. */
export const CONTROL_VIDEO = { id: 'dQw4w9WgXcQ', label: 'Rick Astley — Never Gonna Give You Up' };

/** Additional videos, checked when the network allows it. */
export const EXTRA_VIDEOS = [
  { id: 'kJQP7kiw5Fk', label: 'Luis Fonsi — Despacito' },
  { id: '9bZkp7q19f0', label: 'PSY — Gangnam Style' },
];

export const ALL_VIDEOS = [CONTROL_VIDEO, ...EXTRA_VIDEOS];

export const STRICT = process.env.YT_STRICT === '1';

let controlPromise: Promise<StreamSource | null> | null = null;

/** Resolve the control video once per process. */
export async function controlSource(): Promise<StreamSource | null> {
  if (!controlPromise) {
    controlPromise = restGetStreamSource(CONTROL_VIDEO.id).catch(() => null);
  }
  return controlPromise;
}

/**
 * True when the pipeline provably works but this specific video could not be
 * resolved — i.e. the failure is upstream, not in our code.
 */
export async function isUpstreamBlock(error: Error | null): Promise<boolean> {
  if (!error) return false;
  if (STRICT) return false;
  // Only a media-server refusal counts as environmental. A parse error, a
  // missing export or a thrown TypeError must still fail the suite.
  if (!/media server rejected|no player response|no audio formats/.test(error.message)) {
    return false;
  }
  return (await controlSource()) !== null;
}

/**
 * Skip the current test when the failure is an upstream block, otherwise let the
 * caller assert normally.
 */
export async function skipIfUpstreamBlocked(
  ctx: { skip: (note?: string) => void },
  videoId: string,
  error: Error | null,
): Promise<void> {
  if (await isUpstreamBlock(error)) {
    ctx.skip(
      `YouTube is blocking ${videoId} from this IP (the control video still streams, so the resolver is working). ` +
        'Run `npm run diagnose` to confirm, or YT_STRICT=1 to fail instead of skipping.',
    );
  }
}
