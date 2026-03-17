"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import CopyButton from "./CopyButton";

interface CronExpressionBuilderProps {
  t: Record<string, unknown>;
}

interface ParsedField {
  type: "any" | "specific" | "range" | "step" | "list" | "step-range";
  values: number[];
  step?: number;
  rangeStart?: number;
  rangeEnd?: number;
}

interface CronParts {
  minute: ParsedField;
  hour: ParsedField;
  dayOfMonth: ParsedField;
  month: ParsedField;
  dayOfWeek: ParsedField;
}

function parseField(
  field: string,
  min: number,
  max: number
): ParsedField | null {
  field = field.trim();

  // Wildcard
  if (field === "*") {
    return { type: "any", values: [] };
  }

  // Step on wildcard: */n
  if (field.startsWith("*/")) {
    const step = parseInt(field.slice(2), 10);
    if (isNaN(step) || step < 1 || step > max) return null;
    const values: number[] = [];
    for (let i = min; i <= max; i += step) {
      values.push(i);
    }
    return { type: "step", values, step };
  }

  // List: 1,3,5
  if (field.includes(",")) {
    const parts = field.split(",");
    const values: number[] = [];
    for (const part of parts) {
      const trimmed = part.trim();
      // Each item in a list can be a range
      if (trimmed.includes("-")) {
        const rangeParts = trimmed.split("-");
        if (rangeParts.length !== 2) return null;
        const start = parseInt(rangeParts[0], 10);
        const end = parseInt(rangeParts[1], 10);
        if (isNaN(start) || isNaN(end) || start < min || end > max || start > end)
          return null;
        for (let i = start; i <= end; i++) {
          values.push(i);
        }
      } else {
        const v = parseInt(trimmed, 10);
        if (isNaN(v) || v < min || v > max) return null;
        values.push(v);
      }
    }
    return { type: "list", values: [...new Set(values)].sort((a, b) => a - b) };
  }

  // Range with step: 1-5/2
  if (field.includes("-") && field.includes("/")) {
    const [rangePart, stepPart] = field.split("/");
    const [startStr, endStr] = rangePart.split("-");
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    const step = parseInt(stepPart, 10);
    if (
      isNaN(start) ||
      isNaN(end) ||
      isNaN(step) ||
      start < min ||
      end > max ||
      start > end ||
      step < 1
    )
      return null;
    const values: number[] = [];
    for (let i = start; i <= end; i += step) {
      values.push(i);
    }
    return {
      type: "step-range",
      values,
      step,
      rangeStart: start,
      rangeEnd: end,
    };
  }

  // Range: 1-5
  if (field.includes("-")) {
    const parts = field.split("-");
    if (parts.length !== 2) return null;
    const start = parseInt(parts[0], 10);
    const end = parseInt(parts[1], 10);
    if (isNaN(start) || isNaN(end) || start < min || end > max || start > end)
      return null;
    const values: number[] = [];
    for (let i = start; i <= end; i++) {
      values.push(i);
    }
    return { type: "range", values, rangeStart: start, rangeEnd: end };
  }

  // Specific value
  const v = parseInt(field, 10);
  if (isNaN(v) || v < min || v > max) return null;
  return { type: "specific", values: [v] };
}

function parseCronExpression(expression: string): CronParts | null {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return null;

  const minute = parseField(parts[0], 0, 59);
  const hour = parseField(parts[1], 0, 23);
  const dayOfMonth = parseField(parts[2], 1, 31);
  const month = parseField(parts[3], 1, 12);
  const dayOfWeek = parseField(parts[4], 0, 6);

  if (!minute || !hour || !dayOfMonth || !month || !dayOfWeek) return null;

  return { minute, hour, dayOfMonth, month, dayOfWeek };
}

function describeField(
  field: ParsedField,
  fieldName: string,
  names?: string[]
): string {
  const formatValue = (v: number) => (names ? names[v] : String(v));

  switch (field.type) {
    case "any":
      return "";
    case "specific":
      return `${fieldName} ${formatValue(field.values[0])}`;
    case "range":
      return `${fieldName} ${formatValue(field.rangeStart!)} - ${formatValue(field.rangeEnd!)}`;
    case "step":
      return `${fieldName} */${field.step}`;
    case "step-range":
      return `${fieldName} ${formatValue(field.rangeStart!)}-${formatValue(field.rangeEnd!)}/${field.step}`;
    case "list":
      return `${fieldName} ${field.values.map(formatValue).join(", ")}`;
  }
}

function generateDescription(
  parsed: CronParts,
  toolT: Record<string, string>
): string {
  const dayNames = [
    toolT.sun || "Sun",
    toolT.mon || "Mon",
    toolT.tue || "Tue",
    toolT.wed || "Wed",
    toolT.thu || "Thu",
    toolT.fri || "Fri",
    toolT.sat || "Sat",
  ];

  const parts: string[] = [];

  // Minute
  if (parsed.minute.type === "any") {
    parts.push(toolT.everyMinuteDesc || "every minute");
  } else if (parsed.minute.type === "step") {
    parts.push(`${toolT.every || "every"} ${parsed.minute.step} ${toolT.minutesDesc || "minutes"}`);
  } else {
    const desc = describeField(parsed.minute, toolT.minute || "minute");
    if (desc) parts.push(desc);
  }

  // Hour
  if (parsed.hour.type !== "any") {
    if (parsed.hour.type === "step") {
      parts.push(`${toolT.every || "every"} ${parsed.hour.step} ${toolT.hoursDesc || "hours"}`);
    } else {
      const desc = describeField(parsed.hour, toolT.hour || "hour");
      if (desc) parts.push(desc);
    }
  }

  // Day of month
  if (parsed.dayOfMonth.type !== "any") {
    const desc = describeField(
      parsed.dayOfMonth,
      toolT.dayOfMonth || "day-of-month"
    );
    if (desc) parts.push(desc);
  }

  // Month
  if (parsed.month.type !== "any") {
    const desc = describeField(parsed.month, toolT.month || "month");
    if (desc) parts.push(desc);
  }

  // Day of week
  if (parsed.dayOfWeek.type !== "any") {
    const desc = describeField(
      parsed.dayOfWeek,
      toolT.dayOfWeek || "day-of-week",
      dayNames
    );
    if (desc) parts.push(desc);
  }

  return parts.join(", ");
}

function matchesField(field: ParsedField, value: number): boolean {
  if (field.type === "any") return true;
  return field.values.includes(value);
}

function getNextRuns(parsed: CronParts, count: number): Date[] {
  const runs: Date[] = [];
  const now = new Date();
  const candidate = new Date(now);
  // Start from the next minute
  candidate.setSeconds(0, 0);
  candidate.setMinutes(candidate.getMinutes() + 1);

  // Safety limit to prevent infinite loops
  const maxIterations = 525600; // One year of minutes
  let iterations = 0;

  while (runs.length < count && iterations < maxIterations) {
    iterations++;

    const minute = candidate.getMinutes();
    const hour = candidate.getHours();
    const dayOfMonth = candidate.getDate();
    const month = candidate.getMonth() + 1; // 1-indexed
    const dayOfWeek = candidate.getDay(); // 0 = Sunday

    if (
      matchesField(parsed.minute, minute) &&
      matchesField(parsed.hour, hour) &&
      matchesField(parsed.dayOfMonth, dayOfMonth) &&
      matchesField(parsed.month, month) &&
      matchesField(parsed.dayOfWeek, dayOfWeek)
    ) {
      runs.push(new Date(candidate));
    }

    candidate.setMinutes(candidate.getMinutes() + 1);
  }

  return runs;
}

interface Preset {
  label: string;
  value: string;
}

export default function CronExpressionBuilder({
  t,
}: CronExpressionBuilderProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "cron-expression-builder"
  ];

  const [expression, setExpression] = useState("* * * * *");

  const presets: Preset[] = useMemo(
    () => [
      { label: toolT.everyMinute, value: "* * * * *" },
      { label: toolT.everyHour, value: "0 * * * *" },
      { label: toolT.everyDay, value: "0 0 * * *" },
      { label: toolT.everyWeek, value: "0 0 * * 1" },
      { label: toolT.everyMonth, value: "0 0 1 * *" },
      { label: toolT.weekdays, value: "0 9 * * 1-5" },
    ],
    [toolT]
  );

  const handlePresetClick = useCallback((value: string) => {
    setExpression(value);
  }, []);

  const parsed = useMemo(
    () => parseCronExpression(expression),
    [expression]
  );

  const humanReadable = useMemo(
    () => (parsed ? generateDescription(parsed, toolT) : null),
    [parsed, toolT]
  );

  const nextRuns = useMemo(
    () => (parsed ? getNextRuns(parsed, 5) : []),
    [parsed]
  );

  const fields = expression.trim().split(/\s+/);
  const fieldLabels = [
    toolT.minute,
    toolT.hour,
    toolT.dayOfMonth,
    toolT.month,
    toolT.dayOfWeek,
  ];
  const fieldRanges = ["0-59", "0-23", "1-31", "1-12", "0-6"];

  return (
    <div className="space-y-6">
      {/* Expression input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{toolT.expression}</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder={toolT.expressionPlaceholder}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            spellCheck={false}
          />
          <CopyButton
            text={expression}
            copyLabel={common.copy}
            copiedLabel={common.copied}
          />
        </div>
      </div>

      {/* Field breakdown */}
      <div className="grid grid-cols-5 gap-1 sm:gap-2">
        {fieldLabels.map((label, i) => (
          <div
            key={label}
            className="text-center border border-border rounded-lg p-2 sm:p-3 bg-muted/30"
          >
            <div className="font-mono text-base sm:text-lg font-bold text-foreground">
              {fields[i] || "*"}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">
              {label}
            </div>
            <div className="text-[9px] sm:text-[10px] text-muted-foreground/60 font-mono">
              {fieldRanges[i]}
            </div>
          </div>
        ))}
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">{toolT.presets}</h3>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.value}
              variant={expression === preset.value ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetClick(preset.value)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {!parsed && expression.trim() !== "" && (
        <div className="text-sm px-3 py-1.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
          {common.error}: {toolT.invalidExpression}
        </div>
      )}

      {/* Human-readable description */}
      {parsed && humanReadable && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">{toolT.humanReadable}</h3>
          <div className="border border-border rounded-lg p-4 bg-muted/30">
            <p className="text-sm text-foreground">{humanReadable}</p>
          </div>
        </div>
      )}

      {/* Next 5 run times */}
      {parsed && nextRuns.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">{toolT.nextRuns}</h3>
          <div className="border border-border rounded-lg divide-y divide-border">
            {nextRuns.map((run, i) => (
              <div
                key={i}
                className="px-4 py-2.5 flex items-center justify-between"
              >
                <code className="font-mono text-sm text-foreground">
                  {run.toLocaleString()}
                </code>
                <span className="text-xs text-muted-foreground font-mono">
                  #{i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
