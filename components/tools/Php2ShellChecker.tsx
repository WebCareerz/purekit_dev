"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { type Locale } from "@/lib/i18n";
import {
  PHP_BRANCHES,
  PHP_DATA_AS_OF,
  findBranch,
  getSupportStatus,
  parsePhpVersion,
  todayIso,
  type ParsedPhpVersion,
  type SupportStatus,
} from "@/lib/php-versions";
import {
  PHP2SHELL_ADVISORY_URL,
  PHP2SHELL_FIXED,
  PHP2SHELL_GHSA,
  php2shellVerdict,
  type Php2ShellVerdict,
} from "@/lib/php2shell";
import { checkSite, hostOf, looksLikeUrl, type SiteCheckResult, type SiteSignal } from "@/lib/site-check";

interface Php2ShellCheckerProps {
  lang: Locale;
  t: Record<string, unknown>;
}

type Outcome =
  | { source: "version"; parsed: ParsedPhpVersion }
  | { source: "site"; site: SiteCheckResult }
  | { source: "invalid" };

const SIGNAL_KEYS: Record<SiteSignal, string> = {
  "powered-by": "signalPoweredBy",
  phpsessid: "signalPhpsessid",
  laravel: "signalLaravel",
  wordpress: "signalWordpress",
  drupal: "signalDrupal",
  joomla: "signalJoomla",
};

const SITE_ERROR_KEYS: Record<string, string> = {
  invalid_url: "siteErrorInvalid",
  blocked_host: "siteErrorBlocked",
  forbidden_host: "siteErrorUnavailable",
  timeout: "siteErrorTimeout",
  fetch_failed: "siteErrorFetch",
  too_many_redirects: "siteErrorRedirects",
  unavailable: "siteErrorUnavailable",
};

type Tone = "safe" | "danger" | "warn" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  safe: "border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-200",
  danger: "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
  warn: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  neutral: "border-border bg-muted/40",
};

const STATUS_CLASSES: Record<SupportStatus, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400",
  security: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400",
  eol: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400",
};

const subscribeNoop = () => () => {};

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}

export default function Php2ShellChecker({ lang, t }: Php2ShellCheckerProps) {
  const toolT = (t.tools as Record<string, Record<string, string>>)["php2shell-checker"];
  const versionT = (t.tools as Record<string, Record<string, string>>)["php-version-checker"];
  const today = useSyncExternalStore(subscribeNoop, todayIso, () => PHP_DATA_AS_OF);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = input.trim();
    if (!value || loading) return;
    if (looksLikeUrl(value)) {
      setLoading(true);
      setOutcome({ source: "site", site: await checkSite(value) });
      setLoading(false);
      return;
    }
    const parsed = parsePhpVersion(value);
    setOutcome(parsed ? { source: "version", parsed } : { source: "invalid" });
  };

  const statusBadge = (status: SupportStatus) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_CLASSES[status]}`}>
      {status === "active" ? versionT.statusActive : status === "security" ? versionT.statusSecurity : versionT.statusEol}
    </span>
  );

  const verdictCard = (parsed: ParsedPhpVersion) => {
    const version = `${parsed.major}.${parsed.minor}${parsed.patch !== null ? `.${parsed.patch}` : ""}`;
    const branch = `${parsed.major}.${parsed.minor}`;
    const v: Php2ShellVerdict = php2shellVerdict(parsed);
    const map: Record<Php2ShellVerdict["kind"], { tone: Tone; title: string; body: string }> = {
      patched: { tone: "safe", title: toolT.verdictPatchedTitle, body: fill(toolT.verdictPatched, { version, fixed: "fixed" in v ? v.fixed : "" }) },
      affected: { tone: "danger", title: toolT.verdictAffectedTitle, body: fill(toolT.verdictAffected, { version, fixed: "fixed" in v ? v.fixed : "" }) },
      needsPatch: { tone: "warn", title: toolT.verdictNeedsPatchTitle, body: fill(toolT.verdictNeedsPatch, { branch, fixed: "fixed" in v ? v.fixed : "" }) },
      unsupported: { tone: "danger", title: toolT.verdictUnsupportedTitle, body: fill(toolT.verdictUnsupported, { branch }) },
      prerelease: { tone: "warn", title: toolT.verdictPrereleaseTitle, body: toolT.verdictPrerelease },
      unknown: { tone: "neutral", title: toolT.verdictUnknownTitle, body: fill(toolT.verdictUnknown, { version }) },
    };
    const card = map[v.kind];
    const supportBranch = findBranch(parsed.major, parsed.minor);

    return (
      <div className="space-y-3">
        <div className={`rounded-lg border p-4 space-y-2 ${TONE_CLASSES[card.tone]}`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xl font-bold tracking-tight">{card.title}</span>
            <span className="font-mono text-sm">PHP {version}</span>
          </div>
          <p className="text-sm">{card.body}</p>
          {parsed.suffix && v.kind !== "patched" && (
            <p className="text-sm">{fill(toolT.distroCaveat, { suffix: parsed.suffix })}</p>
          )}
        </div>
        {(v.kind === "affected" || v.kind === "unsupported" || v.kind === "needsPatch") && (
          <div className="text-sm space-y-1">
            <p className="font-medium">{toolT.nextStepsTitle}</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>{v.kind === "unsupported" ? toolT.stepUpgradeBranch : fill(toolT.stepUpdate, { fixed: "fixed" in v ? v.fixed : "" })}</li>
              <li>{toolT.stepRestart}</li>
              <li>{toolT.stepMitigate}</li>
            </ul>
          </div>
        )}
        {supportBranch && (
          <p className="text-sm text-muted-foreground">
            {fill(toolT.supportLine, { branch: supportBranch.branch })} {statusBadge(getSupportStatus(supportBranch, today))}{" "}
            <Link href={`/${lang}/php-version-checker/`} className="underline underline-offset-4">
              {toolT.versionCheckerLink}
            </Link>
          </p>
        )}
      </div>
    );
  };

  const renderOutcome = () => {
    if (loading) return <p className="text-sm text-muted-foreground">{toolT.checking}</p>;
    if (!outcome) return <p className="text-sm text-muted-foreground">{toolT.empty}</p>;
    if (outcome.source === "invalid") {
      return (
        <div className="text-sm px-3 py-1.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
          {toolT.invalidInput}
        </div>
      );
    }
    if (outcome.source === "version") return verdictCard(outcome.parsed);

    const site = outcome.site;
    if (!site.ok) {
      return (
        <div className="text-sm px-3 py-1.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
          {toolT[SITE_ERROR_KEYS[site.error] ?? "siteErrorFetch"]}
        </div>
      );
    }
    const host = hostOf(site.finalUrl);
    const parsed = site.phpVersion ? parsePhpVersion(`PHP/${site.phpVersion}`) : null;
    const signals = site.signals.map((s) => toolT[SIGNAL_KEYS[s]]);

    return (
      <div className="space-y-3">
        <div className="text-xs text-muted-foreground break-all">
          {site.finalUrl} · HTTP {site.status}
        </div>
        {parsed ? (
          <>
            <p className="text-sm">
              {fill(toolT.siteFound, {
                host,
                version: site.phpVersion!,
                header: site.versionSource === "server" ? "Server" : "X-Powered-By",
              })}
            </p>
            {verdictCard(parsed)}
          </>
        ) : site.blocked ? (
          <div className={`rounded-lg border p-4 space-y-2 text-sm ${TONE_CLASSES.warn}`}>
            <p className="text-lg font-semibold">{fill(toolT.siteBlocked, { host, status: site.status })}</p>
            <p>{toolT.siteBlockedDetail}</p>
          </div>
        ) : (
          <div className={`rounded-lg border p-4 space-y-2 text-sm ${TONE_CLASSES.warn}`}>
            <p className="text-lg font-semibold">{fill(toolT.siteHidden, { host })}</p>
            <p>{toolT.siteHiddenDetail}</p>
            <p>{signals.length ? fill(toolT.siteSignals, { signals: signals.join(", ") }) : toolT.siteNoSignals}</p>
          </div>
        )}
        {(site.poweredBy || site.server) && (
          <div className="rounded-md bg-muted/40 border border-border p-3 font-mono text-xs space-y-1 break-all">
            {site.poweredBy && <div>X-Powered-By: {site.poweredBy}</div>}
            {site.server && <div>Server: {site.server}</div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Key facts */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {PHP2SHELL_GHSA.map((g) => (
          <a
            key={g.cve}
            href={`https://github.com/php/php-src/security/advisories/${g.ghsa}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-border px-2 py-1 font-mono hover:border-primary/50"
          >
            {g.cve}
          </a>
        ))}
        <span className="rounded-md border border-border px-2 py-1">{toolT.factCvss}</span>
        <span className="rounded-md border border-border px-2 py-1">{toolT.factPatched}</span>
        <a
          href={PHP2SHELL_ADVISORY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-border px-2 py-1 underline underline-offset-4 hover:border-primary/50"
        >
          {toolT.advisoryLink}
        </a>
      </div>

      {/* Checker */}
      <form onSubmit={run} className="space-y-2">
        <label htmlFor="php2shell-input" className="text-sm font-medium">
          {toolT.inputLabel}
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            id="php2shell-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={toolT.inputPlaceholder}
            className="font-mono"
            spellCheck={false}
            autoComplete="off"
          />
          <Button type="submit" disabled={!input.trim() || loading}>
            {loading ? toolT.checkingButton : toolT.check}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{toolT.privacyNote}</p>
      </form>

      <div className="border border-border rounded-lg p-4" aria-live="polite">
        {renderOutcome()}
      </div>

      {/* Fixed versions */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">{toolT.fixedTitle}</h3>
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium whitespace-nowrap">{toolT.colBranch}</th>
                <th className="px-3 py-2 font-medium whitespace-nowrap">{toolT.colAffected}</th>
                <th className="px-3 py-2 font-medium whitespace-nowrap">{toolT.colFixed}</th>
                <th className="px-3 py-2 font-medium whitespace-nowrap">{toolT.colSupport}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PHP2SHELL_FIXED.map((f) => {
                const b = PHP_BRANCHES.find((x) => x.branch === f.branch);
                return (
                  <tr key={f.branch}>
                    <td className="px-3 py-1.5 whitespace-nowrap font-mono font-medium">PHP {f.branch}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap font-mono">&lt; {f.fixed}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap font-mono font-medium">{f.fixed}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap">{b && statusBadge(getSupportStatus(b, today))}</td>
                  </tr>
                );
              })}
              <tr>
                <td className="px-3 py-1.5 whitespace-nowrap font-mono font-medium">PHP 8.1 {toolT.andOlder}</td>
                <td className="px-3 py-1.5 whitespace-nowrap">{toolT.allVersions}</td>
                <td className="px-3 py-1.5">{toolT.noRelease}</td>
                <td className="px-3 py-1.5 whitespace-nowrap">{statusBadge("eol")}</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 whitespace-nowrap font-mono font-medium">PHP 8.6</td>
                <td className="px-3 py-1.5 whitespace-nowrap">{toolT.rcAffected}</td>
                <td className="px-3 py-1.5 whitespace-nowrap font-mono">8.6.0 RC4</td>
                <td className="px-3 py-1.5 whitespace-nowrap text-muted-foreground">{toolT.prereleaseLabel}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">{toolT.tableSource}</p>
      </div>

      <p className="text-xs text-muted-foreground">{toolT.disclaimer}</p>
    </div>
  );
}
