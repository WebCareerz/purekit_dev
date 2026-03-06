"use client";

import { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";

interface QrCodeGeneratorProps {
  t: Record<string, unknown>;
}

type QrSize = 200 | 400 | 600;

export default function QrCodeGenerator({ t }: QrCodeGeneratorProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "qr-code-generator"
  ];

  const [input, setInput] = useState("");
  const [size, setSize] = useState<QrSize>(400);
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState("");

  const sizeOptions = [
    { label: toolT.small, value: 200 as QrSize },
    { label: toolT.medium, value: 400 as QrSize },
    { label: toolT.large, value: 600 as QrSize },
  ];

  const generateQrCode = useCallback(async (text: string, sizeValue: number) => {
    if (!text.trim()) {
      setDataUrl("");
      setError("");
      return;
    }

    try {
      const url = await QRCode.toDataURL(text, {
        width: sizeValue,
        margin: 2,
        errorCorrectionLevel: "H",
      });
      setDataUrl(url);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setDataUrl("");
    }
  }, []);

  useEffect(() => {
    generateQrCode(input, size);
  }, [input, size, generateQrCode]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.download = "qrcode.png";
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{common.input}</label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={toolT.inputPlaceholder}
          className="font-mono text-sm min-h-[120px] resize-y"
          spellCheck={false}
        />
      </div>

      {/* Size selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{toolT.size}</label>
        <div>
          <SegmentedControl
            options={sizeOptions}
            value={size}
            onChange={setSize}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm px-3 py-1.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
          {common.error}: {error}
        </div>
      )}

      {/* QR Code display */}
      {dataUrl && (
        <div className="space-y-4">
          <div className="flex justify-center">
            <img
              src={dataUrl}
              alt="QR Code"
              width={size}
              height={size}
              className="rounded-lg border border-border"
            />
          </div>

          {/* Download button */}
          <div className="flex justify-center">
            <Button variant="outline" onClick={handleDownload}>
              {toolT.downloadPng}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
