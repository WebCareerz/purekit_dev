"use client";

import { useState, useMemo } from "react";
import { marked } from "marked";
import { Textarea } from "@/components/ui/textarea";
import CopyButton from "./CopyButton";

interface MarkdownPreviewProps {
  t: Record<string, unknown>;
}

marked.setOptions({
  breaks: true,
  gfm: true,
});

export default function MarkdownPreview({ t }: MarkdownPreviewProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "markdown-preview"
  ];

  const [input, setInput] = useState("");

  const htmlOutput = useMemo(() => {
    if (!input.trim()) return "";
    return marked.parse(input) as string;
  }, [input]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Editor */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{toolT.editor}</label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={toolT.editorPlaceholder}
            className="font-mono text-sm min-h-[400px] resize-y"
            spellCheck={false}
          />
        </div>

        {/* Rendered Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              {toolT.renderedPreview}
            </label>
            <CopyButton
              text={htmlOutput}
              copyLabel={toolT.copyHtml}
              copiedLabel={common.copied}
            />
          </div>
          <div
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs min-h-[400px] overflow-auto dark:bg-input/30"
          >
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlOutput }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
