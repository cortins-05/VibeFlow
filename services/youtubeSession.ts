// Shared InnerTube session state.
//
// YouTube ties bot-detection to a "visitor" identity. Requests sent without
// `visitorData` are answered with playabilityStatus LOGIN_REQUIRED
// ("Sign in to confirm you're not a bot") for most videos, so every player
// request in the app must carry one.
//
// The value is scraped once from the public sw.js_data endpoint and reused for
// the process lifetime — rotating it per request does not help and costs a
// round trip.

let visitorData: string | null = null;
let inflight: Promise<string | null> | null = null;

const VISITOR_ENDPOINT = 'https://www.youtube.com/sw.js_data';
const SCRAPE_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

async function fetchVisitorData(): Promise<string | null> {
  try {
    const res = await fetch(VISITOR_ENDPOINT, { headers: { 'User-Agent': SCRAPE_UA } });
    if (!res.ok) return null;
    const text = await res.text();
    // Response is JSON prefixed with the XSSI guard `)]}'`
    const parsed = JSON.parse(text.replace(/^\)\]\}'/, ''));
    const found = parsed?.[0]?.[2]?.[0]?.[0]?.[13];
    return typeof found === 'string' && found.length > 0 ? found : null;
  } catch {
    return null;
  }
}

/** Returns a cached visitorData string, fetching it on first use. */
export async function getVisitorData(): Promise<string | null> {
  if (visitorData) return visitorData;
  if (!inflight) {
    inflight = fetchVisitorData().then((v) => {
      visitorData = v;
      inflight = null;
      return v;
    });
  }
  return inflight;
}

export function resetVisitorData(): void {
  visitorData = null;
  inflight = null;
}
