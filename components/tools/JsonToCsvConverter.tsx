"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CopyButton from "./CopyButton";

interface JsonToCsvConverterProps {
  t: Record<string, unknown>;
}

export default function JsonToCsvConverter({ t }: JsonToCsvConverterProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "json-to-csv-converter"
  ];

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const jsonToCsv = useCallback((jsonStr: string): string => {
    const data = JSON.parse(jsonStr);
    
    // Handle array of objects
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object") {
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(",")];
      
      for (const row of data) {
        const values = headers.map((header) => {
          const val = row[header];
          const escaped = String(val ?? "").replace(/"/g, '""');
          return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
        });
        csvRows.push(values.join(","));
      }
      
      return csvRows.join("\n");
    }
    
    // Handle single object (convert to single-row CSV)
    if (typeof data === "object" && !Array.isArray(data) && data !== null) {
      const headers = Object.keys(data);
      const values = headers.map((header) => {
        const val = data[header];
        const escaped = String(val ?? "").replace(/"/g, '""');
        return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
      });
      return headers.join(",") + "\n" + values.join(",");
    }
    
    throw new Error("JSON must be an array of objects or a single object");
  }, []);

  const handleConvert = useCallback(() => {
    if (!input.trim()) {
      setError(toolT.emptyInput);
      setOutput("");
      return;
    }

    try {
      const csv = jsonToCsv(input);
      setOutput(csv);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : toolT.convertError);
      setOutput("");
    }
  }, [input, jsonToCsv, toolT]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setError("");
  }, []);

  const handlePaste = useCallback(async () => {
    const text = await navigator.clipboard.readText();
    setInput(text);
  }, []);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [output]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 border border-border rounded-lg px-3 py-2 bg-muted/30">
        <div className="flex items-center gap-2">
          <Button onClick={handleConvert} size="sm">
            {toolT.convert}
          </Button>
          {output && (
            <Button onClick={handleDownload} size="sm" variant="secondary">
              {common.download}
            </Button>
          )}
        </div>

        <div className="h-5 w-px bg-border hidden sm:block" />

        <div className="flex items-center gap-2">
          <Button onClick={handlePaste} size="sm" variant="outline">
            {common.paste}
          </Button>
          <Button onClick={handleClear} size="sm" variant="outline">
            {common.clear}
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="border border-destructive/50 bg-destructive/10 rounded-lg p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Input/Output */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{toolT.jsonInput}</label>
            <span className="text-xs text-muted-foreground">
              {input.length} {toolT.characters}
            </span>
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={toolT.jsonPlaceholder}
            className="font-mono text-sm min-h-[200px] sm:min-h-[400px]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{toolT.csvOutput}</label>
            {output && (
              <CopyButton
                text={output}
                copyLabel={common.copy}
                copiedLabel={common.copied}
              />
            )}
          </div>
          <Textarea
            value={output}
            readOnly
            placeholder={common.outputPlaceholder}
            className="font-mono text-sm min-h-[200px] sm:min-h-[400px] bg-muted/50"
          />
        </div>
      </div>
    </div>
  );
}
