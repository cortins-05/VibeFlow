/**
 * Real-network verification helpers.
 *
 * The whole point of this suite is that "we got a URL back" proves nothing —
 * YouTube happily hands out URLs that immediately 403 at the media server.
 * These helpers assert on bytes actually delivered.
 */

export interface ProbeResult {
  status: number;
  bytes: number;
  contentType: string | null;
  ok: boolean;
}

/** Fetch a byte range and report what actually came back. */
export async function probeRange(
  url: string,
  headers: Record<string, string>,
  start: number,
  end: number,
): Promise<ProbeResult> {
  const res = await fetch(url, {
    headers: { ...headers, Range: `bytes=${start}-${end}` },
  });
  const buf = await res.arrayBuffer().catch(() => new ArrayBuffer(0));
  return {
    status: res.status,
    bytes: buf.byteLength,
    contentType: res.headers.get('content-type'),
    ok: res.status === 200 || res.status === 206,
  };
}

/** Fetch the first bytes and return them, for container sniffing. */
export async function probeHead(
  url: string,
  headers: Record<string, string>,
  length = 4096,
): Promise<{ result: ProbeResult; head: Uint8Array }> {
  const res = await fetch(url, {
    headers: { ...headers, Range: `bytes=0-${length - 1}` },
  });
  const buf = await res.arrayBuffer().catch(() => new ArrayBuffer(0));
  return {
    result: {
      status: res.status,
      bytes: buf.byteLength,
      contentType: res.headers.get('content-type'),
      ok: res.status === 200 || res.status === 206,
    },
    head: new Uint8Array(buf),
  };
}

/**
 * Identify the audio container from magic bytes. Guards against YouTube
 * returning an HTML error page or empty body with a 200.
 */
export function sniffContainer(head: Uint8Array): 'webm' | 'mp4' | 'mp3' | 'unknown' {
  if (head.length < 8) return 'unknown';
  // EBML header -> WebM / Matroska (Opus & Vorbis live here)
  if (head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) return 'webm';
  // ....ftyp -> ISO-BMFF / MP4 (AAC)
  if (head[4] === 0x66 && head[5] === 0x74 && head[6] === 0x79 && head[7] === 0x70) return 'mp4';
  // ID3 tag or MPEG frame sync -> MP3
  if (head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33) return 'mp3';
  if (head[0] === 0xff && (head[1] & 0xe0) === 0xe0) return 'mp3';
  return 'unknown';
}

/**
 * Download a whole stream in ranged chunks and report the total.
 * Mirrors what a resumable downloader must be able to do.
 */
export async function downloadChunked(
  url: string,
  headers: Record<string, string>,
  total: number,
  chunkSize = 512 * 1024,
): Promise<{ bytes: number; complete: boolean; failedAt: number | null; status: number }> {
  let got = 0;
  let lastStatus = 0;
  while (got < total) {
    const end = Math.min(got + chunkSize - 1, total - 1);
    const res = await fetch(url, { headers: { ...headers, Range: `bytes=${got}-${end}` } });
    lastStatus = res.status;
    if (res.status !== 206 && res.status !== 200) {
      return { bytes: got, complete: false, failedAt: got, status: lastStatus };
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength === 0) {
      return { bytes: got, complete: false, failedAt: got, status: lastStatus };
    }
    got += buf.byteLength;
  }
  return { bytes: got, complete: got >= total, failedAt: null, status: lastStatus };
}
