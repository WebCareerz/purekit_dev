"use client";

import { useState, useRef, useCallback } from "react";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";

interface ImageCompressorProps {
  t: Record<string, unknown>;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ImageCompressor({ t }: ImageCompressorProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "image-compressor"
  ];

  const [file, setFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string>("");
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const compress = useCallback(async (f: File) => {
    setCompressing(true);
    setProgress(0);
    setError("");
    setCompressedFile(null);
    setCompressedUrl("");

    try {
      const result = await imageCompression(f, {
        maxSizeMB: 1,
        useWebWorker: true,
        onProgress: (p: number) => setProgress(p),
      });
      setCompressedFile(result);
      setCompressedUrl(URL.createObjectURL(result));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCompressing(false);
    }
  }, []);

  const handleFile = useCallback(
    (f: File) => {
      setFile(f);
      setCompressedFile(null);
      setCompressedUrl("");
      setError("");
      compress(f);
    },
    [compress]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && droppedFile.type.startsWith("image/")) {
        handleFile(droppedFile);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) {
        handleFile(selected);
      }
    },
    [handleFile]
  );

  const handleDownload = () => {
    if (!compressedFile || !compressedUrl) return;
    const link = document.createElement("a");
    link.download = compressedFile.name;
    link.href = compressedUrl;
    link.click();
  };

  const sizeChange =
    file && compressedFile
      ? (1 - compressedFile.size / file.size) * 100
      : null;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors ${
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
        <svg
          className="size-10 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        <p className="text-sm font-medium text-foreground">
          {toolT.dropzone}
        </p>
        <p className="text-xs text-muted-foreground">
          {toolT.supportedFormats}
        </p>
        {file && (
          <p className="text-sm text-muted-foreground mt-1">
            {file.name} ({formatFileSize(file.size)})
          </p>
        )}
      </div>

      {/* Progress bar */}
      {compressing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{toolT.compressing}</span>
            <span className="font-mono">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-sm px-3 py-1.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
          {common.error}: {error}
        </div>
      )}

      {/* Results */}
      {file && compressedFile && !compressing && (
        <div className="space-y-4">
          <div className="border border-border rounded-lg divide-y divide-border">
            <div className="p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {toolT.originalSize}
              </span>
              <span className="text-sm font-mono font-medium text-foreground">
                {formatFileSize(file.size)}
              </span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {toolT.compressedSize}
              </span>
              <span className="text-sm font-mono font-medium text-foreground">
                {formatFileSize(compressedFile.size)}
              </span>
            </div>
            {sizeChange !== null && (
              <div className="p-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {sizeChange > 0
                    ? toolT.sizeReduced
                    : sizeChange < 0
                      ? toolT.sizeIncreased
                      : toolT.sameSize}
                </span>
                <span
                  className={`text-sm font-mono font-medium ${
                    sizeChange > 0
                      ? "text-green-600 dark:text-green-400"
                      : sizeChange < 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground"
                  }`}
                >
                  {sizeChange !== 0
                    ? `${Math.abs(sizeChange).toFixed(1)}%`
                    : "—"}
                </span>
              </div>
            )}
          </div>

          {compressedUrl && (
            <div className="flex justify-center">
              <img
                src={compressedUrl}
                alt={file.name}
                className="max-w-full max-h-80 rounded-lg border border-border object-contain"
              />
            </div>
          )}

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
