"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CopyButton from "./CopyButton";

interface JavaScriptBeautifierProps {
  t: Record<string, unknown>;
}

export default function JavaScriptBeautifier({ t }: JavaScriptBeautifierProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "javascript-beautifier"
  ];

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const beautifyJs = useCallback((code: string, indentSize: number = 2): string => {
    const tab = " ".repeat(indentSize);
    let result = "";
    let indent = 0;
    let inString = false;
    let stringChar = "";
    let inComment = false;
    let inMultilineComment = false;

    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const next = code[i + 1] || "";
      const prev = code[i - 1] || "";

      // Handle comments
      if (!inString && char === "/" && next === "/") {
        inComment = true;
      }
      if (inComment && char === "\n") {
        inComment = false;
        result += "\n" + tab.repeat(indent);
        continue;
      }
      if (!inString && char === "/" && next === "*") {
        inMultilineComment = true;
      }
      if (inMultilineComment && char === "*" && next === "/") {
        result += "*/";
        i++;
        inMultilineComment = false;
        continue;
      }

      // Handle strings
      if (!inComment && !inMultilineComment && (char === '"' || char === "'" || char === "`")) {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar && prev !== "\\") {
          inString = false;
          stringChar = "";
        }
      }

      if (inString || inComment || inMultilineComment) {
        result += char;
        continue;
      }

      // Handle braces and brackets
      if (char === "{" || char === "[") {
        result += char + "\n";
        indent++;
        result += tab.repeat(indent);
      } else if (char === "}" || char === "]") {
        indent = Math.max(0, indent - 1);
        result = result.trimEnd() + "\n" + tab.repeat(indent) + char;
      } else if (char === ";" && next !== "\n") {
        result += char + "\n" + tab.repeat(indent);
      } else if (char === "\n" || char === "\r") {
        // Skip original newlines
        continue;
      } else if (char === " " && (prev === " " || prev === "\n")) {
        // Skip extra spaces
        continue;
      } else {
        result += char;
      }
    }

    return result.trim();
  }, []);

  const minifyJs = useCallback((code: string): string => {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multiline comments
      .replace(/\/\/.*/g, "") // Remove single-line comments
      .replace(/\s{2,}/g, " ") // Collapse spaces
      .replace(/\s*([{}()[\];,:])\s*/g, "$1") // Remove space around operators
      .trim();
  }, []);

  const handleBeautify = useCallback(() => {
    if (!input.trim()) {
      setError(toolT.emptyInput);
      setOutput("");
      return;
    }

    try {
      const beautified = beautifyJs(input);
      setOutput(beautified);
      setError("");
    } catch (err) {
      setError(toolT.beautifyError);
      setOutput("");
    }
  }, [input, beautifyJs, toolT]);

  const handleMinify = useCallback(() => {
    if (!input.trim()) {
      setError(toolT.emptyInput);
      setOutput("");
      return;
    }

    try {
      const minified = minifyJs(input);
      setOutput(minified);
      setError("");
    } catch (err) {
      setError(toolT.minifyError);
      setOutput("");
    }
  }, [input, minifyJs, toolT]);

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
