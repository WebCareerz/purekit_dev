"use client";

import { useState, useEffect, useCallback } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import CopyButton from "./CopyButton";

interface UnixTimestampConverterProps {
  t: Record<string, unknown>;
}

function getRelativeTime(date: Date, now: Date): string {
  const diffMs = date.getTime() - now.getTime();
  const absDiffMs = Math.abs(diffMs);
  const isPast = diffMs < 0;

  const seconds = Math.floor(absDiffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  let value: string;
  if (seconds < 60) {
    value = `${seconds} second${seconds !== 1 ? "s" : ""}`;
  } else if (minutes < 60) {
    value = `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  } else if (hours < 24) {
    value = `${hours} hour${hours !== 1 ? "s" : ""}`;
  } else if (days < 30) {
    value = `${days} day${days !== 1 ? "s" : ""}`;
  } else if (months < 12) {
    value = `${months} month${months !== 1 ? "s" : ""}`;
  } else {
    value = `${years} year${years !== 1 ? "s" : ""}`;
  }

  return isPast ? `${value} ago` : `in ${value}`;
}

export default function UnixTimestampConverter({
  t,
}: UnixTimestampConverterProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "unix-timestamp-converter"
  ];

  // Section 1: Current timestamp
  const [currentTimestamp, setCurrentTimestamp] = useState(() =>
    Math.floor(Date.now() / 1000)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimestamp(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Section 2: Timestamp to Date
  const [tsInput, setTsInput] = useState("");
  const [tsUnit, setTsUnit] = useState<"seconds" | "milliseconds">("seconds");
  const [tsResult, setTsResult] = useState<{
    local: string;
    utc: string;
    iso: string;
    relative: string;
  } | null>(null);
  const [tsError, setTsError] = useState("");

  const convertTimestamp = useCallback(
    (input: string, unit: "seconds" | "milliseconds") => {
      if (!input.trim()) {
        setTsResult(null);
        setTsError("");
        return;
      }

      const num = Number(input.trim());
      if (isNaN(num) || !isFinite(num)) {
        setTsResult(null);
        setTsError(toolT.invalidTimestamp);
        return;
      }

      const ms = unit === "seconds" ? num * 1000 : num;
      const date = new Date(ms);

      if (isNaN(date.getTime())) {
        setTsResult(null);
        setTsError(toolT.invalidTimestamp);
        return;
      }

      setTsError("");
      setTsResult({
        local: date.toLocaleString(),
        utc: date.toUTCString(),
        iso: date.toISOString(),
        relative: getRelativeTime(date, new Date()),
      });
    },
    [toolT.invalidTimestamp]
  );

  useEffect(() => {
    convertTimestamp(tsInput, tsUnit);
  }, [tsInput, tsUnit, convertTimestamp]);

  // Section 3: Date to Timestamp
  const [dateInput, setDateInput] = useState("");
  const [dateResult, setDateResult] = useState<{
    seconds: string;
    milliseconds: string;
  } | null>(null);
  const [dateError, setDateError] = useState("");

  const convertDate = useCallback(
    (input: string) => {
      if (!input) {
        setDateResult(null);
        setDateError("");
        return;
      }

      const date = new Date(input);
      if (isNaN(date.getTime())) {
        setDateResult(null);
        setDateError(toolT.invalidDate);
        return;
      }

      setDateError("");
      setDateResult({
        seconds: String(Math.floor(date.getTime() / 1000)),
        milliseconds: String(date.getTime()),
      });
    },
    [toolT.invalidDate]
  );

  useEffect(() => {
    convertDate(dateInput);
  }, [dateInput, convertDate]);

  const unitOptions = [
    { label: toolT.seconds, value: "seconds" as const },
    { label: toolT.milliseconds, value: "milliseconds" as const },
  ];

  return (
    <div className="space-y-6">
      {/* Section 1: Current Timestamp */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">{toolT.currentTimestamp}</h3>
        <div className="border border-border rounded-lg p-4 flex items-center justify-between bg-muted/30">
          <code className="font-mono text-2xl font-bold tabular-nums">
            {currentTimestamp}
          </code>
          <CopyButton
            text={String(currentTimestamp)}
            copyLabel={common.copy}
            copiedLabel={common.copied}
          />
        </div>
      </div>

      {/* Section 2: Timestamp to Date */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">{toolT.timestampToDate}</h3>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={tsInput}
            onChange={(e) => setTsInput(e.target.value)}
            placeholder={toolT.timestampPlaceholder}
            className="flex-1 min-w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            spellCheck={false}
          />
          <SegmentedControl
            options={unitOptions}
            value={tsUnit}
            onChange={setTsUnit}
            size="sm"
          />
        </div>

        {tsError && (
          <div className="text-sm px-3 py-1.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
            {common.error}: {tsError}
          </div>
        )}

        {tsResult && (
          <div className="border border-border rounded-lg divide-y divide-border">
            {[
              { label: toolT.localTime, value: tsResult.local },
              { label: toolT.utcTime, value: tsResult.utc },
              { label: toolT.isoFormat, value: tsResult.iso },
              { label: toolT.relativeTime, value: tsResult.relative },
            ].map((row) => (
              <div key={row.label} className="p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {row.label}
                  </span>
                  <CopyButton
                    text={row.value}
                    copyLabel={common.copy}
                    copiedLabel={common.copied}
                    size="sm"
                    className="h-6 text-xs"
                  />
                </div>
                <div className="font-mono text-sm break-all text-foreground">
                  {row.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Date to Timestamp */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">{toolT.dateToTimestamp}</h3>
        <input
          type="datetime-local"
          value={dateInput}
          onChange={(e) => setDateInput(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />

        {dateError && (
          <div className="text-sm px-3 py-1.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
            {common.error}: {dateError}
          </div>
        )}

        {dateResult && (
          <div className="border border-border rounded-lg divide-y divide-border">
            <div className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {toolT.seconds}
                </span>
                <CopyButton
                  text={dateResult.seconds}
                  copyLabel={common.copy}
                  copiedLabel={common.copied}
                  size="sm"
                  className="h-6 text-xs"
                />
              </div>
              <div className="font-mono text-sm text-foreground">
                {dateResult.seconds}
              </div>
            </div>
            <div className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {toolT.milliseconds}
                </span>
                <CopyButton
                  text={dateResult.milliseconds}
                  copyLabel={common.copy}
                  copiedLabel={common.copied}
                  size="sm"
                  className="h-6 text-xs"
                />
              </div>
              <div className="font-mono text-sm text-foreground">
                {dateResult.milliseconds}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
