"use client";

import { useState, useCallback, useRef } from "react";
import { FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface SvgToPngProps {
  t: Record<string, unknown>;
}

export default function SvgToPng({ t }: SvgToPngProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "svg-to-png"
  ];

  const [svgCode, setSvgCode] = useState("");
  const [scale, setScale] = useState<"1" | "2" | "3">("1");
  const [pngDataUrl, setPngDataUrl] = useState("");
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.includes("svg")) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSvgCode(result);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.includes("svg")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setSvgCode(result);
      };
      reader.readAsText(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const convertToPng = useCallback(() => {
    if (!svgCode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    const blob = new Blob([svgCode], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      const scaleFactor = parseInt(scale, 10);
      const width = img.width * scaleFactor;
      const height = img.height * scaleFactor;

      canvas.width = width;
      canvas.height = height;
      setDimensions({ width, height });

      ctx.drawImage(img, 0, 0, width, height);
      const pngUrl = canvas.toDataURL("image/png");
      setPngDataUrl(pngUrl);

      URL.revokeObjectURL(url);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
    };

    img.src = url;
  }, [svgCode, scale]);

  const handleDownload = useCallback(() => {
    if (!pngDataUrl) return;

    const link = document.createElement("a");
    link.download = `converted-${scale}x.png`;
    link.href = pngDataUrl;
    link.click();
  }, [pngDataUrl, scale]);

  const handleClear = useCallback(() => {
    setSvgCode("");
    setPngDataUrl("");
    setDimensions({ width: 0, height: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* File Upload */}
      <div
        className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".svg,image/svg+xml"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="space-y-2">
          <FileImage className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="text-sm font-medium">{toolT.dropzone}</p>
          <p className="text-xs text-muted-foreground">{toolT.supportedFormats}</p>
        </div>
      </div>

      {/* SVG Code Input */}
      <div className="space-y-2">
        <Label>{toolT.pasteArea}</Label>
        <Textarea
          value={svgCode}
          onChange={(e) => setSvgCode(e.target.value)}
          placeholder="<svg>...</svg>"
          className="font-mono text-xs min-h-[200px]"
        />
      </div>

      {/* Scale Selection */}
      {svgCode && (
        <div className="space-y-2">
          <Label>{toolT.scale}</Label>
          <RadioGroup
            value={scale}
            onValueChange={(value) => setScale(value as "1" | "2" | "3")}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1" id="scale1" />
              <Label htmlFor="scale1" className="font-normal cursor-pointer">
                {toolT.scale1x}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="2" id="scale2" />
              <Label htmlFor="scale2" className="font-normal cursor-pointer">
                {toolT.scale2x}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="3" id="scale3" />
              <Label htmlFor="scale3" className="font-normal cursor-pointer">
                {toolT.scale3x}
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}

      {/* Convert Button */}
      {svgCode && (
        <div className="flex items-center gap-2">
          <Button onClick={convertToPng}>
            {toolT.convert}
          </Button>
          <Button onClick={handleClear} variant="outline">
            {common.clear}
          </Button>
        </div>
      )}

      {/* Preview and Download */}
      {pngDataUrl && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{toolT.preview}</Label>
            <div className="border border-border rounded-lg p-4 bg-muted/20">
              <img
                src={pngDataUrl}
                alt="Converted PNG"
                className="max-w-full h-auto"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {toolT.outputSize}: {dimensions.width} × {dimensions.height} px
            </p>
          </div>
          <Button onClick={handleDownload}>
            {toolT.downloadPng}
          </Button>
        </div>
      )}

      {/* Hidden canvas for conversion */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
