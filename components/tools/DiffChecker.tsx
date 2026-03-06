"use client";

import { useState, useCallback } from "react";
import { diffLines } from "diff";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface DiffCheckerProps {
  t: Record<string, unknown>;
}

interface DiffLine {
  text: string;
  type: "added" | "removed" | "unchanged";
}

export default function DiffChecker({ t }: DiffCheckerProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "diff-checker"
  ];

  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");
  const [diffResult, setDiffResult] = useState<DiffLine[] | null>(null);
  const [addedCount, setAddedCount] = useState(0);
  const [removedCount, setRemovedCount] = useState(0);

  const handleCompare = useCallback(() => {
    // Normalize trailing newlines so diffLines doesn't treat
    // "line\n" vs "line" as a full-block change
    const a = original.endsWith("\n") ? original : original + "\n";
    const b = modified.endsWith("\n") ? modified : modified + "\n";
    const changes = diffLines(a, b);

    const lines: DiffLine[] = [];
    let added = 0;
    let removed = 0;

    for (const change of changes) {
      const changeLines = change.value.replace(/\n$/, "").split("\n");
      for (const line of changeLines) {
        if (change.added) {
          lines.push({ text: line, type: "added" });
          added++;
        } else if (change.removed) {
          lines.push({ text: line, type: "removed" });
          removed++;
        } else {
          lines.push({ text: line, type: "unchanged" });
        }
      }
    }

    setDiffResult(lines);
    setAddedCount(added);
    setRemovedCount(removed);
  }, [original, modified]);

  const handleClear = useCallback(() => {
    setOriginal("");
    setModified("");
    setDiffResult(null);
    setAddedCount(0);
    setRemovedCount(0);
  }, []);

  const noDifferences = diffResult !== null && addedCount === 0 && removedCount === 0;

  return (
    <div className="space-y-4">
      {/* Input textareas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">{toolT.original}</label>
          <Textarea
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            placeholder={toolT.originalPlaceholder}
            className="font-mono text-sm min-h-[300px] resize-y"
            spellCheck={false}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{toolT.modified}</label>
          <Textarea
            value={modified}
            onChange={(e) => setModified(e.target.value)}
            placeholder={toolT.modifiedPlaceholder}
            className="font-mono text-sm min-h-[300px] resize-y"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border border-border rounded-lg px-3 py-2 bg-muted/30">
        <div className="flex items-center gap-2">
          <Button onClick={handleCompare} size="sm">
            {toolT.compare}
          </Button>
          <Button onClick={handleClear} variant="ghost" size="sm">
            {common.clear}
          </Button>
        </div>
      </div>

      {/* Diff output */}
      {diffResult !== null && (
        <div className="space-y-3">
          {/* Summary */}
          {noDifferences ? (
            <div className="text-sm px-3 py-1.5 rounded-md bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400">
              {toolT.noDifferences}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              <span className="text-green-700 dark:text-green-400">
                +{addedCount} {toolT.linesAdded}
              </span>
              {", "}
              <span className="text-red-700 dark:text-red-400">
                -{removedCount} {toolT.linesRemoved}
              </span>
            </div>
          )}

          {/* Diff lines */}
          {!noDifferences && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="font-mono text-sm overflow-x-auto">
                {diffResult.map((line, index) => {
                  let className = "px-3 py-0.5 whitespace-pre ";
                  let prefix = "  ";

                  if (line.type === "added") {
                    className +=
                      "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300";
                    prefix = "+ ";
                  } else if (line.type === "removed") {
                    className +=
                      "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300";
                    prefix = "- ";
                  }

                  return (
                    <div key={index} className={className}>
                      {prefix}
                      {line.text}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
