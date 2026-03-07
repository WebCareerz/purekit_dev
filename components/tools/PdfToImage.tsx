"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";

type PdfjsLib = typeof import("pdfjs-dist");

interface PdfToImageProps {
  t: Record<string, unknown>;
}

type OutputFormat = "png" | "jpeg";
type Scale = 1 | 2 | 3;

interface ConvertedPage {
  pageNum: number;
  dataUrl: string;
  name: string;
}

export default function PdfToImage({ t }: PdfToImageProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, unknown>>)[
    "pdf-to-image"
  ] as Record<string, string>;

  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [format, setFormat] = useState<OutputFormat>("png");
  const [scale, setScale] = useState<Scale>(2);
  const [converting, setConverting] = useState(false);
  const [convertingPage, setConvertingPage] = useState(0);
  const [results, setResults] = useState<ConvertedPage[]>([]);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfDataRef = useRef<ArrayBuffer | null>(null);
  const pdfjsRef = useRef<PdfjsLib | null>(null);

  const getPdfjs = useCallback(async () => {
    if (pdfjsRef.current) return pdfjsRef.current;
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;
    pdfjsRef.current = pdfjs;
    return pdfjs;
  }, []);

  const loadPdf = useCallback(
    async (selectedFile: File) => {
      setFile(selectedFile);
      setResults([]);
      setError("");
      setConvertingPage(0);

      try {
        const pdfjs = await getPdfjs();
        const arrayBuffer = await selectedFile.arrayBuffer();
        pdfDataRef.current = arrayBuffer;
        const pdf = await pdfjs.getDocument({ data: arrayBuffer.slice(0) }).promise;
        setPageCount(pdf.numPages);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setPageCount(0);
        pdfDataRef.current = null;
      }
    },
    [getPdfjs]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && droppedFile.type === "application/pdf") {
        loadPdf(droppedFile);
      }
    },
    [loadPdf]
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
        loadPdf(selected);
      }
      e.target.value = "";
    },
    [loadPdf]
  );

  const handleConvert = useCallback(async () => {
    if (!pdfDataRef.current || pageCount === 0) return;

    setConverting(true);
    setError("");
    setResults([]);

    try {
      const pdfjs = await getPdfjs();
      const pdf = await pdfjs.getDocument({ data: pdfDataRef.current!.slice(0) })
        .promise;
      const converted: ConvertedPage[] = [];
      const baseName = file?.name.replace(/\.pdf$/i, "") || "page";
      const ext = format === "jpeg" ? "jpg" : "png";
      const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";

      for (let i = 1; i <= pdf.numPages; i++) {
        setConvertingPage(i);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          throw new Error("Canvas context not available");
        }

        await page.render({ canvasContext: ctx, viewport, canvas }).promise;

        const dataUrl = canvas.toDataURL(mimeType, format === "jpeg" ? 0.92 : undefined);
        converted.push({
          pageNum: i,
          dataUrl,
          name: `${baseName}-page-${i}.${ext}`,
        });
      }

      setResults(converted);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setConverting(false);
      setConvertingPage(0);
    }
  }, [pageCount, file, format, scale]);

  const downloadImage = useCallback((item: ConvertedPage) => {
    const link = document.createElement("a");
    link.download = item.name;
    link.href = item.dataUrl;
    link.click();
  }, []);

  const downloadAll = useCallback(() => {
    for (const item of results) {
      const link = document.createElement("a");
      link.download = item.name;
      link.href = item.dataUrl;
      link.click();
    }
  }, [results]);

  const formatOptions = [
    { label: "PNG", value: "png" as OutputFormat },
    { label: "JPEG", value: "jpeg" as OutputFormat },
  ];

  const scaleOptions = [
    { label: "1x", value: 1 as Scale },
    { label: "2x", value: 2 as Scale },
    { label: "3x", value: 3 as Scale },
  ];

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
            {file.name} &middot; {pageCount} {toolT.pages}
          </p>
        )}
      </div>

      {/* Controls toolbar */}
      {file && pageCount > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border border-border rounded-lg px-4 py-3 bg-muted/30">
          {/* Format selector */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              {toolT.outputFormat}
            </label>
            <div>
              <SegmentedControl
                options={formatOptions}
                value={format}
                onChange={setFormat}
                size="sm"
              />
            </div>
          </div>

          {/* Scale selector */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              {toolT.scale}
            </label>
            <div>
              <SegmentedControl
                options={scaleOptions}
                value={scale}
                onChange={setScale}
                size="sm"
              />
            </div>
          </div>

          {/* Convert button */}
          <div className="sm:ml-auto">
            <Button onClick={handleConvert} size="sm" disabled={converting}>
              {toolT.convertAll}
            </Button>
          </div>
        </div>
      )}

      {/* Converting progress */}
      {converting && (
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
          <span>
            {toolT.convertingProgress
              .replace("{current}", String(convertingPage))
              .replace("{total}", String(pageCount))}
          </span>
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
        <div className="space-y-4">
          {/* Download All button */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {results.length} {toolT.imagesConverted}
            </p>
            <Button variant="outline" size="sm" onClick={downloadAll}>
              {toolT.downloadAll}
            </Button>
          </div>

          {/* Image preview grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((item) => (
              <div
                key={item.pageNum}
                className="border border-border rounded-lg overflow-hidden bg-muted/10"
              >
                <div className="p-2">
                  <img
                    src={item.dataUrl}
                    alt={`${toolT.page} ${item.pageNum}`}
                    className="w-full h-auto rounded object-contain"
                  />
                </div>
                <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/20">
                  <span className="text-xs font-medium text-muted-foreground">
                    {toolT.page} {item.pageNum}
                  </span>
                  <button
                    type="button"
                    onClick={() => downloadImage(item)}
                    className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={`${toolT.download} ${item.name}`}
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
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12M12 16.5V3"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
