import { trackAICrawlerRequest } from '@datafast/ai-crawl';

type PagesContext = {
  request: Request;
  next: () => Promise<Response>;
  waitUntil: (promise: Promise<unknown>) => void;
};

/**
 * Tracks known AI/search crawler requests without delaying the page response.
 * Cloudflare Pages supplies waitUntil(), which DataFast uses for best-effort
 * background reporting.
 */
export function onRequest(context: PagesContext): Promise<Response> {
  trackAICrawlerRequest(context.request, context, {
    websiteId: 'dfid_ult96FALaaaTkgcQqNt1I',
    domain: 'gameshin.com',
  });

  return context.next();
}
