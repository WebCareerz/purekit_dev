"use client";

import { useDeferredValue, useMemo, useState, useSyncExternalStore } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import CopyButton from "./CopyButton";
import {
  PHP_BRANCHES,
  PHP_DATA_AS_OF,
  compareBranches,
  daysBetween,
  findBranch,
  formatDate,
  getSupportStatus,
  latestPatch,
  parsePhpVersion,
  recommendedBranch,
  todayIso,
  type PhpBranch,
  type SupportStatus,
} from "@/lib/php-versions";
import { analyzePhpCode, branchCompat, type BranchCompat, type Finding } from "@/lib/php-compat";

interface PhpVersionCheckerProps {
  t: Record<string, unknown>;
}

const EXAMPLE_CODE = `<?php
declare(strict_types=1);

enum Status: string
{
    case Paid = 'paid';
    case Overdue = 'overdue';
}

final class Invoice
{
    public function __construct(
        public readonly int $id,
        private array $lines = [],
    ) {}

    public function total(): float
    {
        return array_sum(array_map(
            fn(array $line): float => $line['qty'] * $line['price'],
            $this->lines,
        ));
    }

    public function label(Status $status = null): string
    {
        return match ($status) {
            Status::Paid => 'Paid',
            Status::Overdue => 'Overdue',
            null => 'Draft',
        };
    }

    public function isRefund(): bool
    {
        return str_starts_with((string) $this->id, '9');
    }
}

$invoice = new Invoice(id: 42);
echo $invoice->label();
`;

const FIND_SNIPPETS = [
  { key: "findCli", code: "php -v" },
  { key: "findHeader", code: "curl -sI https://example.com | grep -i x-powered-by" },
  { key: "findScript", code: "<?php echo PHP_VERSION;" },
];

const QUICK_PICKS = PHP_BRANCHES.filter((b) => compareBranches(b.branch, "5.6") >= 0).map((b) => b.branch);
const COMPAT_BRANCHES = [...QUICK_PICKS].reverse();

const STATUS_CLASSES: Record<SupportStatus, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400",
  security: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400",
  eol: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400",
};

const COMPAT_CLASSES: Record<BranchCompat, string> = {
  ok: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900",
  deprecated: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900",
  incompatible: "bg-muted text-muted-foreground border-border line-through",
};

const subscribeNoop = () => () => {};

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}

function migrationGuideUrl(branch: string): string {
  return `https://www.php.net/manual/en/migration${branch.replace(".", "")}.php`;
}

export default function PhpVersionChecker({ t }: PhpVersionCheckerProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)["php-version-checker"];

  // Support status depends on the date: render with the data snapshot date on the
  // server and during hydration, then switch to the visitor's real date.
  const today = useSyncExternalStore(subscribeNoop, todayIso, () => PHP_DATA_AS_OF);

  const [versionInput, setVersionInput] = useState("");
  const [code, setCode] = useState("");
  const deferredCode = useDeferredValue(code);

  const relative = (days: number): string => {
    const abs = Math.abs(days);
    let value: string;
    if (abs < 60) {
      value = `${abs} ${abs === 1 ? toolT.unitDay : toolT.unitDays}`;
    } else if (abs < 365) {
      const months = Math.floor(abs / 30.44);
      value = `${months} ${toolT.unitMonths}`;
    } else {
      const years = Math.floor(abs / 365.25);
      const months = Math.min(11, Math.floor((abs - years * 365.25) / 30.44));
      value = `${years} ${years === 1 ? toolT.unitYear : toolT.unitYears}`;
      if (months > 0) value += `, ${months} ${months === 1 ? toolT.unitMonth : toolT.unitMonths}`;
    }
    return fill(days >= 0 ? toolT.relativeFuture : toolT.relativePast, { value });
  };

  const statusLabel = (status: SupportStatus) =>
    status === "active" ? toolT.statusActive : status === "security" ? toolT.statusSecurity : toolT.statusEol;

  const statusBadge = (status: SupportStatus) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_CLASSES[status]}`}>
      {statusLabel(status)}
    </span>
  );

  // ----- Version lookup -----
  const parsed = useMemo(() => parsePhpVersion(versionInput), [versionInput]);
  const branch = parsed ? findBranch(parsed.major, parsed.minor) : undefined;
  const recommended = recommendedBranch(today);

  const renderVersionResult = () => {
    if (!versionInput.trim()) {
      return <p className="text-sm text-muted-foreground">{toolT.versionEmpty}</p>;
    }
    if (!parsed) {
      return (
        <div className="text-sm px-3 py-1.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
          {toolT.invalidVersion}
        </div>
      );
    }
    const versionText = `${parsed.major}.${parsed.minor}${parsed.patch !== null ? `.${parsed.patch}` : ""}`;
    if (!branch) {
      const key = `${parsed.major}.${parsed.minor}`;
      const message =
        compareBranches(key, PHP_BRANCHES[0].branch) > 0
          ? fill(toolT.unknownNewer, { version: key, date: formatDate(PHP_DATA_AS_OF) })
          : compareBranches(key, PHP_BRANCHES[PHP_BRANCHES.length - 1].branch) < 0
            ? fill(toolT.unknownOlder, { version: key })
            : fill(toolT.neverReleased, { version: key });
      return <p className="text-sm text-muted-foreground">{message}</p>;
    }

    const status = getSupportStatus(branch, today);
    const idx = PHP_BRANCHES.indexOf(branch);
    const nextBranch: PhpBranch | undefined = idx > 0 ? PHP_BRANCHES[idx - 1] : undefined;
    const lp = latestPatch(branch);

    let summary: string;
    if (status === "active") {
      summary = fill(toolT.summaryActive, {
        date: formatDate(branch.activeUntil!),
        relative: relative(daysBetween(today, branch.activeUntil!)),
        securityDate: formatDate(branch.securityUntil),
      });
    } else if (status === "security") {
      summary = fill(toolT.summarySecurity, {
        date: formatDate(branch.securityUntil),
        relative: relative(daysBetween(today, branch.securityUntil)),
      });
    } else {
      summary = fill(toolT.summaryEol, {
        date: formatDate(branch.securityUntil),
        relative: relative(daysBetween(today, branch.securityUntil)),
      });
    }

    let patchMessage: string | null = null;
    if (parsed.patch !== null) {
      const vars = { version: versionText, latest: branch.latest, branch: branch.branch };
      patchMessage =
        parsed.patch < lp
          ? fill(toolT.patchBehind, vars)
          : parsed.patch === lp
            ? fill(toolT.patchCurrent, vars)
            : fill(toolT.patchNewer, vars);
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-2xl font-bold tracking-tight">PHP {versionText}</span>
          {statusBadge(status)}
        </div>
        <p className="text-sm">{summary}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-md border border-border p-3">
            <div className="text-xs text-muted-foreground">{toolT.released}</div>
            <div className="font-medium">{formatDate(branch.released)}</div>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="text-xs text-muted-foreground">{toolT.activeSupportUntil}</div>
            <div className="font-medium">{branch.activeUntil ? formatDate(branch.activeUntil) : "—"}</div>
          </div>
          <div className="rounded-md border border-border p-3">
            <div className="text-xs text-muted-foreground">{toolT.securityUntil}</div>
            <div className="font-medium">{formatDate(branch.securityUntil)}</div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">{fill(toolT.latestRelease, { branch: branch.branch })}: </span>
            <span className="font-mono font-medium">{branch.latest}</span>
          </p>
          {patchMessage && <p>{patchMessage}</p>}
          {parsed.suffix && <p className="text-muted-foreground">{toolT.distroNote}</p>}
        </div>

        <div className="rounded-md bg-muted/40 border border-border p-3 text-sm space-y-1">
          {status === "active" ? (
            <p>{toolT.recommendOk}</p>
          ) : (
            <p>
              {fill(status === "eol" ? toolT.recommendUpgradeEol : toolT.recommendUpgrade, {
                branch: recommended.branch,
                latest: recommended.latest,
                date: formatDate(recommended.securityUntil),
              })}
            </p>
          )}
          {status !== "active" && nextBranch && compareBranches(branch.branch, "5.6") >= 0 && (
            <p>
              <a
                href={migrationGuideUrl(nextBranch.branch)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4"
              >
                {fill(toolT.migrationGuide, { from: branch.branch, to: nextBranch.branch })}
              </a>
            </p>
          )}
        </div>
      </div>
    );
  };

  // ----- Code compatibility -----
  const result = useMemo(() => (deferredCode.trim() ? analyzePhpCode(deferredCode) : null), [deferredCode]);

  const findingRow = (f: Finding) => (
    <li key={f.id} className="flex items-start gap-3 py-2 text-sm">
      <span className="shrink-0 w-10 text-center rounded bg-primary/10 text-primary text-xs font-mono font-medium py-0.5">
        {f.version}
      </span>
      <span className="flex-1 min-w-0 break-words">
        {f.label}
        {f.category === "api" && f.kind === "added" && (
          <span className="ml-2 text-xs text-muted-foreground">({toolT.polyfillable})</span>
        )}
      </span>
      <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
        {fill(toolT.lineN, { line: f.line })}
        {f.count > 1 && ` · ${fill(toolT.occurrences, { count: f.count })}`}
      </span>
    </li>
  );

  const renderCodeResult = () => {
    if (!result) {
      return <p className="text-sm text-muted-foreground">{toolT.emptyCode}</p>;
    }
    const { findings, minFinding, syntaxFinding, breaksFinding } = result;
    const minBranch = minFinding ? PHP_BRANCHES.find((b) => b.branch === minFinding.version) : undefined;
    const conflict = minFinding && breaksFinding && compareBranches(minFinding.version, breaksFinding.version) >= 0;
    const groups = [
      { key: "added", title: toolT.groupAdded, items: findings.filter((f) => f.kind === "added" && f.category !== "attribute") },
      { key: "removed", title: toolT.groupRemoved, items: findings.filter((f) => f.kind === "removed") },
      { key: "deprecated", title: toolT.groupDeprecated, items: findings.filter((f) => f.kind === "deprecated") },
      { key: "attribute", title: toolT.groupAttributes, items: findings.filter((f) => f.category === "attribute"), note: toolT.attributesNote },
    ].filter((g) => g.items.length > 0);

    return (
      <div className="space-y-5">
        {/* Summary */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{toolT.minVersion}</div>
          {minFinding ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-3xl font-bold tracking-tight">PHP {minFinding.version}+</span>
                {minBranch && statusBadge(getSupportStatus(minBranch, today))}
              </div>
              <p className="text-sm text-muted-foreground">
                {fill(toolT.requiredBy, { feature: minFinding.label, line: minFinding.line })}
              </p>
              {minFinding.category === "api" && (
                <p className="text-sm text-muted-foreground">
                  {syntaxFinding
                    ? fill(toolT.syntaxOnly, { version: syntaxFinding.version })
                    : toolT.syntaxNone}
                </p>
              )}
            </>
          ) : (
            <>
              <div className="text-xl font-semibold">{toolT.noRequirements}</div>
              <p className="text-sm text-muted-foreground">{toolT.noRequirementsDetail}</p>
            </>
          )}
          {breaksFinding && (
            <div className="text-sm px-3 py-2 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
              {conflict
                ? fill(toolT.conflict, { min: minFinding!.version, feature: breaksFinding.label, removed: breaksFinding.version })
                : fill(toolT.breaksOn, { feature: breaksFinding.label, line: breaksFinding.line, version: breaksFinding.version })}
            </div>
          )}
        </div>

        {/* Compatibility by version */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{toolT.compatTitle}</div>
          <div className="flex flex-wrap gap-1.5">
            {COMPAT_BRANCHES.map((b) => {
              const state = branchCompat(result, b);
              const label =
                state === "ok" ? toolT.legendOk : state === "deprecated" ? toolT.legendDeprecated : toolT.legendIncompatible;
              return (
                <span
                  key={b}
                  title={`PHP ${b}: ${label}`}
                  className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-mono font-medium ${COMPAT_CLASSES[state]}`}
                >
                  {b}
                </span>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-green-500" />
              {toolT.legendOk}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
              {toolT.legendDeprecated}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-muted-foreground/40" />
              {toolT.legendIncompatible}
            </span>
          </div>
        </div>

        {/* Findings */}
        {groups.map((g) => (
          <div key={g.key} className="space-y-1">
            <div className="text-sm font-semibold">
              {g.title} <span className="text-muted-foreground font-normal">({g.items.length})</span>
            </div>
            {g.note && <p className="text-xs text-muted-foreground">{g.note}</p>}
            <ul className="divide-y divide-border">{g.items.map(findingRow)}</ul>
          </div>
        ))}

        <p className="text-xs text-muted-foreground">{toolT.disclaimer}</p>
      </div>
    );
  };

  return (
    <Tabs defaultValue="version" className="space-y-4">
      <TabsList className="w-full sm:w-fit">
        <TabsTrigger value="version">{toolT.tabVersion}</TabsTrigger>
        <TabsTrigger value="code">{toolT.tabCode}</TabsTrigger>
      </TabsList>

      {/* Version lookup */}
      <TabsContent value="version" className="space-y-6 mt-0">
        <div className="space-y-3">
          <label htmlFor="php-version-input" className="text-sm font-medium">
            {toolT.versionLabel}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="php-version-input"
              value={versionInput}
              onChange={(e) => setVersionInput(e.target.value)}
              placeholder={toolT.versionPlaceholder}
              className="font-mono"
              spellCheck={false}
              autoComplete="off"
            />
            <Button variant="outline" onClick={() => setVersionInput("")} disabled={!versionInput}>
              {common.clear}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground mr-1">{toolT.quickPick}</span>
            {QUICK_PICKS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setVersionInput(b)}
                className={`rounded-md border px-2 py-0.5 text-xs font-mono transition-colors hover:border-primary/50 ${
                  branch?.branch === b ? "border-primary bg-primary/10 text-primary" : "border-border"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="border border-border rounded-lg p-4">{renderVersionResult()}</div>

        {/* How to find your version */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">{toolT.howToFind}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {FIND_SNIPPETS.map((s) => (
              <div key={s.key} className="border border-border rounded-lg p-3 space-y-2 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">{toolT[s.key]}</span>
                  <CopyButton
                    text={s.code}
                    copyLabel={common.copy}
                    copiedLabel={common.copied}
                    size="sm"
                    className="h-6 text-xs"
                  />
                </div>
                <code className="block font-mono text-xs break-all">{s.code}</code>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{toolT.findNote}</p>
        </div>

        {/* Support timeline */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">{toolT.tableTitle}</h3>
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium whitespace-nowrap">{toolT.colVersion}</th>
                  <th className="px-3 py-2 font-medium whitespace-nowrap">{toolT.colStatus}</th>
                  <th className="px-3 py-2 font-medium whitespace-nowrap">{toolT.colReleased}</th>
                  <th className="px-3 py-2 font-medium whitespace-nowrap">{toolT.colActive}</th>
                  <th className="px-3 py-2 font-medium whitespace-nowrap">{toolT.colSecurity}</th>
                  <th className="px-3 py-2 font-medium whitespace-nowrap">{toolT.colLatest}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {PHP_BRANCHES.map((b) => (
                  <tr
                    key={b.branch}
                    onClick={() => setVersionInput(b.branch)}
                    className={`cursor-pointer hover:bg-muted/30 ${branch?.branch === b.branch ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-3 py-1.5 whitespace-nowrap font-mono font-medium">{b.branch}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap">{statusBadge(getSupportStatus(b, today))}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap">{formatDate(b.released)}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap">{b.activeUntil ? formatDate(b.activeUntil) : "—"}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap">{formatDate(b.securityUntil)}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap font-mono">{b.latest}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            {fill(toolT.dataSource, { date: formatDate(PHP_DATA_AS_OF) })}{" "}
            <a
              href="https://www.php.net/supported-versions.php"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              php.net
            </a>
          </p>
        </div>
      </TabsContent>

      {/* Code compatibility */}
      <TabsContent value="code" className="space-y-4 mt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3">
              <label htmlFor="php-code-input" className="text-sm font-medium">
                {toolT.codeLabel}
              </label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCode(EXAMPLE_CODE)}>
                  {toolT.loadExample}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCode("")} disabled={!code}>
                  {common.clear}
                </Button>
              </div>
            </div>
            <Textarea
              id="php-code-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={toolT.codePlaceholder}
              className="font-mono text-sm min-h-[200px] sm:min-h-[400px] resize-y"
              spellCheck={false}
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium sm:h-8 sm:flex sm:items-center">{toolT.resultLabel}</div>
            <div className="border border-border rounded-lg p-4 min-h-[200px] sm:min-h-[400px]">{renderCodeResult()}</div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
