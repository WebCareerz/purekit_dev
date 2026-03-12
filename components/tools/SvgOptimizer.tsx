"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import CopyButton from "./CopyButton";

interface SvgOptimizerProps {
  t: Record<string, unknown>;
}

export default function SvgOptimizer({ t }: SvgOptimizerProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "svg-optimizer"
  ];

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [removeComments, setRemoveComments] = useState(true);
  const [removeMetadata, setRemoveMetadata] = useState(true);
  const [removeHiddenElements, setRemoveHiddenElements] = useState(true);
  const [roundPrecision, setRoundPrecision] = useState(2);
  const [stats, setStats] = useState<{ original: number; optimized: number; saved: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const optimizeSvg = useCallback((svg: string): string => {
    let result = svg;

    // Remove XML declaration
    result = result.replace(/<\?xml[^?]*\?>/g, "");

    // Remove comments
    if (removeComments) {
      result = result.replace(/<!--[\s\S]*?-->/g, "");
    }

    // Remove metadata
    if (removeMetadata) {
      result = result.replace(/<metadata[\s\S]*?<\/metadata>/gi, "");
      result = result.replace(/<title[\s\S]*?<\/title>/gi, "");
      result = result.replace(/<desc[\s\S]*?<\/desc>/gi, "");
    }

    // Remove hidden elements
    if (removeHiddenElements) {
      result = result.replace(/<[^>]*display\s*=\s*["']none["'][^>]*>[\s\S]*?<\/[^>]+>/gi, "");
      result = result.replace(/<[^>]*visibility\s*=\s*["']hidden["'][^>]*>[\s\S]*?<\/[^>]+>/gi, "");
    }

    // Remove empty groups
    result = result.replace(/<g[\s]*><\/g>/g, "");
    result = result.replace(/<g[\s]*\/>/g, "");

    // Round numbers
    if (roundPrecision >= 0) {
      result = result.replace(/(\d+\.\d+)/g, (match) => {
        return parseFloat(match).toFixed(roundPrecision);
      });
    }

    // Remove unnecessary whitespace
    result = result.replace(/\s{2,}/g, " ");
    result = result.replace(/>\s+</g, "><");
    result = result.trim();

    // Remove empty attributes
    result = result.replace(/\s+[a-z-]+=""\s*/gi, " ");

    return result;
  }, [removeComments, removeMetadata, removeHiddenElements, roundPrecision]);

  const handleOptimize = useCallback(() => {
    if (!input.trim()) {
      setError(toolT.emptyInput);
      setOutput("");
      setStats(null);
      return;
    }

    try {
      // Validate SVG
      if (!input.includes("<svg")) {
        throw new Error(toolT.invalidSvg);
      }

      const optimized = optimizeSvg(input);
      const originalSize = new Blob([input]).size;
      const optimizedSize = new Blob([optimized]).size;
      const saved = ((1 - optimizedSize / originalSize) * 100);

      setOutput(optimized);
      setStats({
        original: originalSize,
        optimized: optimizedSize,
        saved: saved
      });
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : toolT.optimizeError);
      setOutput("");
      setStats(null);
    }
  }, [input, optimizeSvg, toolT]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setError("");
    setStats(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handlePaste = useCallback(async () => {
    const text = await navigator.clipboard.readText();
    setInput(text);
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setInput(text);
  }, []);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "optimized.svg";
    a.click();
    URL.revokeObjectURL(url);
  }, [output]);

  return (
    <div className="space-y-4">
      {/* Options */}
      <div className="border border-border rounded-lg p-3 bg-muted/30 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="removeComments"
              checked={removeComments}
              onCheckedChange={(checked) => setRemoveComments(checked as boolean)}
            />
            <Label htmlFor="removeComments" className="text-sm cursor-pointer">
              {toolT.removeComments}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="removeMetadata"
              checked={removeMetadata}
              onCheckedChange={(checked) => setRemoveMetadata(checked as boolean)}
            />
            <Label htmlFor="removeMetadata" className="text-sm cursor-pointer">
              {toolT.removeMetadata}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="removeHidden"
              checked={removeHiddenElements}
              onCheckedChange={(checked) => setRemoveHiddenElements(checked as boolean)}
            />
            <Label htmlFor="removeHidden" className="text-sm cursor-pointer">
              {toolT.removeHiddenElements}
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="precision" className="text-sm">
              {toolT.precision}:
            </Label>
            <Input
              id="precision"
              type="number"
              min="0"
              max="5"
              value={roundPrecision}
              onChange={(e) => setRoundPrecision(parseInt(e.target.value) || 0)}
              className="w-20 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 border border-border rounded-lg px-3 py-2 bg-muted/30">
        <div className="flex items-center gap-2">
          <Button onClick={handleOptimize} size="sm">
            {toolT.optimize}
          </Button>
          {output && (
            <Button onClick={handleDownload} size="sm" variant="secondary">
              {toolT.downloadSvg}
            </Button>
          )}
        </div>

        <div className="h-5 w-px bg-border hidden sm:block" />

        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            accept=".svg,image/svg+xml"
            className="w-[180px] text-sm"
          />
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
            <div className="text-muted-foreground">{toolT.optimized}</div>
            <div className="font-semibold">{(stats.optimized / 1024).toFixed(2)} KB</div>
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
            <label className="text-sm font-medium">{toolT.svgInput}</label>
            <span className="text-xs text-muted-foreground">
              {input.length} {toolT.characters}
            </span>
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={toolT.svgPlaceholder}
            className="font-mono text-sm min-h-[200px] sm:min-h-[400px]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{toolT.optimizedOutput}</label>
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
