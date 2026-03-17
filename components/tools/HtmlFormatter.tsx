"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CopyButton from "./CopyButton";

interface HtmlFormatterProps {
  t: Record<string, unknown>;
}

export default function HtmlFormatter({ t }: HtmlFormatterProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "html-formatter"
  ];

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const formatHtml = useCallback((html: string, indentSize: number = 2): string => {
    let formatted = "";
    let indent = 0;
    const tab = " ".repeat(indentSize);
    
    // Remove extra whitespace and newlines
    html = html.replace(/>\s+</g, "><").trim();
    
    // Self-closing tags
    const selfClosing = ["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"];
    
    const tokens = html.match(/<\/?[^>]+>|[^<]+/g) || [];
    
    tokens.forEach((token) => {
      if (token.startsWith("</")) {
        // Closing tag
        indent--;
        formatted += tab.repeat(Math.max(0, indent)) + token + "\n";
      } else if (token.startsWith("<")) {
        // Opening tag or self-closing
        const tagMatch = token.match(/<(\w+)/);
        const tagName = tagMatch ? tagMatch[1].toLowerCase() : "";
        const isSelfClosing = selfClosing.includes(tagName) || token.endsWith("/>");
        
        formatted += tab.repeat(indent) + token + "\n";
        
        if (!isSelfClosing) {
          indent++;
        }
      } else {
        // Text content
        const trimmed = token.trim();
        if (trimmed) {
          formatted += tab.repeat(indent) + trimmed + "\n";
        }
      }
    });
    
    return formatted.trim();
  }, []);

  const minifyHtml = useCallback((html: string): string => {
    return html
      .replace(/<!--[\s\S]*?-->/g, "") // Remove comments
      .replace(/>\s+</g, "><") // Remove whitespace between tags
      .replace(/\s{2,}/g, " ") // Collapse multiple spaces
      .trim();
  }, []);

  const handleFormat = useCallback(() => {
    if (!input.trim()) {
      setError(toolT.emptyInput);
      setOutput("");
      return;
    }

    try {
      const formatted = formatHtml(input);
      setOutput(formatted);
      setError("");
    } catch (err) {
      setError(toolT.formatError);
      setOutput("");
    }
  }, [input, formatHtml, toolT]);

  const handleMinify = useCallback(() => {
    if (!input.trim()) {
      setError(toolT.emptyInput);
      setOutput("");
      return;
    }

    try {
      const minified = minifyHtml(input);
      setOutput(minified);
      setError("");
    } catch (err) {
      setError(toolT.minifyError);
      setOutput("");
    }
  }, [input, minifyHtml, toolT]);

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
          <Button onClick={handleFormat} size="sm">
            {common.format}
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
