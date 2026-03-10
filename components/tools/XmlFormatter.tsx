"use client";

import { useState, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { SegmentedControl } from "@/components/ui/segmented-control";
import CopyButton from "./CopyButton";

interface XmlFormatterProps {
  t: Record<string, unknown>;
}

export default function XmlFormatter({ t }: XmlFormatterProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)["xml-formatter"];

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<string>("format");
  const [indent, setIndent] = useState<string>("2");
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const modeOptions = [
    { label: common.format, value: "format" },
    { label: common.minify, value: "minify" },
  ];

  const indentOptions = [
    { label: toolT.spaces2, value: "2" },
    { label: toolT.spaces4, value: "4" },
    { label: toolT.tab, value: "tab" },
  ];

  const formatXml = useCallback(
    async (text: string, currentMode: string, currentIndent: string) => {
      if (!text.trim()) {
        setOutput("");
        setError("");
        setIsValid(null);
        return;
      }

      try {
        // Validate XML first
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        
        // Check for parsing errors
        const parserError = xmlDoc.querySelector("parsererror");
        if (parserError) {
          throw new Error(parserError.textContent || "Invalid XML");
        }

        if (currentMode === "minify") {
          // Minify: remove whitespace between tags
          const minified = text
            .replace(/>\s+</g, "><")
            .replace(/\n/g, "")
            .trim();
          setOutput(minified);
        } else {
          // Format: use xml-formatter
          const xmlFormatter = await import("xml-formatter");
          const indentStr = currentIndent === "tab" ? "\t" : " ".repeat(Number(currentIndent));
          const formatted = xmlFormatter.default(text, {
            indentation: indentStr,
            collapseContent: true,
          });
          setOutput(formatted);
        }

        setError("");
        setIsValid(true);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        setOutput("");
        setIsValid(false);
      }
    },
    []
  );

  useEffect(() => {
    formatXml(input, mode, indent);
  }, [input, mode, indent, formatXml]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 border border-border rounded-lg px-3 py-2 bg-muted/30">
        <SegmentedControl
          options={modeOptions}
          value={mode}
          onChange={setMode}
          size="sm"
        />

        {mode === "format" && (
          <div className="flex items-center gap-2">
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
        )}
      </div>

      {/* Status indicator */}
      {isValid !== null && (
        <div
          className={`text-sm px-3 py-1.5 rounded-md ${
            isValid
              ? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/30"
              : "bg-destructive/10 text-destructive border border-destructive/30"
          }`}
        >
          {isValid ? `✓ ${common.valid}` : `✗ ${common.invalid}`}
          {error && `: ${error}`}
        </div>
      )}

      {/* Input/Output Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* XML Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{common.input}</label>
            <div className="flex gap-2">
              <button
                onClick={() => setInput("")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {common.clear}
              </button>
            </div>
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={toolT.xmlPlaceholder}
            className="font-mono text-sm min-h-[200px] sm:min-h-[400px] resize-none"
            spellCheck={false}
          />
        </div>

        {/* XML Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{common.output}</label>
            <CopyButton text={output} copyLabel={common.copy} copiedLabel={common.copied} />
          </div>
          <Textarea
            value={output}
            readOnly
            placeholder={common.outputPlaceholder}
            className="font-mono text-sm min-h-[200px] sm:min-h-[400px] resize-none bg-muted/50"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
