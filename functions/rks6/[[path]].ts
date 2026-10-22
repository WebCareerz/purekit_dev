// Cloudflare Pages Function: /rks6/* → the analytics proxy Worker through the PX service binding.
// The proxy serves the analytics script and relays page events to the self-hosted analytics
// instance; this function only decides whether to hand the request over, unchanged.
// The folder name must match ANALYTICS_PREFIX in lib/analytics.ts.

interface PagesContext {
  request: Request;
  env: { PX?: { fetch(request: Request): Promise<Response> } };
}

// Only forward on the production domains: visits on the project's *.pages.dev address or
// preview deployments would otherwise be counted in the live stats. localhost is for
// `wrangler pages dev`. The binding is set on the production environment only.
const ALLOWED_HOSTS = new Set(["www.purekit.dev", "purekit.dev", "localhost", "127.0.0.1"]);

function notFound(): Response {
  return new Response("Not Found", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function onRequest({ request, env }: PagesContext): Promise<Response> {
  if (!ALLOWED_HOSTS.has(new URL(request.url).hostname) || !env.PX) return notFound();
  return env.PX.fetch(request);
}
