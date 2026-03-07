"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CopyButton from "./CopyButton";

interface CssBeautifierProps {
  t: Record<string, unknown>;
}

export default function CssBeautifier({ t }: CssBeautifierProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "css-beautifier"
  ];

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

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
      .replace(/\s*([{}:;,])\s*/g, "$1") // Remove space around operators
      .replace(/;\s*}/g, "}") // Remove last semicolon before }
      .trim();
  }, []);

  const handleBeautify = useCallback(() => {
    if (!input.trim()) {
      setError(toolT.emptyInput);
      setOutput("");
      return;
    }

    try {
      const beautified = beautifyCss(input);
      setOutput(beautified);
      setError("");
    } catch (err) {
      setError(toolT.beautifyError);
      setOutput("");
    }
  }, [input, beautifyCss, toolT]);

  const handleMinify = useCallback(() => {
    if (!input.trim()) {
      setError(toolT.emptyInput);
      setOutput("");
      return;
    }

    try {
      const minified = minifyCss(input);
      setOutput(minified);
      setError("");
    } catch (err) {
      setError(toolT.minifyError);
      setOutput("");
    }
  }, [input, minifyCss, toolT]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setError("");
  }, []);

  const handlePaste = useCallback(async () => {
    const text = await navigator.clipboard.readText();
    setInput(text);
  }, []);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 border border-border rounded-lg px-3 py-2 bg-muted/30">
        <div className="flex items-center gap-2">
          <Button onClick={handleBeautify} size="sm">
            {toolT.beautify}
          </Button>
          <Button onClick={handleMinify} size="sm" variant="secondary">
            {common.minify}
          </Button>
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
            <label className="text-sm font-medium">{common.input}</label>
            <span className="text-xs text-muted-foreground">
              {input.length} {toolT.characters}
            </span>
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={common.inputPlaceholder}
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
