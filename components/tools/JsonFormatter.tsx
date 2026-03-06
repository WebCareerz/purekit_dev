"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SegmentedControl } from "@/components/ui/segmented-control";
import CopyButton from "./CopyButton";

interface JsonFormatterProps {
  t: Record<string, unknown>;
}

export default function JsonFormatter({ t }: JsonFormatterProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)["json-formatter"];

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [indent, setIndent] = useState<string>("2");
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const indentOptions = [
    { label: toolT.spaces2, value: "2" },
    { label: toolT.spaces4, value: "4" },
    { label: toolT.tab, value: "tab" },
  ];

  const getIndentValue = (v: string): number | string => {
    if (v === "tab") return "\t";
    return Number(v);
  };

  const handleFormat = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      setError("");
      setIsValid(null);
      return;
    }
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, getIndentValue(indent));
      setOutput(formatted);
      setError("");
      setIsValid(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setOutput("");
      setIsValid(false);
    }
  }, [input, indent]);

  const handleMinify = useCallback(() => {
    if (!input.trim()) {
      setOutput("");
      setError("");
      setIsValid(null);
      return;
    }
    try {
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      setOutput(minified);
      setError("");
      setIsValid(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setOutput("");
      setIsValid(false);
    }
  }, [input]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setError("");
    setIsValid(null);
  }, []);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border border-border rounded-lg px-3 py-2 bg-muted/30">
        <div className="flex items-center gap-2">
          <Button onClick={handleFormat} size="sm">
            {common.format}
          </Button>
          <Button onClick={handleMinify} variant="secondary" size="sm">
            {common.minify}
          </Button>
          <Button onClick={handleClear} variant="ghost" size="sm">
            {common.clear}
          </Button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-muted-foreground">
            {toolT.indentation}
          </span>
          <SegmentedControl
            options={indentOptions}
            value={indent}
            onChange={setIndent}
            size="sm"
          />
        </div>
      </div>

      {/* Status indicator */}
      {isValid !== null && (
        <div
          className={`text-sm px-3 py-1.5 rounded-md ${
            isValid
              ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
          }`}
        >
          {isValid ? toolT.validJson : `${toolT.invalidJson}: ${error}`}
        </div>
      )}

      {/* Input / Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">{common.input}</label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={common.inputPlaceholder}
            className="font-mono text-sm min-h-[400px] resize-y"
            spellCheck={false}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{common.output}</label>
            <CopyButton
              text={output}
              copyLabel={common.copy}
              copiedLabel={common.copied}
            />
          </div>
          <Textarea
            value={output}
            readOnly
            placeholder={common.outputPlaceholder}
            className="font-mono text-sm min-h-[400px] resize-y"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
