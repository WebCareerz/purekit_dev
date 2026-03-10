"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface PlaceholderImageGeneratorProps {
  t: Record<string, unknown>;
}

interface Preset {
  label: string;
  width: number;
  height: number;
}

const presets: Preset[] = [
  { label: "Avatar (150×150)", width: 150, height: 150 },
  { label: "Thumbnail (300×200)", width: 300, height: 200 },
  { label: "Medium Rectangle (300×250)", width: 300, height: 250 },
  { label: "Leaderboard (728×90)", width: 728, height: 90 },
  { label: "OG Image (1200×630)", width: 1200, height: 630 },
  { label: "Twitter Card (1200×675)", width: 1200, height: 675 },
  { label: "Instagram Post (1080×1080)", width: 1080, height: 1080 },
  { label: "HD (1920×1080)", width: 1920, height: 1080 },
  { label: "Mobile (375×667)", width: 375, height: 667 },
  { label: "Favicon (32×32)", width: 32, height: 32 },
];

export default function PlaceholderImageGenerator({ t }: PlaceholderImageGeneratorProps) {
  const toolT = (t.tools as Record<string, Record<string, string>>)["placeholder-image-generator"];
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [bgColor, setBgColor] = useState("#cccccc");
  const [textColor, setTextColor] = useState("#666666");
  const [text, setText] = useState("");
  const [format, setFormat] = useState<"png" | "webp" | "svg">("png");

  const displayText = text || `${width} × ${height}`;

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    const fontSize = Math.max(12, Math.min(width, height) / 8);
    ctx.fillStyle = textColor;
    ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(displayText, width / 2, height / 2, width * 0.9);
  }, [width, height, bgColor, textColor, displayText]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const generateSvg = useCallback(() => {
    const fontSize = Math.max(12, Math.min(width, height) / 8);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="${bgColor}"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${textColor}">${displayText}</text>
</svg>`;
  }, [width, height, bgColor, textColor, displayText]);

  const handleDownload = useCallback(() => {
    if (format === "svg") {
      const svg = generateSvg();
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `placeholder-${width}x${height}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const mimeType = format === "webp" ? "image/webp" : "image/png";
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `placeholder-${width}x${height}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    }, mimeType);
  }, [format, width, height, generateSvg]);

  const applyPreset = (preset: Preset) => {
    setWidth(preset.width);
    setHeight(preset.height);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{toolT.width}</label>
              <input
                type="number"
                min={1}
                max={4096}
                value={width}
                onChange={(e) => setWidth(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{toolT.height}</label>
              <input
                type="number"
                min={1}
                max={4096}
                value={height}
                onChange={(e) => setHeight(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{toolT.bgColor}</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-10 h-9 rounded border cursor-pointer"
                />
                <input
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm font-mono transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{toolT.textColor}</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-10 h-9 rounded border cursor-pointer"
                />
                <input
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm font-mono transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{toolT.customText}</label>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`${width} × ${height}`}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Format */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{toolT.format}</label>
            <div className="flex gap-2">
              {(["png", "webp", "svg"] as const).map((f) => (
                <Button
                  key={f}
                  variant={format === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormat(f)}
                >
                  {f.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          {/* Download */}
          <Button onClick={handleDownload} className="w-full">
            {toolT.download}
          </Button>
        </div>

        {/* Presets */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{toolT.presets}</label>
          <div className="grid grid-cols-1 gap-1.5">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                className="justify-start text-left h-auto py-1.5 px-3"
                onClick={() => applyPreset(preset)}
              >
                <span className="font-mono text-xs text-muted-foreground w-24 shrink-0">
                  {preset.width}×{preset.height}
                </span>
                <span className="text-xs truncate">{preset.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{toolT.preview}</label>
        <div className="border rounded-lg p-4 bg-muted/30 flex items-center justify-center overflow-auto">
          <canvas
            ref={canvasRef}
            style={{
              maxWidth: "100%",
              height: "auto",
              border: "1px solid hsl(var(--border))",
            }}
          />
        </div>
      </div>
    </div>
  );
}
