import { trackAICrawlerResponse } from '@datafast/ai-crawl';

interface AssetBinding {
  fetch(request: Request): Promise<Response>;
}

interface Env {
  ASSETS: AssetBinding;
  DATAFAST_BOT_TOKEN?: string;
}

interface WorkerContext {
  waitUntil(promise: Promise<unknown>): void;
}

const DATAFAST_WEBSITE_ID = 'dfid_ult96FALaaaTkgcQqNt1I';
const DATAFAST_DOMAIN = 'gameshin.com';

/**
 * Tracks only requests that the DataFast package recognises as AI crawlers.
 * The selected routes in wrangler.jsonc deliberately exclude heavy game and
 * media files, so player traffic remains a direct static-asset response.
 */
export default {
  async fetch(request: Request, env: Env, ctx: WorkerContext): Promise<Response> {
    const response = await env.ASSETS.fetch(request);

    trackAICrawlerResponse(request, response, ctx, {
      websiteId: DATAFAST_WEBSITE_ID,
      domain: DATAFAST_DOMAIN,
      ...(env.DATAFAST_BOT_TOKEN ? { authToken: env.DATAFAST_BOT_TOKEN } : {}),
    });

    return response;
  },
};
