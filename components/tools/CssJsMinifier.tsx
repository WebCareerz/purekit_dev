"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CopyButton from "./CopyButton";

interface CssJsMinifierProps {
  t: Record<string, unknown>;
}

export default function CssJsMinifier({ t }: CssJsMinifierProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "css-js-minifier"
  ];

  const [mode, setMode] = useState<"css" | "js">("css");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [stats, setStats] = useState<{ original: number; minified: number; saved: number } | null>(null);

  const minifyCss = useCallback((css: string): string => {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove comments
      .replace(/\s{2,}/g, " ") // Collapse spaces
      .replace(/\s*([{}:;,>+~])\s*/g, "$1") // Remove space around operators
      .replace(/;\s*}/g, "}") // Remove last semicolon before }
      .replace(/\s*!important/g, "!important")
      .replace(/:\s*/g, ":")
      .trim();
  }, []);

  const minifyJs = useCallback((js: string): string => {
    // Basic JS minification (remove comments, extra spaces, newlines)
    return js
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
      .replace(/\/\/.*/g, "") // Remove single-line comments
      .replace(/\s{2,}/g, " ") // Collapse spaces
      .replace(/\n/g, "") // Remove newlines
      .replace(/\s*([{}():;,=<>+\-*/%&|!])\s*/g, "$1") // Remove spaces around operators
      .trim();
  }, []);

  const handleMinify = useCallback(() => {
    if (!input.trim()) {
      setError(toolT.emptyInput);
      setOutput("");
      setStats(null);
      return;
    }

    try {
      const minified = mode === "css" ? minifyCss(input) : minifyJs(input);
      const originalSize = new Blob([input]).size;
      const minifiedSize = new Blob([minified]).size;
      const saved = ((1 - minifiedSize / originalSize) * 100);

      setOutput(minified);
      setStats({
        original: originalSize,
        minified: minifiedSize,
        saved: saved
      });
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : toolT.minifyError);
      setOutput("");
      setStats(null);
    }
  }, [input, mode, minifyCss, minifyJs, toolT]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setError("");
    setStats(null);
  }, []);

  const handlePaste = useCallback(async () => {
    const text = await navigator.clipboard.readText();
    setInput(text);
  }, []);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: mode === "css" ? "text/css" : "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mode === "css" ? "minified.min.css" : "minified.min.js";
    a.click();
    URL.revokeObjectURL(url);
  }, [output, mode]);

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
        <Button
          onClick={() => {
            setMode("css");
            handleClear();
          }}
          size="sm"
          variant={mode === "css" ? "default" : "ghost"}
        >
          {toolT.css}
        </Button>
        <Button
          onClick={() => {
            setMode("js");
            handleClear();
          }}
          size="sm"
          variant={mode === "js" ? "default" : "ghost"}
        >
          {toolT.javascript}
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 border border-border rounded-lg px-3 py-2 bg-muted/30">
        <div className="flex items-center gap-2">
          <Button onClick={handleMinify} size="sm">
            {toolT.minify}
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

      {/* Stats */}
      {stats && (
        <div className="border border-border rounded-lg p-3 bg-muted/30 grid grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground">{toolT.original}</div>
            <div className="font-semibold">{(stats.original / 1024).toFixed(2)} KB</div>
          </div>
          <div>
            <div className="text-muted-foreground">{toolT.minified}</div>
            <div className="font-semibold">{(stats.minified / 1024).toFixed(2)} KB</div>
          </div>
          <div>
            <div className="text-muted-foreground">{toolT.saved}</div>
            <div className="font-semibold text-primary">{stats.saved.toFixed(1)}%</div>
          </div>
        </div>
      )}

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
            <label className="text-sm font-medium">{common.input}</label>
            <span className="text-xs text-muted-foreground">
              {input.length} {toolT.characters}
            </span>
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === "css" ? toolT.cssPlaceholder : toolT.jsPlaceholder}
            className="font-mono text-sm min-h-[200px] sm:min-h-[400px]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{common.output}</label>
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
