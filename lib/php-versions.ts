// PHP release branch data.
// Sources (retrieved 2026-10-22):
// - https://www.php.net/supported-versions.php (supported branches, active/security dates)
// - https://www.php.net/eol.php (end-of-life dates and last releases)
// - https://www.php.net/releases/?json&version=X.Y (latest release per branch, X.Y.0 dates)
// Update PHP_DATA_AS_OF and the `latest` fields whenever new point releases ship.

export const PHP_DATA_AS_OF = "2026-10-22";

export interface PhpBranch {
  branch: string;
  released: string;
  activeUntil?: string;
  securityUntil: string;
  latest: string;
}

// Newest first. Dates are ISO (YYYY-MM-DD); support ends at the end of the listed day.
export const PHP_BRANCHES: PhpBranch[] = [
  { branch: "8.5", released: "2025-11-20", activeUntil: "2027-12-31", securityUntil: "2029-12-31", latest: "8.5.12" },
  { branch: "8.4", released: "2024-11-21", activeUntil: "2026-12-31", securityUntil: "2028-12-31", latest: "8.4.27" },
  { branch: "8.3", released: "2023-11-23", activeUntil: "2025-12-31", securityUntil: "2027-12-31", latest: "8.3.36" },
  { branch: "8.2", released: "2022-12-08", activeUntil: "2024-12-31", securityUntil: "2026-12-31", latest: "8.2.35" },
  { branch: "8.1", released: "2021-11-25", securityUntil: "2025-12-31", latest: "8.1.34" },
  { branch: "8.0", released: "2020-11-26", securityUntil: "2023-11-26", latest: "8.0.30" },
  { branch: "7.4", released: "2019-11-28", securityUntil: "2022-11-28", latest: "7.4.33" },
  { branch: "7.3", released: "2018-12-06", securityUntil: "2021-12-06", latest: "7.3.33" },
  { branch: "7.2", released: "2017-11-30", securityUntil: "2020-11-30", latest: "7.2.34" },
  { branch: "7.1", released: "2016-12-01", securityUntil: "2019-12-01", latest: "7.1.33" },
  { branch: "7.0", released: "2015-12-03", securityUntil: "2019-01-10", latest: "7.0.33" },
  { branch: "5.6", released: "2014-08-28", securityUntil: "2018-12-31", latest: "5.6.40" },
  { branch: "5.5", released: "2013-06-20", securityUntil: "2016-07-21", latest: "5.5.38" },
  { branch: "5.4", released: "2012-03-01", securityUntil: "2015-09-03", latest: "5.4.45" },
  { branch: "5.3", released: "2009-06-30", securityUntil: "2014-08-14", latest: "5.3.29" },
  { branch: "5.2", released: "2006-11-02", securityUntil: "2011-01-06", latest: "5.2.17" },
  { branch: "5.1", released: "2005-11-24", securityUntil: "2006-08-24", latest: "5.1.6" },
  { branch: "5.0", released: "2004-07-13", securityUntil: "2005-09-05", latest: "5.0.5" },
];

export type SupportStatus = "active" | "security" | "eol";

export interface ParsedPhpVersion {
  major: number;
  minor: number;
  patch: number | null;
  // Distribution suffix such as "-1ubuntu2.14" or "+deb12u1"
  suffix: string;
}

const VERSION_PATTERNS = [
  // "X-Powered-By: PHP/8.1.2", "PHP Version 8.1.2" (phpinfo), "PHP 8.1.2 (cli)", "php8.1-fpm"
  /\bPHP(?:[\s/-]*Version)?[\s/-]*(\d+)\.(\d+)(?:\.(\d+))?([-+~][\w.+~-]*)?/i,
  // Bare version: "8.1", "7.4.33"
  /(?:^|[^\d.])(\d+)\.(\d+)(?:\.(\d+))?([-+~][\w.+~-]*)?/,
];

export function parsePhpVersion(input: string): ParsedPhpVersion | null {
  const text = input.trim();
  if (!text) return null;
  for (const pattern of VERSION_PATTERNS) {
    const m = pattern.exec(text);
    if (m) {
      const patch = m[3] !== undefined ? parseInt(m[3], 10) : null;
      return {
        major: parseInt(m[1], 10),
        minor: parseInt(m[2], 10),
        patch,
        suffix: patch !== null && m[4] ? m[4] : "",
      };
    }
  }
  return null;
}

export function findBranch(major: number, minor: number): PhpBranch | undefined {
  return PHP_BRANCHES.find((b) => b.branch === `${major}.${minor}`);
}

export function getSupportStatus(branch: PhpBranch, today: string): SupportStatus {
  if (branch.activeUntil && today <= branch.activeUntil) return "active";
  if (today <= branch.securityUntil) return "security";
  return "eol";
}

// Compares "8.1" style versions. Returns <0, 0 or >0.
export function compareBranches(a: string, b: string): number {
  const [aMajor, aMinor] = a.split(".").map(Number);
  const [bMajor, bMinor] = b.split(".").map(Number);
  return aMajor !== bMajor ? aMajor - bMajor : aMinor - bMinor;
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86400000);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function latestPatch(branch: PhpBranch): number {
  return parseInt(branch.latest.split(".")[2], 10);
}

// Newest branch that still receives active support (bug + security fixes).
export function recommendedBranch(today: string): PhpBranch {
  return PHP_BRANCHES.find((b) => getSupportStatus(b, today) === "active") ?? PHP_BRANCHES[0];
}
