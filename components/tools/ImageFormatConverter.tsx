"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";

interface ImageFormatConverterProps {
  t: Record<string, unknown>;
}

type OutputFormat = "png" | "jpeg" | "webp";

const allFormats: OutputFormat[] = ["png", "jpeg", "webp"];

interface ConversionResult {
  originalUrl: string;
  convertedUrl: string;
  originalSize: number;
  convertedSize: number;
  fileName: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function detectFormat(file: File): OutputFormat | null {
  const type = file.type.toLowerCase();
  if (type === "image/png") return "png";
  if (type === "image/jpeg" || type === "image/jpg") return "jpeg";
  if (type === "image/webp") return "webp";
  return null;
}

function pickDefaultOutput(inputFormat: OutputFormat | null): OutputFormat {
  if (!inputFormat) return "png";
  // Pick a different format from the input
  const preferred: Record<OutputFormat, OutputFormat> = {
    png: "webp",
    jpeg: "webp",
    webp: "png",
  };
  return preferred[inputFormat];
}

export default function ImageFormatConverter({
  t,
}: ImageFormatConverterProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "image-format-converter"
  ];

  const [file, setFile] = useState<File | null>(null);
  const [inputFormat, setInputFormat] = useState<OutputFormat | null>(null);
  const [format, setFormat] = useState<OutputFormat>("webp");
  const [quality, setQuality] = useState(0.9);
  const [converting, setConverting] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatOptions = allFormats
    .filter((f) => f !== inputFormat)
    .map((f) => ({
      label: f === "jpeg" ? "JPEG" : f.toUpperCase(),
      value: f,
    }));

  const showQuality = format === "jpeg" || format === "webp";

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    setError("");
    const detected = detectFormat(selectedFile);
    setInputFormat(detected);
    setFormat(pickDefaultOutput(detected));
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) handleFileSelect(selected);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const dropped = e.dataTransfer.files?.[0];
      if (dropped && dropped.type.startsWith("image/")) {
        handleFileSelect(dropped);
      }
    },
    [handleFileSelect]
  );

  const handleConvert = useCallback(() => {
    if (!file) return;

    setConverting(true);
    setError("");
    setResult(null);

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setError(common.error);
          setConverting(false);
          URL.revokeObjectURL(objectUrl);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const mimeType = `image/${format}`;
        const qualityValue = showQuality ? quality : undefined;

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              setError(common.error);
              setConverting(false);
              URL.revokeObjectURL(objectUrl);
              return;
            }

            const convertedUrl = URL.createObjectURL(blob);
            const baseName = file.name.replace(/\.[^.]+$/, "");
            const ext = format === "jpeg" ? "jpg" : format;

            setResult({
              originalUrl: objectUrl,
              convertedUrl,
              originalSize: file.size,
              convertedSize: blob.size,
              fileName: `${baseName}.${ext}`,
            });
            setConverting(false);
          },
          mimeType,
          qualityValue
        );
      } catch {
        setError(common.error);
        setConverting(false);
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onerror = () => {
      setError(common.error);
      setConverting(false);
      URL.revokeObjectURL(objectUrl);
    };

    img.src = objectUrl;
  }, [file, format, quality, showQuality, common.error]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const link = document.createElement("a");
    link.download = result.fileName;
    link.href = result.convertedUrl;
    link.click();
  }, [result]);

  const sizeChange = result && result.originalSize > 0
    ? ((result.originalSize - result.convertedSize) / result.originalSize) * 100
    : null;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div className="space-y-2">
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors
            ${
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
            }
          `}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
          <span className="text-sm text-muted-foreground">
            {toolT.dropzone}
          </span>
          <span className="text-xs text-muted-foreground/70">
            {toolT.supportedFormats}
          </span>
          {file && (
            <span className="text-sm font-medium text-foreground mt-1">
              {file.name} ({formatFileSize(file.size)})
            </span>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* Format selection */}
      {file && (
        <div className="space-y-2">
          <label className="text-sm font-medium">{toolT.outputFormat}</label>
          <div>
            <SegmentedControl
              options={formatOptions}
              value={format}
              onChange={setFormat}
            />
          </div>
        </div>
      )}

      {/* Quality slider */}
      {file && showQuality && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {toolT.quality}: {Math.round(quality * 100)}%
          </label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={quality}
            onChange={(e) => setQuality(parseFloat(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>10%</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {/* Convert button */}
      {file && (
        <div className="flex items-center gap-3 border border-border rounded-lg px-3 py-2 bg-muted/30">
          <Button onClick={handleConvert} size="sm" disabled={converting}>
            {toolT.convert}
          </Button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-sm px-3 py-1.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
          {common.error}: {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Side by side previews */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{toolT.originalSize}</label>
              <div className="border border-border rounded-lg overflow-hidden bg-muted/10">
                <img
                  src={result.originalUrl}
                  alt="Original"
                  className="w-full h-auto max-h-64 object-contain"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {formatFileSize(result.originalSize)}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{toolT.convertedSize}</label>
              <div className="border border-border rounded-lg overflow-hidden bg-muted/10">
                <img
                  src={result.convertedUrl}
                  alt="Converted"
                  className="w-full h-auto max-h-64 object-contain"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {formatFileSize(result.convertedSize)}
              </div>
            </div>
          </div>

          {/* Size change info */}
          {sizeChange !== null && (
            <div
              className={`text-sm px-3 py-1.5 rounded-md ${
                sizeChange > 0
                  ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                  : sizeChange < 0
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {sizeChange > 0
                ? `${toolT.sizeReduced} ${sizeChange.toFixed(1)}%`
                : sizeChange < 0
                  ? `${toolT.sizeIncreased} ${Math.abs(sizeChange).toFixed(1)}%`
                  : toolT.sameSize}
            </div>
          )}

          {/* Download */}
          <div className="flex justify-center">
            <Button variant="outline" onClick={handleDownload}>
              {toolT.downloadImage}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
