"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Hash, Binary } from "lucide-react";
import CopyButton from "./CopyButton";

interface HexToTextProps {
  t: Record<string, unknown>;
}

type ConversionMode = "hex-to-text" | "text-to-hex" | "binary-to-text" | "text-to-binary";

export default function HexToText({ t }: HexToTextProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "hex-to-text"
  ];

  const [mode, setMode] = useState<ConversionMode>("hex-to-text");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const hexToText = useCallback((hex: string): string => {
    const cleanHex = hex.replace(/[^0-9A-Fa-f]/g, "");
    if (cleanHex.length % 2 !== 0) {
      throw new Error(toolT.invalidHex);
    }
    
    let result = "";
    for (let i = 0; i < cleanHex.length; i += 2) {
      const byte = parseInt(cleanHex.substring(i, i + 2), 16);
      result += String.fromCharCode(byte);
    }
    return result;
  }, [toolT]);

  const textToHex = useCallback((text: string): string => {
    let result = "";
    for (let i = 0; i < text.length; i++) {
      const hex = text.charCodeAt(i).toString(16).padStart(2, "0");
      result += hex;
    }
    return result.toUpperCase();
  }, []);

  const binaryToText = useCallback((binary: string): string => {
    const cleanBinary = binary.replace(/[^01]/g, "");
    if (cleanBinary.length % 8 !== 0) {
      throw new Error(toolT.invalidBinary);
    }
    
    let result = "";
    for (let i = 0; i < cleanBinary.length; i += 8) {
      const byte = parseInt(cleanBinary.substring(i, i + 8), 2);
      result += String.fromCharCode(byte);
    }
    return result;
  }, [toolT]);

  const textToBinary = useCallback((text: string): string => {
    let result = "";
    for (let i = 0; i < text.length; i++) {
      const binary = text.charCodeAt(i).toString(2).padStart(8, "0");
      result += binary + " ";
    }
    return result.trim();
  }, []);

  const handleConvert = useCallback(() => {
    if (!input.trim()) {
      setError(toolT.emptyInput);
      setOutput("");
      return;
    }

    try {
      let result = "";
      
      switch (mode) {
        case "hex-to-text":
          result = hexToText(input);
          break;
        case "text-to-hex":
          result = textToHex(input);
          break;
        case "binary-to-text":
          result = binaryToText(input);
          break;
        case "text-to-binary":
          result = textToBinary(input);
          break;
      }
      
      setOutput(result);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : toolT.conversionError);
      setOutput("");
    }
  }, [input, mode, hexToText, textToHex, binaryToText, textToBinary, toolT]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setError("");
  }, []);

  const handlePaste = useCallback(async () => {
    const text = await navigator.clipboard.readText();
    setInput(text);
  }, []);

  const handleSwap = useCallback(() => {
    setInput(output);
    setOutput(input);
    
    // Swap mode
    if (mode === "hex-to-text") setMode("text-to-hex");
    else if (mode === "text-to-hex") setMode("hex-to-text");
    else if (mode === "binary-to-text") setMode("text-to-binary");
    else if (mode === "text-to-binary") setMode("binary-to-text");
  }, [input, output, mode]);

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-muted rounded-lg">
        <Button
          onClick={() => setMode("hex-to-text")}
          size="sm"
          variant={mode === "hex-to-text" ? "default" : "ghost"}
        >
          {toolT.hexToText}
        </Button>
        <Button
          onClick={() => setMode("text-to-hex")}
          size="sm"
          variant={mode === "text-to-hex" ? "default" : "ghost"}
        >
          {toolT.textToHex}
        </Button>
        <Button
          onClick={() => setMode("binary-to-text")}
          size="sm"
          variant={mode === "binary-to-text" ? "default" : "ghost"}
        >
          {toolT.binaryToText}
        </Button>
        <Button
          onClick={() => setMode("text-to-binary")}
          size="sm"
          variant={mode === "text-to-binary" ? "default" : "ghost"}
        >
          {toolT.textToBinary}
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 border border-border rounded-lg px-3 py-2 bg-muted/30">
        <div className="flex items-center gap-2">
          <Button onClick={handleConvert} size="sm">
            {mode.includes("hex") ? (
              <Hash className="h-4 w-4 mr-1.5" />
            ) : (
              <Binary className="h-4 w-4 mr-1.5" />
            )}
            {toolT.convert}
          </Button>
          {output && (
            <Button onClick={handleSwap} size="sm" variant="secondary">
              {toolT.swap}
            </Button>
          )}
        </div>

        <div className="h-5 w-px bg-border hidden sm:block" />

        <div className="flex items-center gap-2">
          <Button onClick={handlePaste} size="sm" variant="outline">
            {common.paste}
          </Button>
          <Button onClick={handleClear} size="sm" variant="outline">
            {common.clear}
          </Button>
        </div>
      </div>

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
              {mode.includes("hex-to") ? toolT.hexInput : 
               mode.includes("binary-to") ? toolT.binaryInput : 
               toolT.textInput}
            </label>
            <span className="text-xs text-muted-foreground">
              {input.length} {toolT.characters}
            </span>
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "hex-to-text" ? toolT.hexPlaceholder :
              mode === "text-to-hex" ? toolT.textPlaceholder :
              mode === "binary-to-text" ? toolT.binaryPlaceholder :
              toolT.textPlaceholder
            }
            className="font-mono text-sm min-h-[200px] sm:min-h-[400px]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              {mode.includes("to-hex") ? toolT.hexOutput : 
               mode.includes("to-binary") ? toolT.binaryOutput : 
               toolT.textOutput}
            </label>
            {output && (
              <CopyButton
                text={output}
                copyLabel={common.copy}
                copiedLabel={common.copied}
              />
            )}
          </div>
          <Textarea
            value={output}
            readOnly
            placeholder={common.outputPlaceholder}
            className="font-mono text-sm min-h-[200px] sm:min-h-[400px] bg-muted/50"
          />
        </div>
      </div>
    </div>
  );
}
