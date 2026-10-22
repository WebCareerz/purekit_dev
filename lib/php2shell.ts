// PHP2Shell: CVE-2026-109618 (GHSA-w8hw-w9fx-j79w) and CVE-2026-109619 (GHSA-6wmf-4rv5-p3rp).
// Sources (retrieved 2026-10-22):
// - PHP security advisory, 21 Oct 2026: https://www.php.net/archive/2026.php#2026-10-21-5
// - GitHub advisories (php/php-src): every release below these versions is affected.
// PHP 8.6.0 RC4 also contains the fixes. 8.1 and older get no releases; the PHP team
// published minimal source backports for 7.4, 8.0 and 8.1.

import { compareBranches, type ParsedPhpVersion } from "./php-versions";

export const PHP2SHELL_ADVISORY_URL = "https://www.php.net/archive/2026.php#2026-10-21-5";
export const PHP2SHELL_GHSA = [
  { cve: "CVE-2026-109618", ghsa: "GHSA-w8hw-w9fx-j79w", title: "RCE via OOM corruption" },
  { cve: "CVE-2026-109619", ghsa: "GHSA-6wmf-4rv5-p3rp", title: "RCE via stale global state" },
];

export const PHP2SHELL_FIXED: { branch: string; fixed: string }[] = [
  { branch: "8.5", fixed: "8.5.12" },
  { branch: "8.4", fixed: "8.4.27" },
  { branch: "8.3", fixed: "8.3.36" },
  { branch: "8.2", fixed: "8.2.35" },
];

export type Php2ShellVerdict =
  | { kind: "patched"; fixed: string }
  | { kind: "affected"; fixed: string }
  | { kind: "needsPatch"; fixed: string }
  | { kind: "unsupported" }
  | { kind: "prerelease" }
  | { kind: "unknown" };

export function php2shellVerdict(v: ParsedPhpVersion): Php2ShellVerdict {
  const branch = `${v.major}.${v.minor}`;
  const entry = PHP2SHELL_FIXED.find((f) => f.branch === branch);
  if (entry) {
    if (v.patch === null) return { kind: "needsPatch", fixed: entry.fixed };
    const fixedPatch = parseInt(entry.fixed.split(".")[2], 10);
    return v.patch >= fixedPatch ? { kind: "patched", fixed: entry.fixed } : { kind: "affected", fixed: entry.fixed };
  }
  if (branch === "8.6") return { kind: "prerelease" };
  if (compareBranches(branch, "8.2") < 0) return { kind: "unsupported" };
  return { kind: "unknown" };
}
