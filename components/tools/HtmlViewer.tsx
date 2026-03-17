"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Code } from "lucide-react";

interface HtmlViewerProps {
  t: Record<string, unknown>;
}

export default function HtmlViewer({ t }: HtmlViewerProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "html-viewer"
  ];

  const [input, setInput] = useState("");
  const [autoPreview, setAutoPreview] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const updatePreview = useCallback(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(input);
        doc.close();
      }
    }
  }, [input]);

  useEffect(() => {
    if (autoPreview) {
      const timer = setTimeout(() => {
        updatePreview();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [input, autoPreview, updatePreview]);

  const handleClear = useCallback(() => {
    setInput("");
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write("");
        doc.close();
      }
    }
  }, []);

  const handlePaste = useCallback(async () => {
    const text = await navigator.clipboard.readText();
    setInput(text);
  }, []);

  const loadTemplate = useCallback((template: "basic" | "styled" | "interactive") => {
    if (template === "basic") {
      setInput(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Page</title>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>This is a basic HTML template.</p>
</body>
</html>`);
    } else if (template === "styled") {
      setInput(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Styled Page</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background: #f5f5f5;
    }
    .card {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 { color: #333; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Styled Card</h1>
    <p>This template includes basic CSS styling.</p>
  </div>
</body>
</html>`);
    } else if (template === "interactive") {
      setInput(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interactive Page</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; }
    button { padding: 0.5rem 1rem; cursor: pointer; }
  </style>
</head>
<body>
  <h1>Click Counter</h1>
  <p>Count: <span id="count">0</span></p>
  <button onclick="increment()">Click Me!</button>
  
  <script>
    let count = 0;
    function increment() {
      count++;
      document.getElementById('count').textContent = count;
    }
  </script>
</body>
</html>`);
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Templates & Toolbar */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground">{toolT.templates}:</span>
        <Button onClick={() => loadTemplate("basic")} size="sm" variant="outline">
          {toolT.basicHtml}
        </Button>
        <Button onClick={() => loadTemplate("styled")} size="sm" variant="outline">
          {toolT.styledHtml}
        </Button>
        <Button onClick={() => loadTemplate("interactive")} size="sm" variant="outline">
          {toolT.interactiveHtml}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 border border-border rounded-lg px-3 py-2 bg-muted/30">
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setAutoPreview(!autoPreview)} 
            size="sm"
            variant={autoPreview ? "default" : "outline"}
          >
            <Eye className="h-4 w-4 mr-1.5" />
            {toolT.autoPreview}
          </Button>
          {!autoPreview && (
            <Button onClick={updatePreview} size="sm" variant="secondary">
              {toolT.updatePreview}
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

      {/* Editor & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-muted-foreground" />
            <label className="text-sm font-medium">{toolT.htmlCode}</label>
            <span className="text-xs text-muted-foreground">
              {input.length} {toolT.characters}
            </span>
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={toolT.htmlPlaceholder}
            className="font-mono text-sm min-h-[400px] sm:min-h-[500px]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <label className="text-sm font-medium">{toolT.livePreview}</label>
          </div>
          <div className="border border-border rounded-lg overflow-hidden bg-background min-h-[400px] sm:min-h-[500px]">
            <iframe
              ref={iframeRef}
              className="w-full h-full"
              sandbox="allow-scripts"
              title="HTML Preview"
            />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-muted-foreground border border-border rounded-lg p-3 bg-muted/30">
        ⚠️ {toolT.securityNote}
      </div>
    </div>
  );
}
