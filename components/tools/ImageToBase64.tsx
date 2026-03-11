"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CopyButton from "./CopyButton";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ImageToBase64Props {
  t: Record<string, unknown>;
}

export default function ImageToBase64({ t }: ImageToBase64Props) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "image-to-base64"
  ];

  const [outputFormat, setOutputFormat] = useState<"dataUri" | "plainBase64">("dataUri");
  const [dataUri, setDataUri] = useState("");
  const [plainBase64, setPlainBase64] = useState("");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setDataUri(result);
      // Extract base64 part after comma
      const base64Part = result.split(",")[1] || "";
      setPlainBase64(base64Part);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setDataUri(result);
        const base64Part = result.split(",")[1] || "";
        setPlainBase64(base64Part);
        setFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleClear = useCallback(() => {
    setDataUri("");
    setPlainBase64("");
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const output = outputFormat === "dataUri" ? dataUri : plainBase64;

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
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="space-y-2">
          <div className="text-4xl">📷</div>
          <p className="text-sm font-medium">{toolT.dropzone}</p>
          <p className="text-xs text-muted-foreground">{toolT.supportedFormats}</p>
          {fileName && (
            <p className="text-xs text-primary mt-2">{fileName}</p>
          )}
        </div>
      </div>

      {/* Format Selection */}
      {dataUri && (
        <div className="space-y-2">
          <Label>{toolT.outputFormat}</Label>
          <RadioGroup
            value={outputFormat}
            onValueChange={(value) => setOutputFormat(value as "dataUri" | "plainBase64")}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dataUri" id="dataUri" />
              <Label htmlFor="dataUri" className="font-normal cursor-pointer">
                {toolT.dataUri}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="plainBase64" id="plainBase64" />
              <Label htmlFor="plainBase64" className="font-normal cursor-pointer">
                {toolT.plainBase64}
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}

      {/* Output */}
      {output && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{common.output}</label>
            <CopyButton
              text={output}
              copyLabel={outputFormat === "dataUri" ? toolT.copyDataUri : toolT.copyBase64}
              copiedLabel={common.copied}
            />
          </div>
          <Textarea
            value={output}
            readOnly
            className="font-mono text-xs min-h-[200px] sm:min-h-[300px] bg-muted/50"
          />
          <div className="flex items-center justify-end gap-2">
            <Button onClick={handleClear} size="sm" variant="outline">
              {common.clear}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
