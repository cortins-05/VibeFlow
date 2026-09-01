#!/usr/bin/env node
/**
 * YouTube playback diagnostic.
 *
 *   node scripts/diagnose-youtube.mjs [videoId]
 *
 * Run this first whenever playback or downloads stop working. It tests each
 * InnerTube client end to end and separates the two failure modes that look
 * identical from inside the app:
 *
 *   - CLIENT BROKEN — the player response is OK but the media server 403s every
 *     byte range. This is what a new Proof-of-Origin-token requirement looks
 *     like, and it is what killed ANDROID_VR in August 2026. Fix: reorder or
 *     replace the clients in services/youtubeRest.ts.
 *
 *   - IP RATE-LIMITED — every client fails the same way at once, usually after
 *     a burst of requests. Nothing is wrong with the code; wait and re-run.
 */

const KEY_PRIMARY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
const KEY_BACKUP = 'AIzaSyB-63vPrJDKp1nR7Ho9QFnB39E2Kj6Y6QU';
const VIDEO = process.argv[2] ?? 'dQw4w9WgXcQ';

const CLIENTS = [
  {
    label: 'IOS 20.10.4',
    id: 5,
    ua: 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)',
    ctx: { clientName: 'IOS', clientVersion: '20.10.4', deviceMake: 'Apple', deviceModel: 'iPhone16,2', osName: 'iPhone', osVersion: '18.3.2.22D82' },
  },
  {
    label: 'IOS 20.14.2',
    id: 5,
    ua: 'com.google.ios.youtube/20.14.2 (iPhone16,2; U; CPU iOS 18_4_0 like Mac OS X;)',
    ctx: { clientName: 'IOS', clientVersion: '20.14.2', deviceMake: 'Apple', deviceModel: 'iPhone16,2', osName: 'iPhone', osVersion: '18.4.0.22E240' },
  },
  {
    label: 'IOS 20.03.02',
    id: 5,
    ua: 'com.google.ios.youtube/20.03.02 (iPhone16,2; U; CPU iOS 18_2_1 like Mac OS X;)',
    ctx: { clientName: 'IOS', clientVersion: '20.03.02', deviceMake: 'Apple', deviceModel: 'iPhone16,2', osName: 'iPhone', osVersion: '18.2.1.22C161' },
  },
  {
    label: 'IOS 20.10.4 (backup key)',
    id: 5,
    key: KEY_BACKUP,
    ua: 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)',
    ctx: { clientName: 'IOS', clientVersion: '20.10.4', deviceMake: 'Apple', deviceModel: 'iPhone16,2', osName: 'iPhone', osVersion: '18.3.2.22D82' },
  },
  {
    label: 'ANDROID_VR 1.65.10',
    id: 28,
    ua: 'com.google.android.apps.youtube.vr.oculus/1.65.10 (Linux; U; Android 14; SM-Q900Y) gzip',
    ctx: { clientName: 'ANDROID_VR', clientVersion: '1.65.10', androidSdkVersion: 34 },
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getVisitorData() {
  try {
    const res = await fetch('https://www.youtube.com/sw.js_data', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0' },
    });
    const parsed = JSON.parse((await res.text()).replace(/^\)\]\}'/, ''));
    return parsed?.[0]?.[2]?.[0]?.[0]?.[13] ?? null;
  } catch {
    return null;
  }
}

async function diagnose(client, visitorData) {
  const key = client.key ?? KEY_PRIMARY;
  const headers = {
    'User-Agent': client.ua,
    'X-YouTube-Client-Name': String(client.id),
    'X-YouTube-Client-Version': client.ctx.clientVersion,
    Accept: '*/*',
    Origin: 'https://www.youtube.com',
    Referer: 'https://www.youtube.com/',
    ...(visitorData ? { 'X-Goog-Visitor-Id': visitorData } : {}),
  };

  const res = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({
      context: { client: { ...client.ctx, hl: 'en', gl: 'US', ...(visitorData ? { visitorData } : {}) } },
      videoId: VIDEO,
      contentCheckOk: true,
      racyCheckOk: true,
    }),
  });

  if (!res.ok) return { verdict: 'API ERROR', detail: `HTTP ${res.status}` };

  const data = await res.json();
  const status = data.playabilityStatus?.status;
  if (status !== 'OK') {
    return { verdict: 'REFUSED', detail: `${status} — ${data.playabilityStatus?.reason ?? ''}` };
  }

  const audio = (data.streamingData?.adaptiveFormats ?? []).filter(
    (f) => (f.mimeType ?? '').startsWith('audio/') && f.url,
  );
  if (!audio.length) return { verdict: 'NO AUDIO', detail: 'player OK but no direct audio URLs' };

  const opus = audio.filter((f) => (f.mimeType ?? '').includes('opus'));
  const pool = opus.length ? opus : audio;
  const best = pool.find((f) => (f.bitrate ?? 0) >= 96_000) ?? pool[pool.length - 1];
  const total = Number(best.contentLength ?? 0);
  const mediaHeaders = { 'User-Agent': client.ua, Accept: '*/*' };

  const start = await fetch(best.url, { headers: { ...mediaHeaders, Range: 'bytes=0-65535' } });
  start.body?.cancel();

  let tailStatus = 'n/a';
  if (total > 131_072) {
    const from = Math.floor(total * 0.95);
    const tail = await fetch(best.url, { headers: { ...mediaHeaders, Range: `bytes=${from}-${total - 1}` } });
    tail.body?.cancel();
    tailStatus = tail.status;
  }

  const unranged = await fetch(best.url, { headers: mediaHeaders });
  unranged.body?.cancel();

  const startOk = start.status === 200 || start.status === 206;
  const tailOk = tailStatus === 200 || tailStatus === 206;

  let verdict;
  if (startOk && tailOk && unranged.status === 200) verdict = 'WORKING';
  else if (startOk && !tailOk) verdict = 'RANGE-CAPPED (needs PO token)';
  else verdict = 'MEDIA 403';

  return {
    verdict,
    detail: `itag ${best.itag} ${(best.mimeType ?? '').split(';')[0]} @${best.bitrate} · ${(total / 1048576).toFixed(2)} MB · start=${start.status} tail=${tailStatus} unranged=${unranged.status}`,
  };
}

const visitorData = await getVisitorData();
console.log(`video: ${VIDEO}`);
console.log(`visitorData: ${visitorData ? 'acquired' : 'MISSING — expect LOGIN_REQUIRED'}\n`);

const results = [];
for (const client of CLIENTS) {
  try {
    const r = await diagnose(client, visitorData);
    results.push(r.verdict);
    const mark = r.verdict === 'WORKING' ? '✅' : '❌';
    console.log(`${mark} ${client.label.padEnd(26)} ${r.verdict}`);
    console.log(`   ${r.detail}`);
  } catch (e) {
    results.push('ERROR');
    console.log(`❌ ${client.label.padEnd(26)} ERROR — ${e.message}`);
  }
  await sleep(2000); // spacing keeps the probe itself from tripping rate limits
}

const working = results.filter((r) => r === 'WORKING').length;
console.log(`\n${working} of ${CLIENTS.length} clients working.`);
if (working === 0) {
  console.log(
    'All clients failed. If they failed in different ways, a client is broken and\n' +
      'services/youtubeRest.ts needs reordering. If they all failed identically,\n' +
      'this IP is most likely rate-limited — wait a few minutes and re-run.',
  );
}
process.exit(working > 0 ? 0 : 1);
