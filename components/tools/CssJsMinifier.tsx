"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Minimize2, Download, Sparkles } from "lucide-react";
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
  const [action, setAction] = useState<"minify" | "beautify">("minify");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [stats, setStats] = useState<{ original: number; processed: number; saved: number } | null>(null);

  const beautifyCss = useCallback((css: string, indentSize: number = 2): string => {
    const tab = " ".repeat(indentSize);
    let result = "";
    let indent = 0;
    let inComment = false;

    // Remove extra whitespace
    css = css.replace(/\s+/g, " ").trim();

    for (let i = 0; i < css.length; i++) {
      const char = css[i];
      const next = css[i + 1] || "";
      const prev = css[i - 1] || "";

      // Handle comments
      if (char === "/" && next === "*") {
        inComment = true;
        result += "/*";
        i++;
        continue;
      }
      if (inComment && char === "*" && next === "/") {
        result += "*/\n" + tab.repeat(indent);
        i++;
        inComment = false;
        continue;
      }

      if (inComment) {
        result += char;
        continue;
      }

      // Handle braces
      if (char === "{") {
        result += " {\n";
        indent++;
        result += tab.repeat(indent);
      } else if (char === "}") {
        indent = Math.max(0, indent - 1);
        result = result.trimEnd() + "\n" + tab.repeat(indent) + "}\n" + tab.repeat(indent);
      } else if (char === ";" && next !== "\n") {
        result += ";\n" + tab.repeat(indent);
      } else if (char === "," && prev !== " ") {
        result += ", ";
      } else if (char === " " && (prev === " " || prev === "\n")) {
        // Skip extra spaces
        continue;
      } else {
        result += char;
      }
    }

    return result.trim();
  }, []);

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

  const beautifyJs = useCallback((js: string, indentSize: number = 2): string => {
    const tab = " ".repeat(indentSize);
    let result = "";
    let indent = 0;
    let inString = false;
    let stringChar = "";
    let inComment = false;
    let inLineComment = false;

    for (let i = 0; i < js.length; i++) {
      const char = js[i];
      const next = js[i + 1] || "";
      const prev = js[i - 1] || "";

      // Handle strings
      if (!inComment && !inLineComment && (char === '"' || char === "'" || char === "`")) {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar && prev !== "\\") {
          inString = false;
        }
        result += char;
        continue;
      }

      if (inString) {
        result += char;
        continue;
      }

      // Handle comments
      if (char === "/" && next === "*" && !inLineComment) {
        inComment = true;
        result += "/*";
        i++;
        continue;
      }
      if (inComment && char === "*" && next === "/") {
        result += "*/\n" + tab.repeat(indent);
        i++;
        inComment = false;
        continue;
      }
      if (char === "/" && next === "/" && !inComment) {
        inLineComment = true;
        result += "//";
        i++;
        continue;
      }
      if (inLineComment && char === "\n") {
        inLineComment = false;
        result += "\n" + tab.repeat(indent);
        continue;
      }

      if (inComment || inLineComment) {
        result += char;
        continue;
      }

      // Handle braces and formatting
      if (char === "{") {
        result += " {\n";
        indent++;
        result += tab.repeat(indent);
      } else if (char === "}") {
        indent = Math.max(0, indent - 1);
        result = result.trimEnd() + "\n" + tab.repeat(indent) + "}\n" + tab.repeat(indent);
      } else if (char === ";" && next !== "\n" && next !== " ") {
        result += ";\n" + tab.repeat(indent);
      } else if (char === "\n") {
        result += "\n" + tab.repeat(indent);
      } else {
        result += char;
      }
    }

    return result.trim();
  }, []);

  const minifyJs = useCallback((js: string): string => {
    // Conservative JS minification - preserves code correctness
    let result = js;
    
    // Remove multi-line comments
    result = result.replace(/\/\*[\s\S]*?\*\//g, "");
    
    // Remove single-line comments (preserve URLs)
    result = result.replace(/([^:])\/\/.*/g, "$1");
    
    // Remove leading/trailing whitespace on each line
    result = result.replace(/^\s+|\s+$/gm, "");
    
    // Replace multiple spaces with single space
    result = result.replace(/  +/g, " ");
    
    // Remove newlines (but keep some spaces for safety)
    result = result.replace(/\n/g, " ");
    
    // Collapse multiple spaces again
    result = result.replace(/  +/g, " ");
    
    return result.trim();
  }, []);

  const handleProcess = useCallback(() => {
    if (!input.trim()) {
      setError(toolT.emptyInput);
      setOutput("");
      setStats(null);
      return;
    }

    try {
      let processed: string;
      
      if (action === "minify") {
        processed = mode === "css" ? minifyCss(input) : minifyJs(input);
      } else {
        processed = mode === "css" ? beautifyCss(input) : beautifyJs(input);
      }

      const originalSize = new Blob([input]).size;
      const processedSize = new Blob([processed]).size;
      const saved = action === "minify" 
        ? ((1 - processedSize / originalSize) * 100)
        : ((processedSize / originalSize - 1) * 100);

      setOutput(processed);
      setStats({
        original: originalSize,
        processed: processedSize,
        saved: saved
      });
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : toolT.processError);
      setOutput("");
      setStats(null);
    }
  }, [input, mode, action, minifyCss, minifyJs, beautifyCss, beautifyJs, toolT]);

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
    const extension = action === "minify" ? "min" : "formatted";
    const blob = new Blob([output], { type: mode === "css" ? "text/css" : "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mode === "css" 
      ? `${extension}.${action === "minify" ? "min." : ""}css`
      : `${extension}.${action === "minify" ? "min." : ""}js`;
    a.click();
    URL.revokeObjectURL(url);
  }, [output, mode, action]);

  return (
    <div className="space-y-4">
      {/* Mode Toggles */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Language Toggle */}
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

        {/* Action Toggle */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
          <Button
            onClick={() => setAction("minify")}
            size="sm"
            variant={action === "minify" ? "default" : "ghost"}
          >
            <Minimize2 className="h-4 w-4 mr-1.5" />
            {toolT.minify}
          </Button>
          <Button
            onClick={() => setAction("beautify")}
            size="sm"
            variant={action === "beautify" ? "default" : "ghost"}
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            {toolT.beautify}
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 border border-border rounded-lg px-3 py-2 bg-muted/30">
        <div className="flex items-center gap-2">
          <Button onClick={handleProcess} size="sm">
            {action === "minify" ? <Minimize2 className="h-4 w-4 mr-1.5" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
            {action === "minify" ? toolT.minify : toolT.beautify}
          </Button>
          {output && (
            <Button onClick={handleDownload} size="sm" variant="secondary">
              <Download className="h-4 w-4 mr-1.5" />
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
            <div className="text-muted-foreground">{action === "minify" ? toolT.minified : toolT.formatted}</div>
            <div className="font-semibold">{(stats.processed / 1024).toFixed(2)} KB</div>
          </div>
          <div>
            <div className="text-muted-foreground">{action === "minify" ? toolT.saved : toolT.increased}</div>
            <div className={`font-semibold ${action === "minify" ? "text-primary" : "text-muted-foreground"}`}>
              {action === "minify" ? stats.saved.toFixed(1) : "+" + stats.saved.toFixed(1)}%
            </div>
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
