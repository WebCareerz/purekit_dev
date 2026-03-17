"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import CopyButton from "./CopyButton";

interface CsvToJsonConverterProps {
  t: Record<string, unknown>;
}

export default function CsvToJsonConverter({ t }: CsvToJsonConverterProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "csv-to-json"
  ];

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [useFirstRowAsKeys, setUseFirstRowAsKeys] = useState(true);
  const [delimiter, setDelimiter] = useState<"auto" | "," | "\t" | ";">("auto");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectDelimiter = useCallback((csvText: string): string => {
    const firstLine = csvText.split("\n")[0] || "";
    const delimiters = [",", "\t", ";"];
    const counts = delimiters.map((d) => firstLine.split(d).length);
    const maxIndex = counts.indexOf(Math.max(...counts));
    return delimiters[maxIndex];
  }, []);

  const parseCSV = useCallback((csvText: string, delim: string): string[][] => {
    const lines = csvText.trim().split("\n");
    const result: string[][] = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      
      const values: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"';
            i++; // Skip next quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delim && !inQuotes) {
          values.push(current);
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current);
      result.push(values);
    }

    return result;
  }, []);

  const handleConvert = useCallback(() => {
    if (!input.trim()) {
      setError(toolT.emptyInput);
      setOutput("");
      return;
    }

    try {
      const actualDelimiter = delimiter === "auto" ? detectDelimiter(input) : delimiter;
      const rows = parseCSV(input, actualDelimiter);

      if (rows.length === 0) {
        throw new Error(toolT.convertError);
      }

      let jsonData: unknown[];

      if (useFirstRowAsKeys && rows.length > 1) {
        const headers = rows[0];
        jsonData = rows.slice(1).map((row) => {
          const obj: Record<string, string> = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || "";
          });
          return obj;
        });
      } else {
        jsonData = rows;
      }

      const jsonString = JSON.stringify(jsonData, null, 2);
      setOutput(jsonString);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : toolT.convertError);
      setOutput("");
    }
  }, [input, delimiter, useFirstRowAsKeys, detectDelimiter, parseCSV, toolT]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handlePaste = useCallback(async () => {
    const text = await navigator.clipboard.readText();
    setInput(text);
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setInput(text);
  }, []);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [output]);

  return (
    <div className="space-y-4">
      {/* Options */}
      <div className="border border-border rounded-lg p-3 bg-muted/30 space-y-3">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="firstRowKeys"
              checked={useFirstRowAsKeys}
              onCheckedChange={(checked) => setUseFirstRowAsKeys(checked as boolean)}
            />
            <Label htmlFor="firstRowKeys" className="text-sm cursor-pointer">
              {toolT.useFirstRowAsKeys}
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="delimiter" className="text-sm">
              {toolT.delimiter}:
            </Label>
            <select
              id="delimiter"
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value as typeof delimiter)}
              className="border border-border rounded px-2 py-1 text-sm bg-background"
            >
              <option value="auto">{toolT.autoDetect}</option>
              <option value=",">{toolT.comma}</option>
              <option value={"\t"}>{toolT.tab}</option>
              <option value=";">{toolT.semicolon}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 border border-border rounded-lg px-3 py-2 bg-muted/30">
        <div className="flex items-center gap-2">
          <Button onClick={handleConvert} size="sm">
            {toolT.convert}
          </Button>
          {output && (
            <Button onClick={handleDownload} size="sm" variant="secondary">
              {toolT.downloadJson}
            </Button>
          )}
        </div>

        <div className="h-5 w-px bg-border hidden sm:block" />

        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            accept=".csv,.txt"
            className="w-[180px] text-sm"
          />
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
            <label className="text-sm font-medium">{toolT.csvInput}</label>
            <span className="text-xs text-muted-foreground">
              {input.length} {toolT.characters}
            </span>
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={toolT.csvPlaceholder}
            className="font-mono text-sm min-h-[200px] sm:min-h-[400px]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{toolT.jsonOutput}</label>
            {output && (
              <CopyButton text={output} copyLabel={common.copy} copiedLabel={common.copied} />
            )}
          </div>
          <Textarea
            value={output}
            readOnly
            placeholder={toolT.jsonPlaceholder}
            className="font-mono text-sm min-h-[200px] sm:min-h-[400px] bg-muted/50"
          />
        </div>
      </div>
    </div>
  );
}
