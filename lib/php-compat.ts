// Static PHP compatibility checker: finds syntax and built-in functions/classes
// that need a minimum PHP version, were removed, or are deprecated.
// Rule sources: php.net migration guides (migrationXY.new-features, .new-functions,
// .new-classes, .deprecated, .incompatible, .removed-exts-sapis), retrieved 2026-10-22.
// Pattern matching only: strings and comments are blanked first, but the code is not
// fully parsed, so results are a strong hint rather than a guarantee.
// Categories: "syntax" can't be polyfilled; "api" (built-in functions/classes) can be
// provided by polyfills; "attribute" findings are ignored by older PHP versions.

import { compareBranches } from "./php-versions";

export type FindingKind = "added" | "removed" | "deprecated";
export type FindingCategory = "syntax" | "api" | "attribute";

export interface Finding {
  id: string;
  kind: FindingKind;
  category: FindingCategory;
  version: string;
  label: string;
  line: number;
  count: number;
}

export interface CompatResult {
  findings: Finding[];
  // Highest-version syntax or API requirement; attributes are not requirements.
  minFinding: Finding | null;
  syntaxFinding: Finding | null;
  breaksFinding: Finding | null;
  deprecatedFinding: Finding | null;
}

type Hit = [id: string, version: string, label: string];

const IDENT = "[A-Za-z_\\x80-\\uffff][\\w\\x80-\\uffff]*";
const QNAME = "\\\\?[A-Za-z_][\\w\\\\]*";

// ---------------------------------------------------------------------------
// Rule tables
// ---------------------------------------------------------------------------

const FUNCTIONS: [FindingKind, string, string[]][] = [
  ["added", "5.6", ["hash_equals", "ldap_escape", "session_abort", "session_reset"]],
  ["added", "7.0", ["intdiv", "random_bytes", "random_int", "preg_replace_callback_array", "error_clear_last", "get_resources", "inflate_init", "deflate_init"]],
  ["added", "7.1", ["is_iterable", "session_create_id", "session_gc", "pcntl_async_signals", "curl_multi_errno"]],
  ["added", "7.2", ["spl_object_id", "stream_isatty", "mb_chr", "mb_ord", "mb_scrub", "hash_hmac_algos", "imagebmp", "imagecreatefrombmp"]],
  ["added", "7.3", ["array_key_first", "array_key_last", "is_countable", "hrtime", "net_get_interfaces", "gc_status", "fpm_get_status"]],
  ["added", "7.4", ["mb_str_split", "password_algos", "get_mangled_object_vars", "openssl_x509_verify", "imagecreatefromtga"]],
  ["added", "8.0", ["str_contains", "str_starts_with", "str_ends_with", "get_debug_type", "fdiv", "get_resource_id", "preg_last_error_msg"]],
  ["added", "8.1", ["array_is_list", "fsync", "fdatasync", "mysqli_fetch_column", "imageavif", "imagecreatefromavif", "pcntl_rfork"]],
  ["added", "8.2", ["ini_parse_quantity", "memory_reset_peak_usage", "mysqli_execute_query", "curl_upkeep", "openssl_cipher_key_length", "libxml_get_external_entity_loader"]],
  ["added", "8.3", ["json_validate", "mb_str_pad", "str_increment", "str_decrement", "stream_context_set_options", "posix_sysconf", "posix_pathconf", "posix_fpathconf", "posix_eaccess", "socket_atmark", "ldap_connect_wallet", "ldap_exop_sync"]],
  ["added", "8.4", ["array_find", "array_find_key", "array_any", "array_all", "mb_trim", "mb_ltrim", "mb_rtrim", "mb_ucfirst", "mb_lcfirst", "request_parse_body", "bcceil", "bcfloor", "bcround", "bcdivmod", "fpow", "http_get_last_response_headers", "http_clear_last_response_headers", "grapheme_str_split", "intltz_get_iana_id", "pcntl_getcpu", "pg_change_password", "opcache_jit_blacklist"]],
  ["added", "8.5", ["array_first", "array_last", "get_error_handler", "get_exception_handler", "locale_is_right_to_left", "grapheme_levenshtein", "curl_multi_get_handles", "curl_share_init_persistent", "pg_close_stmt", "opcache_is_script_cached_in_file_cache"]],
  ["removed", "7.0", ["ereg", "eregi", "ereg_replace", "eregi_replace", "split", "spliti", "sql_regcase", "call_user_method", "call_user_method_array", "set_magic_quotes_runtime", "magic_quotes_runtime", "set_socket_blocking", "mcrypt_ecb", "mcrypt_cbc", "mcrypt_cfb", "mcrypt_ofb", "mcrypt_generic_end", "datefmt_set_timezone_id", "imagepsbbox", "imagepsencodefont", "imagepsextendfont", "imagepsfreefont", "imagepsloadfont"]],
  ["removed", "8.0", ["each", "create_function", "money_format", "get_magic_quotes_gpc", "get_magic_quotes_runtime", "fgetss", "gzgetss", "hebrevc", "convert_cyr_string", "ezmlm_hash", "restore_include_path", "image2wbmp", "read_exif_data", "gmp_random"]],
  ["deprecated", "8.1", ["strftime", "gmstrftime", "strptime", "date_sunrise", "date_sunset", "mhash", "mhash_keygen_s2k", "mhash_count", "mhash_get_block_size", "mhash_get_hash_name", "odbc_result_all"]],
  ["deprecated", "8.2", ["utf8_encode", "utf8_decode"]],
];

// Whole extensions removed from core (some moved to PECL).
const FUNCTION_PREFIXES: [FindingKind, string, RegExp, string][] = [
  ["removed", "7.0", /^mysql_/, "ext/mysql functions (mysql_*)"],
  ["removed", "7.0", /^mssql_/, "ext/mssql functions (mssql_*)"],
  ["removed", "7.2", /^mcrypt_/, "ext/mcrypt functions (mcrypt_*), moved to PECL"],
  ["removed", "7.4", /^ibase_/, "Interbase functions (ibase_*), moved to PECL"],
  ["removed", "7.4", /^wddx_/, "ext/wddx functions (wddx_*), moved to PECL"],
  ["removed", "7.4", /^recode(?:_|$)/, "ext/recode functions, moved to PECL"],
  ["removed", "8.4", /^imap_/, "ext/imap functions (imap_*), moved to PECL"],
  ["removed", "8.4", /^oci_/, "ext/oci8 functions (oci_*), moved to PECL"],
  ["removed", "8.4", /^pspell_/, "ext/pspell functions (pspell_*), moved to PECL"],
];

const CLASSES: [string, string[]][] = [
  ["7.0", ["IntlChar"]],
  ["7.4", ["WeakReference"]],
  ["8.0", ["WeakMap", "ValueError", "Stringable", "PhpToken", "CurlHandle", "GdImage"]],
  ["8.1", ["Fiber", "CURLStringFile", "IntlDatePatternGenerator", "ReflectionFiber"]],
  ["8.2", ["Random\\Randomizer"]],
  ["8.3", ["DateMalformedStringException", "DateInvalidTimeZoneException", "DateMalformedIntervalStringException", "DateMalformedPeriodStringException", "DateInvalidOperationException", "DateObjectError", "DateRangeError", "Random\\IntervalBoundary"]],
  ["8.4", ["BcMath\\Number", "Dom\\HTMLDocument", "Dom\\XMLDocument", "RoundingMode", "Pdo\\Mysql", "Pdo\\Pgsql", "Pdo\\Sqlite", "ReflectionConstant", "RequestParseBodyException"]],
  ["8.5", ["Uri\\Rfc3986\\Uri", "Uri\\WhatWg\\Url", "IntlListFormatter", "CurlSharePersistentHandle", "Filter\\FilterFailedException"]],
];

const ATTRIBUTES: Record<string, string> = {
  sensitiveparameter: "8.2",
  allowdynamicproperties: "8.2",
  override: "8.3",
  deprecated: "8.4",
  nodiscard: "8.5",
  delayedtargetvalidation: "8.5",
};

// [kind, version, label, pattern] applied to the sanitized code.
const PATTERNS: [FindingKind, string, string, RegExp][] = [
  // 5.6
  ["added", "5.6", "Exponentiation operator (**)", /\*\*/g],
  ["added", "5.6", "use function / use const", /\buse\s+(?:function|const)\s/g],
  // 7.0
  ["added", "7.0", "Null coalescing operator (??)", /\?\?(?!=)/g],
  ["added", "7.0", "Spaceship operator (<=>)", /<=>/g],
  ["added", "7.0", "Anonymous classes (new class)", /\bnew\s+(?:readonly\s+)?class\b/g],
  ["added", "7.0", "Group use declarations (use A\\{B, C})", /\buse\s+(?:function\s+|const\s+)?\\?[\w\\]*\\\{/g],
  ["added", "7.0", "Generator delegation (yield from)", /\byield\s+from\b/g],
  ["added", "7.0", "declare(strict_types=1)", /\bdeclare\s*\(\s*strict_types\b/gi],
  ["added", "7.0", "Constant arrays with define()", /\bdefine\s*\(\s*['"][^'"]*['"]\s*,\s*(?:\[|array\s*\()/gi],
  // 7.1
  ["added", "7.1", "Class constant visibility", /\b(?:public|protected|private)\s+(?:final\s+)?const\b/g],
  ["added", "7.1", "Multi-catch (catch (A | B $e))", /\bcatch\s*\(\s*\\?[A-Za-z_][\w\\]*\s*\|/g],
  ["added", "7.1", "Keys in list()", /\blist\s*\(\s*(?:'[^']*'|"[^"]*"|\$?\w+)\s*=>/g],
  ["added", "7.1", "Array destructuring in foreach (as [$a, $b])", /\bas\s*(?:\$\w+\s*=>\s*)?\[/g],
  ["added", "7.1", "Closure::fromCallable()", /\bClosure\s*::\s*fromCallable\b/g],
  // 7.2
  ["added", "7.2", "Trailing comma in grouped use", /\buse\s+(?:function\s+|const\s+)?\\?[\w\\]*\\\{[^}]*,\s*\}/g],
  // 7.4
  ["added", "7.4", "Null coalescing assignment (??=)", /\?\?=/g],
  ["added", "7.4", "Numeric literal separator (1_000_000)", /\b(?:0[xX][0-9a-fA-F]+(?:_[0-9a-fA-F]+)+|0[bB][01]+(?:_[01]+)+|\d+(?:_\d+)+(?:\.\d+(?:_\d+)*)?|\d+\.\d+(?:_\d+)+)\b/g],
  ["added", "7.4", "Custom object serialization (__serialize / __unserialize)", /\bfunction\s+__(?:un)?serialize\s*\(/gi],
  // 8.0
  ["added", "8.0", "Nullsafe operator (?->)", /\?->/g],
  ["added", "8.0", "throw as an expression", /(?:=>|\?\?|\?:|&&|\|\|)\s*throw\b/g],
  ["added", "8.0", "catch without a variable", new RegExp(`\\bcatch\\s*\\(\\s*${QNAME}(?:\\s*\\|\\s*${QNAME})*\\s*\\)`, "g")],
  ["added", "8.0", "$object::class", /\$[A-Za-z_]\w*(?:\??->[A-Za-z_]\w*)*\s*::\s*class\b/g],
  // 8.1
  ["added", "8.1", "Explicit octal notation (0o16)", /\b0[oO][0-7]+(?:_[0-7]+)*\b/g],
  ["added", "8.1", "First-class callable syntax (strlen(...))", /\(\s*\.\.\.\s*\)/g],
  ["added", "8.1", "Final class constants", /\bfinal\s+(?:(?:public|protected|private)\s+)?const\b|\b(?:public|protected|private)\s+final\s+const\b/g],
  // 8.3
  ["added", "8.3", "Readonly anonymous classes", /\bnew\s+readonly\s+class\b/g],
  ["added", "8.3", "Typed class constants", new RegExp(`\\bconst\\s+(?:\\??${QNAME}(?:\\s*[|&]\\s*\\??${QNAME})*|\\([^)]*\\)[^=;]*?)\\s+${IDENT}\\s*=`, "g")],
  // 8.4
  ["added", "8.4", "Lazy objects (newLazyGhost / newLazyProxy)", /->\s*newLazy(?:Ghost|Proxy)\s*\(/g],
  // 8.5
  ["added", "8.5", "Pipe operator (|>)", /\|>/g],
  ["added", "8.5", "(void) cast", /\(\s*void\s*\)/gi],
  ["added", "8.5", "Casts in constant expressions", /\bconst\s+(?:[?\\\w|&]+\s+)?[A-Za-z_]\w*\s*=\s*\(\s*(?:int|integer|bool|boolean|float|double|string|binary|array|object)\s*\)/gi],
  ["added", "8.5", "Closures in constant expressions", /\bconst\s+(?:[?\\\w|&]+\s+)?[A-Za-z_]\w*\s*=\s*(?:static\s+)?function\b/gi],
  // Removed
  ["removed", "8.0", "(real) cast", /\(\s*real\s*\)/gi],
  ["removed", "8.0", "(unset) cast", /\(\s*unset\s*\)/gi],
  ["removed", "8.0", "$php_errormsg (track_errors)", /\$php_errormsg\b/g],
  ["removed", "8.0", "__autoload() function", /\bfunction\s+__autoload\s*\(/gi],
  // Deprecated
  ["deprecated", "8.1", "FILTER_SANITIZE_STRING / FILTER_SANITIZE_STRIPPED", /\bFILTER_SANITIZE_(?:STRING|STRIPPED)\b/g],
  ["deprecated", "8.4", "E_STRICT constant", /(?:^|[^\w$>:\\])E_STRICT\b/g],
  ["deprecated", "8.5", "Non-canonical casts ((boolean), (integer), (double), (binary))", /\(\s*(?:boolean|integer|double|binary)\s*\)/gi],
];

// ---------------------------------------------------------------------------
// Sanitizer: blanks comments, string contents and inline HTML while keeping
// offsets and line numbers intact. String-level features are reported here.
// ---------------------------------------------------------------------------

interface StringHit {
  kind: FindingKind;
  version: string;
  label: string;
  index: number;
}

function sanitize(src: string): { code: string; hits: StringHit[] } {
  const out = src.split("");
  const n = src.length;
  const hits: StringHit[] = [];
  const blank = (from: number, to: number) => {
    for (let k = from; k < to && k < n; k++) if (out[k] !== "\n") out[k] = " ";
  };
  const openTag = /<\?(?:php\b|=)/gi;
  // Snippets without an opening tag are treated as plain PHP code.
  let inPhp = !/<\?(?:php\b|=)/i.test(src);
  let i = 0;

  // Scans an interpolated string body; returns the index of the closing quote.
  const scanInterpolated = (start: number, quote: string): number => {
    let j = start;
    while (j < n) {
      const c = src[j];
      if (c === "\\") {
        if (quote !== "`" && src[j + 1] === "u" && src[j + 2] === "{") {
          hits.push({ kind: "added", version: "7.0", label: "Unicode codepoint escape (\\u{...})", index: j });
        }
        j += 2;
        continue;
      }
      if (c === quote) return j;
      if ((c === "{" && src[j + 1] === "$") || (c === "$" && src[j + 1] === "{")) {
        if (c === "$") {
          hits.push({ kind: "deprecated", version: "8.2", label: '"${var}" string interpolation', index: j });
        }
        // Skip the embedded expression, which may itself contain quotes.
        let depth = 0;
        while (j < n) {
          const d = src[j];
          if (d === "{") depth++;
          else if (d === "}") {
            depth--;
            if (depth === 0) break;
          } else if (d === "'" || d === '"') {
            j++;
            while (j < n && src[j] !== d) j += src[j] === "\\" ? 2 : 1;
          }
          j++;
        }
      }
      j++;
    }
    return n;
  };

  while (i < n) {
    if (!inPhp) {
      openTag.lastIndex = i;
      const m = openTag.exec(src);
      if (!m) {
        blank(i, n);
        break;
      }
      blank(i, m.index + m[0].length);
      i = m.index + m[0].length;
      inPhp = true;
      continue;
    }

    const c = src[i];
    const c2 = src[i + 1];

    if (c === "?" && c2 === ">") {
      blank(i, i + 2);
      i += 2;
      inPhp = false;
      continue;
    }

    // Line comments (# but not #[ attributes) end at a newline or ?>
    if ((c === "#" && c2 !== "[") || (c === "/" && c2 === "/")) {
      let j = i;
      while (j < n && src[j] !== "\n" && !(src[j] === "?" && src[j + 1] === ">")) j++;
      blank(i, j);
      i = j;
      continue;
    }

    if (c === "/" && c2 === "*") {
      const end = src.indexOf("*/", i + 2);
      const j = end < 0 ? n : end + 2;
      blank(i, j);
      i = j;
      continue;
    }

    if (c === "'") {
      let j = i + 1;
      while (j < n && src[j] !== "'") j += src[j] === "\\" ? 2 : 1;
      blank(i + 1, j);
      i = j + 1;
      continue;
    }

    if (c === '"' || c === "`") {
      if (c === "`") {
        hits.push({ kind: "deprecated", version: "8.5", label: "Backtick operator (shell execution)", index: i });
      }
      const j = scanInterpolated(i + 1, c);
      blank(i + 1, j);
      i = j + 1;
      continue;
    }

    if (c === "<" && src.startsWith("<<<", i)) {
      const head = new RegExp(`^<<<[ \\t]*(["']?)(${IDENT})\\1[ \\t]*\\n`).exec(src.slice(i, i + 256));
      if (head) {
        const label = head[2];
        const isNowdoc = head[1] === "'";
        const bodyStart = i + head[0].length;
        const closeRe = new RegExp(`^([ \\t]*)${label}(?![\\w\\x80-\\uffff])`);
        let p = bodyStart;
        let closeStart = n;
        let closeEnd = n;
        while (p < n) {
          const lineEnd = src.indexOf("\n", p);
          const line = src.slice(p, lineEnd < 0 ? n : lineEnd);
          const m = closeRe.exec(line);
          if (m) {
            closeStart = p + m[1].length;
            closeEnd = closeStart + label.length;
            const next = src[closeEnd];
            if (m[1].length > 0 || (next !== undefined && next !== ";" && next !== "\n")) {
              hits.push({ kind: "added", version: "7.3", label: "Flexible heredoc/nowdoc syntax (indented closing marker)", index: closeStart });
            }
            break;
          }
          if (lineEnd < 0) break;
          p = lineEnd + 1;
        }
        if (!isNowdoc) {
          const body = src.slice(bodyStart, closeStart);
          const u = body.indexOf("\\u{");
          if (u >= 0) hits.push({ kind: "added", version: "7.0", label: "Unicode codepoint escape (\\u{...})", index: bodyStart + u });
          const d = body.search(/(^|[^\\])\$\{/);
          if (d >= 0) hits.push({ kind: "deprecated", version: "8.2", label: '"${var}" string interpolation', index: bodyStart + d });
        }
        blank(i, closeEnd);
        // Keep an empty string literal in place so expressions stay well-formed.
        out[i] = '"';
        out[i + 1] = '"';
        i = closeEnd;
        continue;
      }
    }

    i++;
  }

  return { code: out.join(""), hits };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function matchClose(code: string, open: number): number {
  let depth = 0;
  for (let i = open; i < code.length; i++) {
    const c = code[i];
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function matchOpen(code: string, close: number): number {
  let depth = 0;
  for (let i = close; i >= 0; i--) {
    const c = code[i];
    if (c === ")" || c === "]" || c === "}") depth++;
    else if (c === "(" || c === "[" || c === "{") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") depth--;
    else if (c === "," && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts;
}

// Text right before `index`, used to tell calls apart from methods and declarations.
function before(code: string, index: number): string {
  return code.slice(Math.max(0, index - 40), index);
}

function isMemberAccess(prefix: string): boolean {
  return /(?:->|::|\$)\s*$/.test(prefix);
}

function isNamespaced(prefix: string): boolean {
  return /[\w\x80-￿]\\$/.test(prefix);
}

function stripAttributes(text: string): string {
  let t = text.trimStart();
  while (t.startsWith("#[")) {
    const close = matchClose(t, 1);
    if (close < 0) break;
    t = t.slice(close + 1).trimStart();
  }
  return t;
}

function analyzeType(rawType: string, ctx: "param" | "return" | "property"): Hit[] {
  const type = rawType.replace(/\s+/g, "");
  if (!type) return [];
  const hits: Hit[] = [];
  if (type.includes("(")) {
    hits.push(["type-dnf", "8.2", "DNF types ((A&B)|null)"]);
  } else {
    if (type.includes("|")) hits.push(["type-union", "8.0", "Union types (int|string)"]);
    if (type.includes("&")) hits.push(["type-intersection", "8.1", "Intersection types (A&B)"]);
  }
  if (type.startsWith("?")) hits.push(["type-nullable", "7.1", "Nullable types (?int)"]);
  const parts = type
    .replace(/[()?]/g, "")
    .split(/[|&]/)
    .map((p) => p.replace(/^\\/, "").toLowerCase());
  for (const p of parts) {
    if (p === "int" || p === "float" || p === "string" || p === "bool") {
      if (ctx === "param") hits.push(["type-scalar", "7.0", "Scalar type declarations (int, float, string, bool)"]);
    } else if (p === "iterable") hits.push(["type-iterable", "7.1", "iterable type"]);
    else if (p === "void") hits.push(["type-void", "7.1", "void return type"]);
    else if (p === "object") hits.push(["type-object", "7.2", "object type"]);
    else if (p === "mixed") hits.push(["type-mixed", "8.0", "mixed type"]);
    else if (p === "static" && ctx === "return") hits.push(["type-static", "8.0", "static return type"]);
    else if (p === "never") hits.push(["type-never", "8.1", "Never return type"]);
    else if (p === "true") hits.push(["type-true", "8.2", "true type"]);
    else if ((p === "null" || p === "false") && parts.length === 1) {
      hits.push(["type-standalone", "8.2", "null and false as standalone types"]);
    }
  }
  return hits;
}

function isNullableType(type: string): boolean {
  const t = type.replace(/\s+/g, "").toLowerCase();
  return t.startsWith("?") || t === "mixed" || /(?:^|[|(])\\?null(?:$|[|)])/.test(t);
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

export function analyzePhpCode(input: string): CompatResult {
  const src = input.replace(/\r\n?/g, "\n");
  const { code, hits: stringHits } = sanitize(src);

  const lineStarts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === "\n") lineStarts.push(i + 1);
  const lineOf = (index: number) => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= index) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };

  const found = new Map<string, Finding>();
  const add = (
    kind: FindingKind,
    version: string,
    label: string,
    index: number,
    id = `${kind}:${label}`,
    category: FindingCategory = "syntax"
  ) => {
    const existing = found.get(id);
    if (existing) {
      existing.count++;
      return;
    }
    found.set(id, { id, kind, category, version, label, line: lineOf(index), count: 1 });
  };

  for (const h of stringHits) add(h.kind, h.version, h.label, h.index);

  for (const [kind, version, label, pattern] of PATTERNS) {
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(code))) {
      add(kind, version, label, m.index);
      if (m[0].length === 0) pattern.lastIndex++;
    }
  }

  // Declared names, so polyfills and user classes are not reported.
  const declaredFunctions = new Set<string>();
  const declaredClasses = new Set<string>();
  for (const m of code.matchAll(new RegExp(`\\bfunction\\s+&?\\s*(${IDENT})\\s*\\(`, "g"))) {
    declaredFunctions.add(m[1].toLowerCase());
  }
  for (const m of code.matchAll(new RegExp(`\\b(?:class|interface|trait|enum)\\s+(${IDENT})`, "g"))) {
    declaredClasses.add(m[1].toLowerCase());
  }

  // Function calls
  const functionRules = new Map<string, [FindingKind, string]>();
  for (const [kind, version, names] of FUNCTIONS) {
    for (const name of names) functionRules.set(name, [kind, version]);
  }
  for (const m of code.matchAll(/\b([A-Za-z_]\w*)\s*\(/g)) {
    const name = m[1].toLowerCase();
    const index = m.index ?? 0;
    const prefix = before(code, index);
    if (isMemberAccess(prefix) || isNamespaced(prefix) || /\b(?:function|new|fn)\s+&?\s*$/.test(prefix)) continue;
    if (declaredFunctions.has(name)) continue;
    const rule = functionRules.get(name);
    if (rule) {
      add(rule[0], rule[1], `${name}()`, index, undefined, "api");
      continue;
    }
    for (const [kind, version, re, label] of FUNCTION_PREFIXES) {
      if (re.test(name)) {
        add(kind, version, label, index, undefined, "api");
        break;
      }
    }
  }

  // Built-in classes
  for (const [version, names] of CLASSES) {
    const alternation = names.map((n) => n.replace(/\\/g, "\\\\")).join("|");
    const re = new RegExp(`\\\\?\\b(${alternation})(?![\\w\\\\])`, "g");
    for (const m of code.matchAll(re)) {
      const index = m.index ?? 0;
      const prefix = before(code, index);
      if (isMemberAccess(prefix) || isNamespaced(m[0].startsWith("\\") ? prefix + "\\" : prefix)) continue;
      if (/\b(?:class|interface|trait|enum|function|const)\s+$/.test(prefix)) continue;
      const shortName = m[1].split("\\").pop()!.toLowerCase();
      if (declaredClasses.has(shortName)) continue;
      add("added", version, m[1], index, undefined, "api");
    }
  }

  // Attributes
  for (const m of code.matchAll(/#\[/g)) {
    const open = (m.index ?? 0) + 1;
    const close = matchClose(code, open);
    if (close < 0) continue;
    add("added", "8.0", "Attributes (#[...])", open - 1, undefined, "attribute");
    for (const item of splitTopLevel(code.slice(open + 1, close))) {
      const nameMatch = /^\s*(\\?[A-Za-z_][\w\\]*)/.exec(item);
      if (!nameMatch) continue;
      const fullName = nameMatch[1];
      const hasLeadingSlash = fullName.startsWith("\\");
      const bare = fullName.replace(/^\\/, "");
      if (bare.includes("\\")) continue;
      const version = ATTRIBUTES[bare.toLowerCase()];
      if (!version) continue;
      // A namespaced import such as `use JetBrains\PhpStorm\Deprecated;` means it's not the core attribute.
      if (!hasLeadingSlash && new RegExp(`\\buse\\s+[\\w\\\\]+\\\\${bare}\\s*[;,]`, "i").test(code)) continue;
      add("added", version, `#[\\${bare}] attribute`, open - 1, undefined, "attribute");
      if (bare.toLowerCase() === "override") {
        const rest = code.slice(close + 1, close + 300).replace(/^\s*(?:#\[[^\]]*\]\s*)*/, "");
        if (/^(?:(?:public|protected|private|readonly|static|final|var|abstract)(?:\s*\(\s*set\s*\))?\s+)*(?:[?\w\\|&()]+\s+)?\$/.test(rest)) {
          add("added", "8.5", "#[\\Override] on properties", open - 1);
        }
      }
    }
  }

  // Class-like bodies: used for trait constants and attributes on global constants.
  const classBodies: [start: number, end: number, isTrait: boolean][] = [];
  for (const m of code.matchAll(new RegExp(`\\b(class|interface|trait|enum)\\s+${IDENT}[^{;]*\\{|\\bnew\\s+(?:readonly\\s+)?class\\b[^{;]*\\{`, "g"))) {
    const open = (m.index ?? 0) + m[0].length - 1;
    const close = matchClose(code, open);
    if (close > 0) classBodies.push([open, close, m[1] === "trait"]);
  }
  for (const [start, end, isTrait] of classBodies) {
    if (!isTrait) continue;
    const c = /\bconst\s/.exec(code.slice(start, end));
    if (c) add("added", "8.2", "Constants in traits", start + c.index);
  }
  for (const m of code.matchAll(/\]\s*const\s/g)) {
    const index = m.index ?? 0;
    const open = matchOpen(code, index);
    if (open < 1 || code[open - 1] !== "#") continue;
    if (!classBodies.some(([s, e]) => index > s && index < e)) {
      add("added", "8.5", "Attributes on global constants", index);
    }
  }

  // Function and closure signatures
  const signatureParens = new Set<number>();
  for (const m of code.matchAll(/\b(function|fn)\b/g)) {
    const index = m.index ?? 0;
    if (isMemberAccess(before(code, index))) continue;
    const afterKeyword = index + m[0].length;
    const head = new RegExp(`^\\s*&?\\s*(${IDENT})?\\s*\\(`).exec(code.slice(afterKeyword, afterKeyword + 200));
    if (!head) continue;
    const isArrow = m[1] === "fn";
    if (isArrow && head[1]) continue;
    const open = afterKeyword + head[0].length - 1;
    const close = matchClose(code, open);
    if (close < 0) continue;
    signatureParens.add(open);
    const name = (head[1] ?? "").toLowerCase();
    const params = code.slice(open + 1, close);

    if (isArrow) add("added", "7.4", "Arrow functions (fn() =>)", index);
    if (/,\s*$/.test(params)) add("added", "8.0", "Trailing comma in parameter lists", close);

    for (const rawParam of splitTopLevel(params)) {
      const param = stripAttributes(rawParam);
      if (!param.trim()) continue;
      const pm = new RegExp(
        `^((?:(?:public|protected|private)(?:\\s*\\(\\s*set\\s*\\))?\\s+|readonly\\s+|final\\s+)*)([^$]*?)\\s*(&\\s*)?(\\.\\.\\.\\s*)?\\$${IDENT}\\s*(?:=\\s*([\\s\\S]*))?$`
      ).exec(param);
      if (!pm) continue;
      const [, modifiers, type, , variadic, defaultValue] = pm;
      if (modifiers.trim()) {
        if (name === "__construct") add("added", "8.0", "Constructor property promotion", open);
        if (/\bfinal\b/.test(modifiers)) add("added", "8.5", "Final promoted properties", open);
      }
      for (const [id, version, label] of analyzeType(type, "param")) add("added", version, label, open, id);
      if (variadic) add("added", "5.6", "Variadic functions and argument unpacking (...)", open);
      const def = (defaultValue ?? "").trim();
      if (def) {
        if (/^null$/i.test(def) && type.trim() && !isNullableType(type)) {
          add("deprecated", "8.4", "Implicitly nullable parameter (Type $x = null)", open);
        }
        if (/\bnew\s/.test(def)) add("added", "8.1", "new in initializers", open);
        if (/^(?:static\s+)?function\b/.test(def) || /\(\s*\.\.\.\s*\)$/.test(def)) {
          add("added", "8.5", "Closures in constant expressions", open);
        }
      }
    }

    let j = close + 1;
    const use = /^\s*use\s*\(/.exec(code.slice(j, j + 60));
    if (use) {
      const useOpen = j + use[0].length - 1;
      const useClose = matchClose(code, useOpen);
      if (useClose > 0) {
        signatureParens.add(useOpen);
        if (/,\s*$/.test(code.slice(useOpen + 1, useClose))) add("added", "8.0", "Trailing comma in closure use lists", useClose);
        j = useClose + 1;
      }
    }
    const rt = /^\s*:\s*([?\\\w|&()\s]+?)\s*(?=\{|;|=>|$)/.exec(code.slice(j, j + 200));
    if (rt && rt[1].trim()) {
      add("added", "7.0", "Return type declarations", j);
      for (const [id, version, label] of analyzeType(rt[1], "return")) add("added", version, label, j, id);
    }
  }

  // Typed properties
  const typedProperty = new RegExp(
    `\\b(?:public|protected|private|var)(?:\\s*\\(\\s*set\\s*\\))?\\s+((?:(?:static|readonly|final|abstract|(?:public|protected|private)(?:\\s*\\(\\s*set\\s*\\))?)\\s+)*)(?!(?:function|const|static|readonly|abstract|final|class|fn|enum|interface|trait)\\b)(\\??${QNAME}(?:\\s*[|&]\\s*\\??${QNAME})*|\\([^$;{]*?)\\s+\\$${IDENT}`,
    "g"
  );
  for (const m of code.matchAll(typedProperty)) {
    const index = m.index ?? 0;
    add("added", "7.4", "Typed properties", index);
    for (const [id, version, label] of analyzeType(m[2], "property")) add("added", version, label, index, id);
  }

  // Readonly classes and properties (new readonly class is matched by PATTERNS)
  for (const m of code.matchAll(/\breadonly\b(?!\s*\()(\s+(?:(?:final|abstract)\s+)*class\b)?/g)) {
    const index = m.index ?? 0;
    const prefix = before(code, index);
    if (isMemberAccess(prefix) || /\bfunction\s+&?\s*$/.test(prefix)) continue;
    if (!m[1]) add("added", "8.1", "Readonly properties", index);
    else if (!/\bnew\s+$/.test(prefix)) add("added", "8.2", "Readonly classes", index);
  }

  // Enumerations
  for (const m of code.matchAll(new RegExp(`\\benum\\s+${IDENT}\\s*(?::\\s*\\w+\\s*)?(?:implements\\s+[\\w\\\\,\\s]+)?\\{`, "g"))) {
    const index = m.index ?? 0;
    if (isMemberAccess(before(code, index))) continue;
    add("added", "8.1", "Enumerations (enum)", index);
  }

  // Property hooks and asymmetric visibility
  for (const m of code.matchAll(/\b(?:public|protected|private|var|readonly)\b(?:[^;{}()=]|\(\s*set\s*\))*?\$[A-Za-z_]\w*\s*(?:=[^;{]*)?\{\s*(?:#\[[^\]]*\]\s*)*(?:(?:final|public|protected|private)\s+)*&?\s*(?:get|set)\b/g)) {
    add("added", "8.4", "Property hooks", m.index ?? 0);
  }
  for (const m of code.matchAll(/\b(?:public|protected|private)\s*\(\s*set\s*\)/g)) {
    const index = m.index ?? 0;
    add("added", "8.4", "Asymmetric property visibility (private(set))", index);
    const declStart = Math.max(code.lastIndexOf(";", index), code.lastIndexOf("{", index), code.lastIndexOf("}", index), code.lastIndexOf("(", index), code.lastIndexOf(",", index));
    const declEnd = code.indexOf("$", index);
    if (declEnd > 0 && /\bstatic\b/.test(code.slice(declStart + 1, declEnd))) {
      add("added", "8.5", "Asymmetric visibility on static properties", index);
    }
  }

  // new Foo()->method() without wrapping parentheses
  for (const m of code.matchAll(/\bnew\s+(?!class\b)\\?[A-Za-z_][\w\\]*\s*\(/g)) {
    const open = (m.index ?? 0) + m[0].length - 1;
    const close = matchClose(code, open);
    if (close > 0 && /^\s*(?:->|\?->|::|\[)/.test(code.slice(close + 1, close + 10))) {
      add("added", "8.4", "new expressions without parentheses (new Foo()->bar())", m.index ?? 0);
    }
  }

  // match expression
  for (const m of code.matchAll(/\bmatch\s*\(/g)) {
    const index = m.index ?? 0;
    const prefix = before(code, index);
    if (isMemberAccess(prefix) || isNamespaced(prefix) || /\bfunction\s+&?\s*$/.test(prefix)) continue;
    const close = matchClose(code, index + m[0].length - 1);
    if (close > 0 && /^\s*\{/.test(code.slice(close + 1, close + 10))) add("added", "8.0", "match expression", index);
  }

  // Named arguments: foo(name: value)
  for (const m of code.matchAll(/[(,]\s*([A-Za-z_]\w*)\s*:(?!:)/g)) {
    add("added", "8.0", "Named arguments", (m.index ?? 0) + 1);
  }

  // Dynamic class constant fetch: Foo::{$name} (Foo::{$name}() method calls are older)
  for (const m of code.matchAll(/::\s*\{/g)) {
    const open = (m.index ?? 0) + m[0].length - 1;
    const close = matchClose(code, open);
    if (close > 0 && !/^\s*\(/.test(code.slice(close + 1, close + 10))) {
      add("added", "8.3", "Dynamic class constant fetch (Foo::{$name})", m.index ?? 0);
    }
  }

  // clone() as a function with property overrides
  for (const m of code.matchAll(/\bclone\s*\(/g)) {
    const open = (m.index ?? 0) + m[0].length - 1;
    const close = matchClose(code, open);
    if (close < 0) continue;
    const args = code.slice(open + 1, close);
    if (splitTopLevel(args).length > 1 || args.trim() === "...") add("added", "8.5", "clone() with properties / as a callable", m.index ?? 0);
  }

  // Trailing commas in calls (declarations, array() and list() excluded)
  for (const m of code.matchAll(/,\s*\)/g)) {
    const close = (m.index ?? 0) + m[0].length - 1;
    const open = matchOpen(code, close);
    if (open < 0 || signatureParens.has(open)) continue;
    const prefix = before(code, open);
    if (/\b(?:array|list)\s*$/i.test(prefix)) continue;
    if (/(?:[\w\])}]|\$\w+)\s*$/.test(prefix)) add("added", "7.3", "Trailing comma in function calls", m.index ?? 0);
  }

  // Bracket walk: spread inside arrays (7.4) vs. argument unpacking (5.6),
  // and [$a, $b] = ... destructuring at statement start (7.1).
  const stack: { isArray: boolean; open: number }[] = [];
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    if (c === "(") {
      stack.push({ isArray: /\barray\s*$/i.test(before(code, i)), open: i });
    } else if (c === "[") {
      stack.push({ isArray: true, open: i });
      let k = i - 1;
      while (k >= 0 && /\s/.test(code[k])) k--;
      if (k < 0 || code[k] === ";" || code[k] === "{" || code[k] === "}") {
        const close = matchClose(code, i);
        if (close > 0 && /^\s*=(?![=>])/.test(code.slice(close + 1, close + 10))) {
          add("added", "7.1", "Symmetric array destructuring ([$a, $b] = ...)", i);
        }
      }
    } else if (c === "{") {
      stack.push({ isArray: false, open: i });
    } else if (c === ")" || c === "]" || c === "}") {
      stack.pop();
    } else if (c === "." && code.startsWith("...", i)) {
      const next = code.slice(i + 3).trimStart()[0];
      const top = stack[stack.length - 1];
      if (next !== ")" && top) {
        if (top.isArray) add("added", "7.4", "Spread operator in arrays ([...$a])", i);
        else if (!signatureParens.has(top.open)) add("added", "5.6", "Variadic functions and argument unpacking (...)", i);
      }
      i += 2;
    }
  }

  // Curly brace offsets: $str{0}
  for (const m of code.matchAll(/\$[A-Za-z_]\w*(?:(?:->|::)\$?[A-Za-z_]\w*|\[[^\]\n]*\])*\{/g)) {
    const index = m.index ?? 0;
    const lineStart = code.lastIndexOf("\n", index) + 1;
    if (/\b(?:public|protected|private|var|readonly|static|global)\b/.test(code.slice(lineStart, index))) continue;
    add("removed", "8.0", "Curly brace offset access ($str{0})", index);
  }

  const findings = [...found.values()];
  const byVersionDesc = (a: Finding, b: Finding) => compareBranches(b.version, a.version) || a.line - b.line;
  const byVersionAsc = (a: Finding, b: Finding) => compareBranches(a.version, b.version) || a.line - b.line;
  const added = findings.filter((f) => f.kind === "added").sort(byVersionDesc);
  const required = added.filter((f) => f.category !== "attribute");
  const removed = findings.filter((f) => f.kind === "removed").sort(byVersionAsc);
  const deprecated = findings.filter((f) => f.kind === "deprecated").sort(byVersionAsc);

  return {
    findings: [...added, ...removed, ...deprecated],
    minFinding: required[0] ?? null,
    syntaxFinding: required.find((f) => f.category === "syntax") ?? null,
    breaksFinding: removed[0] ?? null,
    deprecatedFinding: deprecated[0] ?? null,
  };
}

export type BranchCompat = "ok" | "deprecated" | "incompatible";

export function branchCompat(result: CompatResult, branch: string): BranchCompat {
  if (result.minFinding && compareBranches(branch, result.minFinding.version) < 0) return "incompatible";
  if (result.breaksFinding && compareBranches(branch, result.breaksFinding.version) >= 0) return "incompatible";
  if (result.findings.some((f) => f.kind === "deprecated" && compareBranches(branch, f.version) >= 0)) return "deprecated";
  return "ok";
}
