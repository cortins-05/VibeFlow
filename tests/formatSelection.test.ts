import { describe, it, expect } from 'vitest';
import { pickBestAudio } from '../services/youtubeRest';
import { sniffContainer } from './helpers/streamProbe';

/**
 * Deterministic, network-free checks on the decisions that decide whether
 * playback can work at all. These run in milliseconds and stay green even when
 * YouTube is rate-limiting the machine, so a red network suite plus a green
 * unit suite localises the problem to the network rather than the logic.
 */

const opus96 = { itag: 251, mimeType: 'audio/webm; codecs="opus"', bitrate: 136_544, url: 'https://x/251' };
const opus64 = { itag: 250, mimeType: 'audio/webm; codecs="opus"', bitrate: 64_000, url: 'https://x/250' };
const opus32 = { itag: 249, mimeType: 'audio/webm; codecs="opus"', bitrate: 32_000, url: 'https://x/249' };
const aacLow = { itag: 139, mimeType: 'audio/mp4; codecs="mp4a.40.5"', bitrate: 50_152, url: 'https://x/139' };
const aacHigh = { itag: 140, mimeType: 'audio/mp4; codecs="mp4a.40.2"', bitrate: 130_677, url: 'https://x/140' };
const video = { itag: 137, mimeType: 'video/mp4; codecs="avc1"', bitrate: 4_000_000, url: 'https://x/137' };

describe('pickBestAudio', () => {
  it('returns null when there are no formats', () => {
    expect(pickBestAudio([])).toBeNull();
  });

  it('ignores video formats', () => {
    expect(pickBestAudio([video])).toBeNull();
  });

  it('prefers Opus over AAC even when AAC has a similar bitrate', () => {
    const picked = pickBestAudio([aacHigh, opus96, aacLow]);
    expect(picked.itag).toBe(251);
  });

  it('falls back to AAC when no Opus format is available', () => {
    const picked = pickBestAudio([aacLow, aacHigh, video]);
    expect(picked.mimeType).toContain('mp4a');
  });

  it('picks the lowest Opus format that still clears 96 kbps', () => {
    const picked = pickBestAudio([opus32, opus64, opus96]);
    expect(picked.itag).toBe(251);
  });

  it('accepts the best available when everything is below 96 kbps', () => {
    const picked = pickBestAudio([opus32, opus64]);
    expect(picked).not.toBeNull();
    expect([249, 250]).toContain(picked.itag);
  });

  it('skips formats with no direct URL — React Native cannot decipher them', () => {
    const ciphered = { itag: 251, mimeType: 'audio/webm; codecs="opus"', bitrate: 136_544, signatureCipher: 's=abc&url=https://x' };
    expect(pickBestAudio([ciphered])).toBeNull();
    // ...but a usable AAC format alongside it is still found.
    expect(pickBestAudio([ciphered, aacHigh]).itag).toBe(140);
  });
});

describe('sniffContainer', () => {
  it('recognises a WebM/Matroska header', () => {
    expect(sniffContainer(new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0]))).toBe('webm');
  });

  it('recognises an MP4 ftyp box', () => {
    expect(sniffContainer(new Uint8Array([0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70]))).toBe('mp4');
  });

  it('recognises an ID3-tagged MP3', () => {
    expect(sniffContainer(new Uint8Array([0x49, 0x44, 0x33, 3, 0, 0, 0, 0]))).toBe('mp3');
  });

  it('rejects an HTML error page served with a 200', () => {
    const html = new TextEncoder().encode('<!DOCTYPE html><html>');
    expect(sniffContainer(html)).toBe('unknown');
  });

  it('rejects an empty body', () => {
    expect(sniffContainer(new Uint8Array([]))).toBe('unknown');
  });
});
