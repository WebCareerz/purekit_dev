// Client for the /api/php-version Pages Function (functions/api/php-version.ts).

import { parsePhpVersion } from "./php-versions";
import { php2shellVerdict } from "./php2shell";

export type SiteSignal = "powered-by" | "phpsessid" | "laravel" | "wordpress" | "drupal" | "joomla";

export interface SiteCheckSuccess {
  ok: true;
  finalUrl: string;
  status: number;
  // The site's bot protection or firewall refused the request.
  blocked: boolean;
  redirects: number;
  phpVersion: string | null;
  versionSource: "x-powered-by" | "server" | null;
  // The URL whose response carried the version: the homepage, or /wp-json/ for WordPress.
  versionUrl: string | null;
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

// Properties for the "Site Check" analytics event: outcome categories only, never the
// address or anything else that identifies the checked site.
export function siteCheckEventProps(
  tool: "php-version-checker" | "php2shell-checker",
  result: SiteCheckResult
): Record<string, string> {
  const none = { php_branch: "none", php2shell: "none", source: "none" };
  if (!result.ok) return { tool, result: "error", ...none };
  const parsed = result.phpVersion ? parsePhpVersion(`PHP/${result.phpVersion}`) : null;
  if (!parsed) return { tool, result: result.blocked ? "blocked" : "hidden", ...none };
  return {
    tool,
    result: "found",
    php_branch: `${parsed.major}.${parsed.minor}`,
    php2shell: php2shellVerdict(parsed).kind,
    source: result.versionUrl?.endsWith("/wp-json/") ? "wp-json" : "homepage",
  };
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
