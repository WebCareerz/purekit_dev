"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface FaviconGeneratorProps {
  t: Record<string, unknown>;
}

const SIZES = [16, 32, 48, 180, 512];

export default function FaviconGenerator({ t }: FaviconGeneratorProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)["favicon-generator"];

  const [text, setText] = useState("🚀");
  const [bgColor, setBgColor] = useState("#3b82f6");
  const [fontSize, setFontSize] = useState(80);
  const [borderRadius, setBorderRadius] = useState(20);
  const [previews, setPreviews] = useState<{ [key: number]: string }>({});
  const [htmlCode, setHtmlCode] = useState("");
  const canvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});

  const generateFavicon = useCallback(() => {
    const newPreviews: { [key: number]: string } = {};

    SIZES.forEach((size) => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background
      ctx.fillStyle = bgColor;
      if (borderRadius > 0) {
        const radius = (size * borderRadius) / 100;
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(size - radius, 0);
        ctx.quadraticCurveTo(size, 0, size, radius);
        ctx.lineTo(size, size - radius);
        ctx.quadraticCurveTo(size, size, size - radius, size);
        ctx.lineTo(radius, size);
        ctx.quadraticCurveTo(0, size, 0, size - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(0, 0, size, size);
      }

      // Text
      const textSize = (size * fontSize) / 100;
      ctx.font = `${textSize}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(text, size / 2, size / 2);

      newPreviews[size] = canvas.toDataURL("image/png");
      canvasRefs.current[size] = canvas;
    });

    setPreviews(newPreviews);

    // Generate HTML meta tags
    const html = `<!-- Favicon Meta Tags -->
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="512x512" href="/favicon-512x512.png">`;
    setHtmlCode(html);
  }, [text, bgColor, fontSize, borderRadius]);

  useEffect(() => {
    generateFavicon();
  }, [generateFavicon]);

  const downloadSingle = (size: number) => {
    const canvas = canvasRefs.current[size];
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `favicon-${size}x${size}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const downloadAll = async () => {
    // Download as ZIP would require jszip library
    // For simplicity, download all individually
    for (const size of SIZES) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      downloadSingle(size);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{toolT.text}</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={toolT.textPlaceholder}
              maxLength={4}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground">{toolT.textHint}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{toolT.backgroundColor}</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-20 h-10 p-1 cursor-pointer rounded-md border border-input"
              />
              <input
                type="text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                placeholder="#3b82f6"
                className="flex-1 font-mono flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {toolT.fontSize}: {fontSize}%
            </label>
            <input
              type="range"
              min="20"
              max="120"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {toolT.borderRadius}: {borderRadius}%
            </label>
            <input
              type="range"
              min="0"
              max="50"
              value={borderRadius}
              onChange={(e) => setBorderRadius(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <label className="text-sm font-medium">{toolT.preview}</label>
          <div className="flex flex-wrap gap-4 items-end">
            {SIZES.map((size) => (
              <div key={size} className="flex flex-col items-center gap-1">
                <div
                  style={{
                    width: Math.min(size, 64),
                    height: Math.min(size, 64),
                    backgroundImage: `url(${previews[size]})`,
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                  }}
                />
                <span className="text-xs text-muted-foreground">{size}×{size}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Download Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={downloadAll} variant="default">
          {toolT.downloadAll}
        </Button>
        {SIZES.map((size) => (
          <Button
            key={size}
            onClick={() => downloadSingle(size)}
            variant="outline"
            size="sm"
          >
            {size}×{size}
          </Button>
        ))}
      </div>

      {/* HTML Code */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{toolT.htmlMetaTags}</label>
        <Textarea
          value={htmlCode}
          readOnly
          className="font-mono text-sm min-h-[150px] resize-none bg-muted/50"
          onClick={(e) => e.currentTarget.select()}
        />
        <p className="text-xs text-muted-foreground">{toolT.htmlHint}</p>
      </div>
    </div>
  );
}
