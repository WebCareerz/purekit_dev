// Client for the /api/php-version Pages Function (functions/api/php-version.ts).

export type SiteSignal = "powered-by" | "phpsessid" | "laravel" | "wordpress" | "drupal" | "joomla";

export interface SiteCheckSuccess {
  ok: true;
  finalUrl: string;
  status: number;
  redirects: number;
  phpVersion: string | null;
  versionSource: "x-powered-by" | "server" | null;
  poweredBy: string | null;
  server: string | null;
  signals: SiteSignal[];
}

export type SiteCheckErrorCode =
  | "invalid_url"
  | "blocked_host"
  | "forbidden_host"
  | "timeout"
  | "fetch_failed"
  | "too_many_redirects"
  | "unavailable";

export interface SiteCheckFailure {
  ok: false;
  error: SiteCheckErrorCode;
}

export type SiteCheckResult = SiteCheckSuccess | SiteCheckFailure;

export async function checkSite(url: string): Promise<SiteCheckResult> {
  try {
    const res = await fetch(`/api/php-version?url=${encodeURIComponent(url.trim())}`, {
      headers: { accept: "application/json" },
    });
    if (!(res.headers.get("content-type") ?? "").includes("json")) return { ok: false, error: "unavailable" };
    return (await res.json()) as SiteCheckResult;
  } catch {
    return { ok: false, error: "unavailable" };
  }
}

// "example.com", "https://example.com/blog" — but not "8.1.2" or "php -v" output.
export function looksLikeUrl(input: string): boolean {
  const s = input.trim();
  if (!s || /\s/.test(s)) return false;
  if (/^https?:\/\//i.test(s)) return true;
  // Four dotted numbers are an IPv4 address, never a PHP version.
  if (/^\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?(?:[/?#].*)?$/.test(s)) return true;
  return /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z][a-z0-9-]*[a-z0-9](?::\d+)?(?:[/?#].*)?$/i.test(s);
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
