"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import CopyButton from "./CopyButton";

interface HtmlToMarkdownProps {
  t: Record<string, unknown>;
}

export default function HtmlToMarkdown({ t }: HtmlToMarkdownProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)["html-to-markdown"];

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const turndownRef = useRef<any>(null);

  const getTurndown = useCallback(async () => {
    if (turndownRef.current) return turndownRef.current;
    const TurndownService = (await import("turndown")).default;
    const service = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
    });
    turndownRef.current = service;
    return service;
  }, []);

  const convertHtmlToMarkdown = useCallback(
    async (html: string) => {
      if (!html.trim()) {
        setOutput("");
        setError("");
        return;
      }

      try {
        const turndown = await getTurndown();
        const markdown = turndown.turndown(html);
        setOutput(markdown);
        setError("");
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        setOutput("");
      }
    },
    [getTurndown]
  );

  useEffect(() => {
    convertHtmlToMarkdown(input);
  }, [input, convertHtmlToMarkdown]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/30 rounded-md px-3 py-2 text-sm">
          {common.error}: {error}
        </div>
      )}

      {/* Input/Output Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* HTML Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{toolT.htmlInput}</label>
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
            placeholder={toolT.htmlPlaceholder}
            className="font-mono text-sm min-h-[200px] sm:min-h-[400px] resize-none"
            spellCheck={false}
          />
        </div>

        {/* Markdown Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{toolT.markdownOutput}</label>
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
