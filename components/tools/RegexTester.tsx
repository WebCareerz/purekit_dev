"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CopyButton from "./CopyButton";

interface RegexTesterProps {
  t: Record<string, unknown>;
}

interface MatchDetail {
  fullMatch: string;
  index: number;
  groups: string[];
}

const FLAGS = ["g", "i", "m", "s", "u"] as const;
type Flag = (typeof FLAGS)[number];

export default function RegexTester({ t }: RegexTesterProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "regex-tester"
  ];

  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState<Set<Flag>>(new Set(["g"]));
  const [testString, setTestString] = useState("");
  const [replacement, setReplacement] = useState("");

  const toggleFlag = useCallback((flag: Flag) => {
    setFlags((prev) => {
      const next = new Set(prev);
      if (next.has(flag)) {
        next.delete(flag);
      } else {
        next.add(flag);
      }
      return next;
    });
  }, []);

  const flagsString = useMemo(() => {
    return FLAGS.filter((f) => flags.has(f)).join("");
  }, [flags]);

  const { regex, error } = useMemo(() => {
    if (!pattern) return { regex: null, error: "" };
    try {
      const r = new RegExp(pattern, flagsString);
      return { regex: r, error: "" };
    } catch (e) {
      return {
        regex: null,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }, [pattern, flagsString]);

  const matches: MatchDetail[] = useMemo(() => {
    if (!regex || !testString) return [];
    const results: MatchDetail[] = [];
    if (flagsString.includes("g")) {
      let match: RegExpExecArray | null;
      const r = new RegExp(regex.source, regex.flags);
      while ((match = r.exec(testString)) !== null) {
        results.push({
          fullMatch: match[0],
          index: match.index,
          groups: match.slice(1),
        });
        // Prevent infinite loop on zero-length matches
        if (match[0].length === 0) {
          r.lastIndex++;
        }
      }
    } else {
      const match = regex.exec(testString);
      if (match) {
        results.push({
          fullMatch: match[0],
          index: match.index,
          groups: match.slice(1),
        });
      }
    }
    return results;
  }, [regex, testString, flagsString]);

  const highlightedSegments = useMemo(() => {
    if (!regex || !testString || matches.length === 0) return null;

    // Build sorted, non-overlapping intervals from matches
    const intervals = matches
      .map((m) => ({ start: m.index, end: m.index + m.fullMatch.length }))
      .filter((iv) => iv.end > iv.start);

    if (intervals.length === 0) return null;

    const segments: { text: string; highlighted: boolean }[] = [];
    let cursor = 0;

    for (const iv of intervals) {
      if (iv.start > cursor) {
        segments.push({
          text: testString.slice(cursor, iv.start),
          highlighted: false,
        });
      }
      segments.push({
        text: testString.slice(iv.start, iv.end),
        highlighted: true,
      });
      cursor = iv.end;
    }

    if (cursor < testString.length) {
      segments.push({
        text: testString.slice(cursor),
        highlighted: false,
      });
    }

    return segments;
  }, [regex, testString, matches]);

  const replacementResult = useMemo(() => {
    if (!regex || !testString || !replacement) return "";
    try {
      return testString.replace(
        new RegExp(regex.source, regex.flags),
        replacement
      );
    } catch {
      return "";
    }
  }, [regex, testString, replacement]);

  return (
    <div className="space-y-4">
      {/* Pattern input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{toolT.pattern}</label>
        <div className="flex items-center gap-2 border border-input rounded-md bg-transparent px-3 py-2 shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/30">
          <span className="text-muted-foreground font-mono text-sm select-none">
            /
          </span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder={toolT.patternPlaceholder}
            className="flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground min-w-0"
            spellCheck={false}
          />
          <span className="text-muted-foreground font-mono text-sm select-none">
            /{flagsString}
          </span>
        </div>
      </div>

      {/* Flags */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{toolT.flags}</label>
        <div className="flex flex-wrap items-center gap-2">
          {FLAGS.map((flag) => (
            <Button
              key={flag}
              variant={flags.has(flag) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFlag(flag)}
              className="font-mono min-w-[2.5rem]"
            >
              {flag}
            </Button>
          ))}
          <span className="text-xs text-muted-foreground ml-2">
            {FLAGS.filter((f) => flags.has(f))
              .map((f) => toolT[`flag_${f}`])
              .join(", ") || toolT.noFlags}
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm px-3 py-1.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
          {common.error}: {error}
        </div>
      )}

      {/* Test string */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{toolT.testString}</label>
        <Textarea
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder={toolT.testStringPlaceholder}
          className="font-mono text-sm min-h-[200px] sm:min-h-[300px] resize-y"
          spellCheck={false}
        />
      </div>

      {/* Highlighted matches */}
      {highlightedSegments && (
        <div className="space-y-2">
          <label className="text-sm font-medium">{toolT.matchResult}</label>
          <div className="border border-border rounded-lg p-3 font-mono text-sm whitespace-pre-wrap break-all bg-muted/30 min-h-[60px] overflow-x-auto">
            {highlightedSegments.map((seg, i) =>
              seg.highlighted ? (
                <mark
                  key={i}
                  className="bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100 rounded-sm px-0.5"
                >
                  {seg.text}
                </mark>
              ) : (
                <span key={i}>{seg.text}</span>
              )
            )}
          </div>
        </div>
      )}

      {/* Match details */}
      {matches.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {toolT.matchDetails} ({matches.length}{" "}
            {matches.length === 1 ? toolT.match : toolT.matches})
          </label>
          <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
            {matches.map((m, i) => (
              <div key={i} className="px-3 py-2 text-sm space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-muted-foreground font-mono text-xs shrink-0">
                    #{i + 1}
                  </span>
                  <span className="font-mono font-medium break-all">
                    {m.fullMatch}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {toolT.index}: {m.index}
                  </span>
                </div>
                {m.groups.length > 0 && (
                  <div className="pl-6 space-y-0.5">
                    {m.groups.map((group, gi) => (
                      <div
                        key={gi}
                        className="text-xs text-muted-foreground font-mono"
                      >
                        {toolT.group} {gi + 1}:{" "}
                        <span className="text-foreground">
                          {group ?? toolT.undefined}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No matches message */}
      {pattern && testString && !error && matches.length === 0 && (
        <div className="text-sm px-3 py-1.5 rounded-md bg-muted text-muted-foreground">
          {toolT.noMatches}
        </div>
      )}

      {/* Replacement */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{toolT.replacement}</label>
        <div className="flex items-center gap-2 border border-input rounded-md bg-transparent px-3 py-2 shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/30">
          <input
            type="text"
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            placeholder={toolT.replacementPlaceholder}
            className="flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground min-w-0"
            spellCheck={false}
          />
        </div>
      </div>

      {replacement && replacementResult && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              {toolT.replacementResult}
            </label>
            <CopyButton
              text={replacementResult}
              copyLabel={common.copy}
              copiedLabel={common.copied}
            />
          </div>
          <div className="border border-border rounded-lg p-3 font-mono text-sm whitespace-pre-wrap break-all bg-muted/30 min-h-[60px] overflow-x-auto">
            {replacementResult}
          </div>
        </div>
      )}
    </div>
  );
}
