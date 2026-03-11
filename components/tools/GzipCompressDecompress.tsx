"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface GzipCompressDecompressProps {
  t: Record<string, unknown>;
}

export default function GzipCompressDecompress({ t }: GzipCompressDecompressProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "gzip-compress-decompress"
  ];

  const [mode, setMode] = useState<"compress" | "decompress">("compress");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [compressionRatio, setCompressionRatio] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const compressData = useCallback(async (data: Uint8Array): Promise<Uint8Array> => {
    if (typeof CompressionStream !== "undefined") {
      // Use native Compression Streams API
      const stream = new Response(data).body!.pipeThrough(
        new CompressionStream("gzip")
      );
      const compressed = await new Response(stream).arrayBuffer();
      return new Uint8Array(compressed);
    } else {
      // Fallback: use pako if available (we'll add this as optional dependency)
      throw new Error("CompressionStream not supported in this browser. Please use a modern browser.");
    }
  }, []);

  const decompressData = useCallback(async (data: Uint8Array): Promise<Uint8Array> => {
    if (typeof DecompressionStream !== "undefined") {
      const stream = new Response(data).body!.pipeThrough(
        new DecompressionStream("gzip")
      );
      const decompressed = await new Response(stream).arrayBuffer();
      return new Uint8Array(decompressed);
    } else {
      throw new Error("DecompressionStream not supported in this browser. Please use a modern browser.");
    }
  }, []);

  const handleCompress = useCallback(async () => {
    if (!input.trim() && !uploadedFile) {
      setError(toolT.emptyInput);
      setOutput("");
      return;
    }

    try {
      const sourceData = uploadedFile
        ? new Uint8Array(await uploadedFile.arrayBuffer())
        : new TextEncoder().encode(input);

      const compressed = await compressData(sourceData);
      
      // Calculate compression ratio
      const ratio = ((1 - compressed.length / sourceData.length) * 100).toFixed(1);
      setCompressionRatio(parseFloat(ratio));

      // Convert to base64 for display
      const base64 = btoa(String.fromCharCode(...compressed));
      setOutput(base64);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : toolT.compressError);
      setOutput("");
      setCompressionRatio(null);
    }
  }, [input, uploadedFile, compressData, toolT]);

  const handleDecompress = useCallback(async () => {
    if (!uploadedFile && !input.trim()) {
      setError(toolT.emptyInput);
      setOutput("");
      return;
    }

    try {
      let compressedData: Uint8Array;

      if (uploadedFile) {
        compressedData = new Uint8Array(await uploadedFile.arrayBuffer());
      } else {
        // Assume input is base64
        const binary = atob(input.trim());
        compressedData = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          compressedData[i] = binary.charCodeAt(i);
        }
      }

      const decompressed = await decompressData(compressedData);
      const text = new TextDecoder().decode(decompressed);
      setOutput(text);
      setError("");
      setCompressionRatio(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : toolT.decompressError);
      setOutput("");
    }
  }, [input, uploadedFile, decompressData, toolT]);

  const handleDownloadCompressed = useCallback(() => {
    if (!output) return;
    const binary = atob(output);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: "application/gzip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = uploadedFile ? `${uploadedFile.name}.gz` : "compressed.gz";
    a.click();
    URL.revokeObjectURL(url);
  }, [output, uploadedFile]);

  const handleDownloadDecompressed = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const originalName = uploadedFile?.name.replace(/\.gz$/i, "") || "decompressed.txt";
    a.download = originalName;
    a.click();
    URL.revokeObjectURL(url);
  }, [output, uploadedFile]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setInput("");
    setOutput("");
    setError("");
    setCompressionRatio(null);
  }, []);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setError("");
    setUploadedFile(null);
    setCompressionRatio(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
        <Button
          onClick={() => {
            setMode("compress");
            handleClear();
          }}
          size="sm"
          variant={mode === "compress" ? "default" : "ghost"}
        >
          {toolT.compress}
        </Button>
        <Button
          onClick={() => {
            setMode("decompress");
            handleClear();
          }}
          size="sm"
          variant={mode === "decompress" ? "default" : "ghost"}
        >
          {toolT.decompress}
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 border border-border rounded-lg px-3 py-2 bg-muted/30">
        <div className="flex items-center gap-2">
          <Button
            onClick={mode === "compress" ? handleCompress : handleDecompress}
            size="sm"
          >
            {mode === "compress" ? toolT.compressBtn : toolT.decompressBtn}
          </Button>
          {output && mode === "compress" && (
            <Button onClick={handleDownloadCompressed} size="sm" variant="secondary">
              {toolT.downloadGz}
            </Button>
          )}
          {output && mode === "decompress" && (
            <Button onClick={handleDownloadDecompressed} size="sm" variant="secondary">
              {common.download}
            </Button>
          )}
        </div>

        <div className="h-5 w-px bg-border hidden sm:block" />

        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            accept={mode === "decompress" ? ".gz" : "*"}
            className="w-[200px] text-sm"
          />
          <Button onClick={handleClear} size="sm" variant="outline">
            {common.clear}
          </Button>
        </div>
      </div>

      {/* File info */}
      {uploadedFile && (
        <div className="text-sm text-muted-foreground">
          {toolT.uploadedFile}: <span className="font-medium">{uploadedFile.name}</span>{" "}
          ({(uploadedFile.size / 1024).toFixed(2)} KB)
        </div>
      )}

      {/* Compression ratio */}
      {compressionRatio !== null && (
        <div className="border border-border rounded-lg p-3 bg-muted/30">
          <div className="text-sm">
            {toolT.compressionRatio}: <span className="font-semibold text-primary">{compressionRatio}%</span>
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
            <label className="text-sm font-medium">
              {mode === "compress" ? toolT.inputData : toolT.compressedInput}
            </label>
            {input && (
              <span className="text-xs text-muted-foreground">
                {input.length} {toolT.characters}
              </span>
            )}
          </div>
          <Textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setUploadedFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
            placeholder={
              mode === "compress"
                ? toolT.inputPlaceholder
                : toolT.compressedPlaceholder
            }
            className="font-mono text-sm min-h-[200px] sm:min-h-[400px]"
            disabled={!!uploadedFile}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              {mode === "compress" ? toolT.compressedOutput : toolT.decompressedOutput}
            </label>
            {output && (
              <span className="text-xs text-muted-foreground">
                {output.length} {toolT.characters}
              </span>
            )}
          </div>
          <Textarea
            value={output}
            readOnly
            placeholder={toolT.outputPlaceholder}
            className="font-mono text-sm min-h-[200px] sm:min-h-[400px] bg-muted/50"
          />
        </div>
      </div>
    </div>
  );
}
