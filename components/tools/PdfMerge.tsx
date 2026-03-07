"use client";

import { useState, useRef, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";

interface PdfMergeProps {
  t: Record<string, unknown>;
}

interface PdfFileEntry {
  file: File;
  name: string;
  size: number;
  pageCount: number;
  bytes: ArrayBuffer;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function PdfMerge({ t }: PdfMergeProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "pdf-merge"
  ];

  const [files, setFiles] = useState<PdfFileEntry[]>([]);
  const [merging, setMerging] = useState(false);
  const [mergedUrl, setMergedUrl] = useState<string>("");
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalPages = files.reduce((sum, f) => sum + f.pageCount, 0);

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    setError("");
    const newEntries: PdfFileEntry[] = [];

    for (const file of Array.from(fileList)) {
      if (file.type !== "application/pdf") continue;
      try {
        const bytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
        newEntries.push({
          file,
          name: file.name,
          size: file.size,
          pageCount: pdf.getPageCount(),
          bytes,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    }

    if (newEntries.length > 0) {
      setFiles((prev) => [...prev, ...newEntries]);
      setMergedUrl("");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
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
      const selected = e.target.files;
      if (selected && selected.length > 0) {
        processFiles(selected);
      }
      // Reset input so re-selecting the same file works
      e.target.value = "";
    },
    [processFiles]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setMergedUrl("");
  }, []);

  const moveFile = useCallback((index: number, direction: -1 | 1) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= newFiles.length) return prev;
      [newFiles[index], newFiles[targetIndex]] = [
        newFiles[targetIndex],
        newFiles[index],
      ];
      return newFiles;
    });
    setMergedUrl("");
  }, []);

  const handleMerge = useCallback(async () => {
    if (files.length < 2) return;

    setMerging(true);
    setError("");
    setMergedUrl("");

    try {
      const mergedPdf = await PDFDocument.create();

      for (const entry of files) {
        const srcDoc = await PDFDocument.load(entry.bytes, {
          ignoreEncryption: true,
        });
        const copiedPages = await mergedPdf.copyPages(
          srcDoc,
          srcDoc.getPageIndices()
        );
        for (const page of copiedPages) {
          mergedPdf.addPage(page);
        }
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([new Uint8Array(mergedBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setMergedUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setMerging(false);
    }
  }, [files]);

  const handleDownload = useCallback(() => {
    if (!mergedUrl) return;
    const link = document.createElement("a");
    link.download = "merged.pdf";
    link.href = mergedUrl;
    link.click();
  }, [mergedUrl]);

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

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {files.length} {toolT.fileCount}, {totalPages} {toolT.pages}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              {toolT.addMore}
            </Button>
          </div>

          {/* File entries */}
          <div className="border border-border rounded-lg divide-y divide-border">
            {files.map((entry, index) => (
              <div
                key={`${entry.name}-${index}`}
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

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {entry.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(entry.size)} &middot; {entry.pageCount}{" "}
                    {toolT.pages}
                  </p>
                </div>

                {/* Move up/down buttons */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveFile(index, -1)}
                    disabled={index === 0}
                    className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Move up"
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
                        d="M4.5 15.75l7.5-7.5 7.5 7.5"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveFile(index, 1)}
                    disabled={index === files.length - 1}
                    className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Move down"
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
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </button>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-1 rounded text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                  aria-label={toolT.removeFile}
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
            ))}
          </div>

          {/* Reorder hint */}
          <p className="text-xs text-muted-foreground text-center">
            {toolT.dragToReorder}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-sm px-3 py-1.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
          {common.error}: {error}
        </div>
      )}

      {/* Merge button */}
      {files.length >= 2 && !mergedUrl && (
        <div className="flex justify-center">
          <Button onClick={handleMerge} disabled={merging}>
            {merging ? toolT.merging : toolT.merge}
          </Button>
        </div>
      )}

      {/* Merging progress */}
      {merging && (
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
          <span>{toolT.merging}</span>
        </div>
      )}

      {/* Download merged result */}
      {mergedUrl && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleDownload}>
            {toolT.download}
          </Button>
        </div>
      )}
    </div>
  );
}
