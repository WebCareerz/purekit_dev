"use client";

import { useState, useRef, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";

interface PdfCompressProps {
  t: Record<string, unknown>;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function PdfCompress({ t }: PdfCompressProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "pdf-compress"
  ];

  const [file, setFile] = useState<File | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [compressedUrl, setCompressedUrl] = useState<string>("");
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const compress = useCallback(async (f: File) => {
    setCompressing(true);
    setError("");
    setCompressedUrl("");
    setCompressedSize(0);

    try {
      const bytes = await f.arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const savedBytes = await pdf.save();
      const blob = new Blob([new Uint8Array(savedBytes)], { type: "application/pdf" });
      setCompressedSize(blob.size);
      const url = URL.createObjectURL(blob);
      setCompressedUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCompressing(false);
    }
  }, []);

  const handleFile = useCallback(
    (f: File) => {
      setFile(f);
      setOriginalSize(f.size);
      setCompressedUrl("");
      setCompressedSize(0);
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
      if (droppedFile && droppedFile.type === "application/pdf") {
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
      e.target.value = "";
    },
    [handleFile]
  );

  const handleDownload = useCallback(() => {
    if (!compressedUrl || !file) return;
    const link = document.createElement("a");
    const nameWithoutExt = file.name.replace(/\.pdf$/i, "");
    link.download = `${nameWithoutExt}-compressed.pdf`;
    link.href = compressedUrl;
    link.click();
  }, [compressedUrl, file]);

  const sizeChange =
    originalSize > 0 && compressedSize > 0
      ? (1 - compressedSize / originalSize) * 100
      : null;

  const done = !compressing && compressedUrl && file;

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
          accept="application/pdf"
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

      {/* Compressing indicator */}
      {compressing && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <svg
            className="size-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>{toolT.compressing}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-sm px-3 py-1.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
          {common.error}: {error}
        </div>
      )}

      {/* Results */}
      {done && (
        <div className="space-y-4">
          <div className="border border-border rounded-lg divide-y divide-border">
            <div className="p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {toolT.originalSize}
              </span>
              <span className="text-sm font-mono font-medium text-foreground">
                {formatFileSize(originalSize)}
              </span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {toolT.compressedSize}
              </span>
              <span className="text-sm font-mono font-medium text-foreground">
                {formatFileSize(compressedSize)}
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
                    : "\u2014"}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <Button variant="outline" onClick={handleDownload}>
              {toolT.download}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
