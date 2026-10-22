// Cloudflare Pages Function: GET /api/php-version?url=<site>
// Requests a site's homepage once and reports the PHP version it exposes in its
// response headers (X-Powered-By / Server), plus signs that the site runs PHP.
// Browsers can't read another site's response headers, so this has to run server-side.
// Nothing is stored or logged by this function.

interface PagesContext {
  request: Request;
}

type ErrorCode = "invalid_url" | "blocked_host" | "forbidden_host" | "timeout" | "fetch_failed" | "too_many_redirects";

// Only answer on the production domains: the zone's rate limiting rule doesn't cover the
// project's *.pages.dev address or preview deployments. localhost is for `wrangler pages dev`.
const ALLOWED_HOSTS = new Set(["www.purekit.dev", "purekit.dev", "localhost", "127.0.0.1"]);

const MAX_REDIRECTS = 4;
const TIMEOUT_MS = 8000;
const BODY_LIMIT = 131072;
const USER_AGENT = "Mozilla/5.0 (compatible; PureKitPHPCheck/1.0; +https://www.purekit.dev/en/php-version-checker/)";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
}

function fail(error: ErrorCode, status: number): Response {
  return json({ ok: false, error }, status);
}

function normalizeTarget(raw: string): URL | null {
  let s = raw.trim();
  if (!s || s.length > 2048) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = `https://${s}`;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (u.username || u.password) return null;
  return u;
}

// Workers can't reach private networks, but refuse obvious internal targets anyway.
// The URL parser has already normalized numeric hosts (0x7f.1, 2130706433) to dotted IPv4.
function isBlockedTarget(u: URL): boolean {
  if (u.port && u.port !== "80" && u.port !== "443") return true;
  const h = u.hostname.toLowerCase().replace(/\.$/, "");
  if (h.startsWith("[") || h.includes(":")) return true;
  if (!h.includes(".")) return true;
  if (/(?:^|\.)(?:localhost|local|internal|lan|home|arpa|test|invalid)$/.test(h)) return true;
  const ip = /^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/.exec(h);
  if (ip) {
    const a = Number(ip[1]);
    const b = Number(ip[2]);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  return false;
}

async function readLimited(res: Response, limit: number): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < limit) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.byteLength;
  }
  await reader.cancel().catch(() => {});
  const buf = new Uint8Array(Math.min(size, limit));
  let offset = 0;
  for (const chunk of chunks) {
    const n = Math.min(chunk.byteLength, buf.length - offset);
    buf.set(chunk.subarray(0, n), offset);
    offset += n;
    if (offset >= buf.length) break;
  }
  return new TextDecoder().decode(buf);
}

interface Evidence {
  phpVersion: string | null;
  versionSource: "x-powered-by" | "server" | null;
  poweredBy: string | null;
  server: string | null;
  signals: Set<string>;
}

const PHP_TOKEN = /\bPHP\/(\d+\.\d+(?:\.\d+)?[\w.+~-]*)/i;

function collectHeaders(headers: Headers, ev: Evidence) {
  const poweredBy = headers.get("x-powered-by");
  const server = headers.get("server");
  if (poweredBy) {
    ev.poweredBy = poweredBy.slice(0, 200);
    if (/\bPHP\b/i.test(poweredBy)) ev.signals.add("powered-by");
    const m = PHP_TOKEN.exec(poweredBy);
    if (m && !ev.phpVersion) {
      ev.phpVersion = m[1];
      ev.versionSource = "x-powered-by";
    }
  }
  // Inside Cloudflare Workers, subrequest responses carry "server: cloudflare" no matter
  // which server the site runs, so that value says nothing about the target.
  if (server && server.trim().toLowerCase() !== "cloudflare") {
    ev.server = server.slice(0, 200);
    const m = PHP_TOKEN.exec(server);
    if (m && !ev.phpVersion) {
      ev.phpVersion = m[1];
      ev.versionSource = "server";
    }
  }
  const cookies = headers.get("set-cookie") ?? "";
  if (/(?:^|[\s,;])PHPSESSID=/i.test(cookies)) ev.signals.add("phpsessid");
  if (/(?:^|[\s,;])laravel_session=/i.test(cookies)) ev.signals.add("laravel");
  if (/(?:^|[\s,;])wordpress_|(?:^|[\s,;])wp-settings-/i.test(cookies)) ev.signals.add("wordpress");
  if (/rel="https:\/\/api\.w\.org\/"/i.test(headers.get("link") ?? "")) ev.signals.add("wordpress");
  if (/xmlrpc\.php/i.test(headers.get("x-pingback") ?? "")) ev.signals.add("wordpress");
  if (/drupal/i.test(headers.get("x-generator") ?? "") || headers.has("x-drupal-cache")) ev.signals.add("drupal");
}

function collectBody(html: string, ev: Evidence) {
  if (/<meta[^>]+name=["']generator["'][^>]+content=["']WordPress/i.test(html) || /\/wp-(?:content|includes)\//i.test(html)) {
    ev.signals.add("wordpress");
  }
  if (/<meta[^>]+name=["']generator["'][^>]+content=["']Drupal/i.test(html)) ev.signals.add("drupal");
  if (/<meta[^>]+name=["']generator["'][^>]+content=["']Joomla/i.test(html)) ev.signals.add("joomla");
}

export async function onRequestGet({ request }: PagesContext): Promise<Response> {
  const requestUrl = new URL(request.url);
  if (!ALLOWED_HOSTS.has(requestUrl.hostname)) return fail("forbidden_host", 403);
  const target = normalizeTarget(requestUrl.searchParams.get("url") ?? "");
  if (!target) return fail("invalid_url", 400);

  const ev: Evidence = { phpVersion: null, versionSource: null, poweredBy: null, server: null, signals: new Set() };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let current = target;

  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      if (isBlockedTarget(current)) return fail("blocked_host", 400);
      let res: Response;
      try {
        res = await fetch(current.toString(), {
          method: "GET",
          redirect: "manual",
          headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
          signal: controller.signal,
        });
      } catch {
        return fail(controller.signal.aborted ? "timeout" : "fetch_failed", 502);
      }

      collectHeaders(res.headers, ev);
      const location = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && location) {
        await res.body?.cancel().catch(() => {});
        let next: URL;
        try {
          next = new URL(location, current);
        } catch {
          return fail("fetch_failed", 502);
        }
        if (next.protocol !== "https:" && next.protocol !== "http:") return fail("fetch_failed", 502);
        current = next;
        continue;
      }

      if (/html/i.test(res.headers.get("content-type") ?? "")) {
        try {
          collectBody(await readLimited(res, BODY_LIMIT), ev);
        } catch {
          // The headers are what matter; a broken body stream is not an error.
        }
      } else {
        await res.body?.cancel().catch(() => {});
      }

      return json({
        ok: true,
        finalUrl: current.toString(),
        status: res.status,
        redirects: hop,
        phpVersion: ev.phpVersion,
        versionSource: ev.versionSource,
        poweredBy: ev.poweredBy,
        server: ev.server,
        signals: [...ev.signals],
      });
    }
    return fail("too_many_redirects", 502);
  } finally {
    clearTimeout(timer);
  }
}
