"use client";

import { useState, useMemo, useCallback } from "react";
import { marked } from "marked";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import CopyButton from "./CopyButton";

interface MarkdownToHtmlProps {
  t: Record<string, unknown>;
}

marked.setOptions({
  breaks: true,
  gfm: true,
});

const defaultMarkdown = `# Hello World

This is a **Markdown to HTML** converter.

## Features

- Supports **bold**, *italic*, ~~strikethrough~~
- [Links](https://example.com)
- Images, tables, and more

### Code Block

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

### Table

| Name | Role |
|------|------|
| Alice | Developer |
| Bob | Designer |

### Task List

- [x] Convert Markdown
- [x] Preview HTML
- [ ] Export file

> This is a blockquote.
`;

export default function MarkdownToHtml({ t }: MarkdownToHtmlProps) {
  const toolT = (t.tools as Record<string, Record<string, string>>)["markdown-to-html"];
  const common = t.common as Record<string, string>;

  const [input, setInput] = useState(defaultMarkdown);
  const [viewMode, setViewMode] = useState<"preview" | "source">("preview");

  const htmlOutput = useMemo(() => {
    if (!input.trim()) return "";
    return marked.parse(input) as string;
  }, [input]);

  const handleDownload = useCallback(() => {
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #333; }
    pre { background: #f6f8fa; padding: 1rem; border-radius: 6px; overflow-x: auto; }
    code { font-family: "SF Mono", Consolas, monospace; font-size: 0.9em; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 1rem; color: #666; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f6f8fa; }
    img { max-width: 100%; }
  </style>
</head>
<body>
${htmlOutput}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "markdown-export.html";
    a.click();
    URL.revokeObjectURL(url);
  }, [htmlOutput]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Markdown Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{toolT.markdownInput}</label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={toolT.inputPlaceholder}
            className="font-mono text-sm min-h-[200px] sm:min-h-[500px] resize-y"
            spellCheck={false}
          />
        </div>

        {/* HTML Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <Button
                variant={viewMode === "preview" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("preview")}
              >
                {toolT.preview}
              </Button>
              <Button
                variant={viewMode === "source" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("source")}
              >
                {toolT.htmlSource}
              </Button>
            </div>
            <div className="flex gap-1">
              <CopyButton text={htmlOutput} copyLabel={common.copy} copiedLabel={common.copied} />
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={!htmlOutput}>
                {toolT.downloadHtml}
              </Button>
            </div>
          </div>

          {viewMode === "preview" ? (
            <div
              className="border rounded-lg p-4 min-h-[200px] sm:min-h-[500px] overflow-auto prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlOutput }}
            />
          ) : (
            <Textarea
              value={htmlOutput}
              readOnly
              className="font-mono text-sm min-h-[200px] sm:min-h-[500px] resize-y"
            />
          )}
        </div>
      </div>
    </div>
  );
}
