"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface GeminiWatermarkRemoverProps {
  t: Record<string, unknown>;
}

interface ImageItem {
  id: string;
  file: File;
  originalUrl: string;
  resultUrl: string;
  status: "pending" | "processing" | "done" | "error";
  error: string;
  meta: Record<string, unknown> | null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

let idCounter = 0;

export default function GeminiWatermarkRemover({ t }: GeminiWatermarkRemoverProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "gemini-watermark-remover"
  ];

  const [items, setItems] = useState<ImageItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const engineRef = useRef<unknown>(null);

  const getEngine = useCallback(async () => {
    if (engineRef.current) return engineRef.current;
    const { createWatermarkEngine } = await import(
      "@/lib/gemini-watermark-remover/sdk/browser.js"
    );
    const engine = await createWatermarkEngine();
    engineRef.current = engine;
    return engine;
  }, []);

  const processOne = useCallback(async (item: ImageItem) => {
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = item.originalUrl;
      });

      const { removeWatermarkFromImage } = await import(
        "@/lib/gemini-watermark-remover/sdk/browser.js"
      );

      const engine = await getEngine();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { canvas, meta } = await removeWatermarkFromImage(img, { engine } as any);

      const htmlCanvas = canvas as HTMLCanvasElement | OffscreenCanvas;
      let blob: Blob | null = null;
      if (htmlCanvas instanceof OffscreenCanvas) {
        blob = await htmlCanvas.convertToBlob({ type: "image/png" });
      } else {
        blob = await new Promise<Blob | null>((resolve) =>
          (htmlCanvas as HTMLCanvasElement).toBlob(resolve, "image/png")
        );
      }
      if (!blob) throw new Error("Failed to create output image");

      return {
        resultUrl: URL.createObjectURL(blob),
        meta: meta as Record<string, unknown> | null,
      };
    } catch (e) {
      throw e;
    }
  }, [getEngine]);

  const processFiles = useCallback(
    async (files: File[]) => {
      const newItems: ImageItem[] = files.map((f) => ({
        id: `img-${++idCounter}`,
        file: f,
        originalUrl: URL.createObjectURL(f),
        resultUrl: "",
        status: "pending" as const,
        error: "",
        meta: null,
      }));

      setItems((prev) => [...prev, ...newItems]);

      if (newItems.length === 1) {
        setExpandedId(newItems[0].id);
      }

      for (const item of newItems) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: "processing" } : i))
        );

        try {
          const result = await processOne(item);
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? { ...i, status: "done", resultUrl: result.resultUrl, meta: result.meta }
                : i
            )
          );
        } catch (e) {
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? { ...i, status: "error", error: e instanceof Error ? e.message : String(e) }
                : i
            )
          );
        }
      }
    },
    [processOne]
  );

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const imageFiles = Array.from(fileList).filter((f) =>
        f.type.startsWith("image/")
      );
      if (imageFiles.length > 0) processFiles(imageFiles);
    },
    [processFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
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
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
        e.target.value = "";
      }
    },
    [handleFiles]
  );

  const handleDownload = (item: ImageItem) => {
    if (!item.resultUrl) return;
    const baseName = item.file.name.replace(/\.[^.]+$/, "");
    const link = document.createElement("a");
    link.download = `${baseName}-no-watermark.png`;
    link.href = item.resultUrl;
    link.click();
  };

  const [zipping, setZipping] = useState(false);

  const handleDownloadAll = async () => {
    const doneItems = items.filter((i) => i.status === "done" && i.resultUrl);
    if (doneItems.length === 0) return;

    setZipping(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      await Promise.all(
        doneItems.map(async (item) => {
          const res = await fetch(item.resultUrl);
          const blob = await res.blob();
          const baseName = item.file.name.replace(/\.[^.]+$/, "");
          zip.file(`${baseName}-no-watermark.png`, blob);
        })
      );

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.download = "watermark-removed.zip";
      link.href = URL.createObjectURL(zipBlob);
      link.click();
      URL.revokeObjectURL(link.href);
    } finally {
      setZipping(false);
    }
  };

  const handleRemove = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
    if (expandedId === id) setExpandedId(null);
  };

  const handleClearAll = () => {
    items.forEach((item) => {
      if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
      if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
    });
    setItems([]);
    setExpandedId(null);
  };

  const totalCount = items.length;
  const doneCount = items.filter((i) => i.status === "done").length;
  const processingCount = items.filter((i) => i.status === "processing" || i.status === "pending").length;

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
          accept="image/jpeg,image/png,image/webp"
          multiple
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

      {/* Batch toolbar */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {processingCount > 0
              ? toolT.batchProgress
                  .replace("{done}", String(doneCount))
                  .replace("{total}", String(totalCount))
              : toolT.batchComplete.replace("{total}", String(totalCount))}
          </span>
          <div className="flex items-center gap-2">
            {doneCount > 1 && (
              <Button variant="outline" size="sm" onClick={handleDownloadAll} disabled={zipping}>
                {zipping ? toolT.zipping : toolT.downloadAll}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleClearAll}>
              {toolT.clearAll}
            </Button>
          </div>
        </div>
      )}

      {/* Progress bar for batch */}
      {processingCount > 0 && totalCount > 1 && (
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${(doneCount / totalCount) * 100}%` }}
          />
        </div>
      )}

      {/* Image list */}
      <div className="space-y-3">
        {items.map((item) => {
          const applied = item.meta?.applied === true;
          const isExpanded = expandedId === item.id;

          return (
            <div
              key={item.id}
              className="border border-border rounded-lg overflow-hidden"
            >
              {/* Row header */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                {/* Thumbnail */}
                <img
                  src={item.resultUrl || item.originalUrl}
                  alt={item.file.name}
                  className="size-12 rounded object-cover flex-shrink-0 border border-border"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(item.file.size)}
                  </p>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.status === "processing" && (
                    <svg className="size-4 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {item.status === "pending" && (
                    <span className="text-xs text-muted-foreground">{toolT.pending}</span>
                  )}
                  {item.status === "done" && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      applied
                        ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                    }`}>
                      {applied ? toolT.removed : toolT.notFound}
                    </span>
                  )}
                  {item.status === "error" && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
                      {common.error}
                    </span>
                  )}

                  {item.status === "done" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(item);
                      }}
                    >
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(item.id);
                    }}
                  >
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>

                  {/* Expand chevron */}
                  <svg
                    className={`size-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && item.status === "done" && (
                <div className="border-t border-border p-4 space-y-4">
                  {/* Before / After */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{toolT.before}</p>
                      <div className="border border-border rounded-lg overflow-hidden bg-muted/20">
                        <img
                          src={item.originalUrl}
                          alt="Original"
                          className="w-full h-auto max-h-80 object-contain"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{toolT.after}</p>
                      <div className="border border-border rounded-lg overflow-hidden bg-muted/20">
                        <img
                          src={item.resultUrl}
                          alt="Processed"
                          className="w-full h-auto max-h-80 object-contain"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Meta info */}
                  {item.meta && applied && (
                    <div className="border border-border rounded-lg divide-y divide-border text-sm">
                      <div className="p-3 flex items-center justify-between">
                        <span className="text-muted-foreground">{toolT.watermarkSize}</span>
                        <span className="font-mono font-medium text-foreground">
                          {String(item.meta.size)}x{String(item.meta.size)}px
                        </span>
                      </div>
                      {item.meta.position && (
                        <div className="p-3 flex items-center justify-between">
                          <span className="text-muted-foreground">{toolT.watermarkPosition}</span>
                          <span className="font-mono font-medium text-foreground">
                            ({String((item.meta.position as Record<string, number>).x)}, {String((item.meta.position as Record<string, number>).y)})
                          </span>
                        </div>
                      )}
                      <div className="p-3 flex items-center justify-between">
                        <span className="text-muted-foreground">{toolT.passes}</span>
                        <span className="font-mono font-medium text-foreground">
                          {String(item.meta.passCount)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Expanded error detail */}
              {isExpanded && item.status === "error" && (
                <div className="border-t border-border p-4">
                  <div className="text-sm px-3 py-1.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
                    {common.error}: {item.error}
                  </div>
                </div>
              )}

              {/* Expanded processing */}
              {isExpanded && (item.status === "processing" || item.status === "pending") && (
                <div className="border-t border-border p-4">
                  <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {toolT.processing}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
