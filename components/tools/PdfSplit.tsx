"use client";

import { useState, useRef, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";

interface PdfSplitProps {
  t: Record<string, unknown>;
}

interface PdfSource {
  name: string;
  size: number;
  pageCount: number;
  bytes: ArrayBuffer;
}

interface SplitResult {
  name: string;
  url: string;
  pageNumbers: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function parsePageRange(input: string, totalPages: number): number[] {
  const pages = new Set<number>();
  const parts = input.split(",").map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      if (start >= 1 && end <= totalPages && start <= end) {
        for (let i = start; i <= end; i++) {
          pages.add(i - 1); // convert to 0-indexed
        }
      }
    } else {
      const num = parseInt(part, 10);
      if (num >= 1 && num <= totalPages) {
        pages.add(num - 1); // convert to 0-indexed
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

export default function PdfSplit({ t }: PdfSplitProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "pdf-split"
  ];

  const [source, setSource] = useState<PdfSource | null>(null);
  const [pageRangeInput, setPageRangeInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<SplitResult[]>([]);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const cleanupResults = useCallback(() => {
    for (const result of results) {
      URL.revokeObjectURL(result.url);
    }
    setResults([]);
  }, [results]);

  const processFile = useCallback(
    async (file: File) => {
      setError("");
      cleanupResults();

      if (file.type !== "application/pdf") {
        setError(toolT.invalidFormat);
        return;
      }

      try {
        const bytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
        setSource({
          name: file.name,
          size: file.size,
          pageCount: pdf.getPageCount(),
          bytes,
        });
        setPageRangeInput("");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [cleanupResults, toolT.invalidFormat]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
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
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = "";
    },
    [processFile]
  );

  const handleExtractSelected = useCallback(async () => {
    if (!source) return;

    const indices = parsePageRange(pageRangeInput, source.pageCount);
    if (indices.length === 0) {
      setError(toolT.noValidPages);
      return;
    }

    setProcessing(true);
    setError("");
    cleanupResults();

    try {
      const srcDoc = await PDFDocument.load(source.bytes, {
        ignoreEncryption: true,
      });
      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(srcDoc, indices);
      for (const page of copiedPages) {
        newPdf.addPage(page);
      }
      const pdfBytes = await newPdf.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const pageLabel = indices.map((i) => i + 1).join(", ");
      const baseName = source.name.replace(/\.pdf$/i, "");

      setResults([
        {
          name: `${baseName}_pages_${indices.map((i) => i + 1).join("-")}.pdf`,
          url,
          pageNumbers: pageLabel,
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setProcessing(false);
    }
  }, [source, pageRangeInput, cleanupResults, toolT.noValidPages]);

  const handleExtractAll = useCallback(async () => {
    if (!source) return;

    setProcessing(true);
    setError("");
    cleanupResults();

    try {
      const srcDoc = await PDFDocument.load(source.bytes, {
        ignoreEncryption: true,
      });
      const newResults: SplitResult[] = [];
      const baseName = source.name.replace(/\.pdf$/i, "");

      for (let i = 0; i < source.pageCount; i++) {
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(srcDoc, [i]);
        newPdf.addPage(copiedPage);
        const pdfBytes = await newPdf.save();
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        newResults.push({
          name: `${baseName}_page_${i + 1}.pdf`,
          url,
          pageNumbers: String(i + 1),
        });
      }

      setResults(newResults);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setProcessing(false);
    }
  }, [source, cleanupResults]);

  const handleDownloadSingle = useCallback((result: SplitResult) => {
    const link = document.createElement("a");
    link.download = result.name;
    link.href = result.url;
    link.click();
  }, []);

  const handleDownloadAll = useCallback(() => {
    for (const result of results) {
      const link = document.createElement("a");
      link.download = result.name;
      link.href = result.url;
      link.click();
    }
  }, [results]);

  const handleReset = useCallback(() => {
    cleanupResults();
    setSource(null);
    setPageRangeInput("");
    setError("");
  }, [cleanupResults]);

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {!source && (
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
        </div>
      )}

      {/* File info after upload */}
      {source && (
        <div className="space-y-4">
          {/* Source file card */}
          <div className="border border-border rounded-lg p-4 flex items-center gap-3">
            {/* PDF icon */}
            <svg
              className="size-8 shrink-0 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {source.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(source.size)} &middot; {source.pageCount}{" "}
                {toolT.pages}
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="p-1 rounded text-muted-foreground hover:text-red-500 transition-colors shrink-0"
              aria-label={common.reset}
            >
              <svg
                className="size-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Page range input */}
          <div className="space-y-1.5">
            <label
              htmlFor="page-range"
              className="text-sm font-medium text-foreground"
            >
              {toolT.pageRangeLabel}
            </label>
            <input
              id="page-range"
              type="text"
              value={pageRangeInput}
              onChange={(e) => setPageRangeInput(e.target.value)}
              placeholder={toolT.pageRangePlaceholder}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              {toolT.pageRangeHint}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleExtractSelected}
              disabled={processing || !pageRangeInput.trim()}
              className="flex-1"
            >
              {processing ? toolT.processing : toolT.extractSelected}
            </Button>
            <Button
              variant="outline"
              onClick={handleExtractAll}
              disabled={processing}
              className="flex-1"
            >
              {processing ? toolT.processing : toolT.extractAll}
            </Button>
          </div>
        </div>
      )}

      {/* Processing indicator */}
      {processing && (
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
          <span>{toolT.processing}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-sm px-3 py-1.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
          {common.error}: {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            {toolT.results} ({results.length})
          </p>

          <div className="border border-border rounded-lg divide-y divide-border">
            {results.map((result, index) => (
              <div
                key={index}
                className="p-3 flex items-center gap-3"
              >
                {/* PDF icon */}
                <svg
                  className="size-8 shrink-0 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>

                {/* Result info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {result.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {toolT.pageLabel}: {result.pageNumbers}
                  </p>
                </div>

                {/* Download button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadSingle(result)}
                >
                  {toolT.download}
                </Button>
              </div>
            ))}
          </div>

          {/* Download All button */}
          {results.length > 1 && (
            <div className="flex justify-center">
              <Button onClick={handleDownloadAll}>
                {toolT.downloadAll}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
