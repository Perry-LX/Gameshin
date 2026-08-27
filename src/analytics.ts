import { initDataFast } from 'datafast';

type AnalyticsValue = string | number | boolean;
export type AnalyticsProperties = Record<string, AnalyticsValue>;

const WEBSITE_ID = 'dfid_ult96FALaaaTkgcQqNt1I';
let clientPromise: ReturnType<typeof initDataFast> | null = null;

/** Initializes one shared client so analytics never delays interaction code. */
export function initializeAnalytics() {
  if (!clientPromise) {
    clientPromise = initDataFast({
      websiteId: WEBSITE_ID,
      autoCapturePageviews: true,
      allowLocalhost: import.meta.env.DEV,
    });
  }

  return clientPromise;
}

/** Tracking failures must never interrupt a game or navigation. */
export async function trackEvent(eventName: string, properties: AnalyticsProperties = {}) {
  try {
    const client = await initializeAnalytics();
    await client.track(eventName, properties);
  } catch {
    // A privacy extension or failed request must remain invisible to players.
  }
}

/** Avoid duplicate conversion events during one browser session. */
export function trackOncePerSession(key: string, eventName: string, properties: AnalyticsProperties = {}) {
  try {
    const storageKey = `gameshin:analytics:${key}`;
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, '1');
  } catch {
    // If sessionStorage is unavailable, still attempt the event once.
  }

  void trackEvent(eventName, properties);
}
