"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SegmentedControl } from "@/components/ui/segmented-control";
import CopyButton from "./CopyButton";

interface TextCaseConverterProps {
  t: Record<string, unknown>;
}

type CaseType = "lower" | "upper" | "title" | "sentence" | "camel" | "pascal" | "snake" | "kebab";

export default function TextCaseConverter({ t }: TextCaseConverterProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "text-case-converter"
  ];

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [caseType, setCaseType] = useState<CaseType>("lower");

  const convertCase = useCallback((text: string, type: CaseType): string => {
    if (!text) return "";

    switch (type) {
      case "lower":
        return text.toLowerCase();
      
      case "upper":
        return text.toUpperCase();
      
      case "title":
        return text
          .toLowerCase()
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      
      case "sentence":
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
      
      case "camel":
        return text
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
          .replace(/^[A-Z]/, (chr) => chr.toLowerCase());
      
      case "pascal":
        return text
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
          .replace(/^[a-z]/, (chr) => chr.toUpperCase());
      
      case "snake":
        return text
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");
      
      case "kebab":
        return text
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      
      default:
        return text;
    }
  }, []);

  const handleConvert = useCallback((type: CaseType) => {
    setCaseType(type);
    if (input.trim()) {
      setOutput(convertCase(input, type));
    }
  }, [input, convertCase]);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
  }, []);

  const handlePaste = useCallback(async () => {
    const text = await navigator.clipboard.readText();
    setInput(text);
    if (text.trim()) {
      setOutput(convertCase(text, caseType));
    }
  }, [convertCase, caseType]);

  // Auto-convert on input change
  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    if (value.trim()) {
      setOutput(convertCase(value, caseType));
    } else {
      setOutput("");
    }
  }, [convertCase, caseType]);

  const caseOptions = [
    { label: toolT.lowercase, value: "lower" as CaseType },
    { label: toolT.uppercase, value: "upper" as CaseType },
    { label: toolT.titleCase, value: "title" as CaseType },
    { label: toolT.sentenceCase, value: "sentence" as CaseType },
  ];

  const programmingCaseOptions = [
    { label: toolT.camelCase, value: "camel" as CaseType },
    { label: toolT.pascalCase, value: "pascal" as CaseType },
    { label: toolT.snakeCase, value: "snake" as CaseType },
    { label: toolT.kebabCase, value: "kebab" as CaseType },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border border-border rounded-lg px-3 py-2 bg-muted/30">
        <div className="flex flex-col sm:flex-row gap-2">
          <span className="text-xs text-muted-foreground self-center">{toolT.textCases}</span>
          <div className="flex flex-wrap gap-2">
            {caseOptions.map((option) => (
              <Button
                key={option.value}
                onClick={() => handleConvert(option.value)}
                size="sm"
                variant={caseType === option.value ? "default" : "outline"}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="h-px bg-border" />

        <div className="flex flex-col sm:flex-row gap-2">
          <span className="text-xs text-muted-foreground self-center">{toolT.programmingCases}</span>
          <div className="flex flex-wrap gap-2">
            {programmingCaseOptions.map((option) => (
              <Button
                key={option.value}
                onClick={() => handleConvert(option.value)}
                size="sm"
                variant={caseType === option.value ? "default" : "outline"}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="h-px bg-border" />

        <div className="flex items-center gap-2">
          <Button onClick={handlePaste} size="sm" variant="outline">
            {common.paste}
          </Button>
          <Button onClick={handleClear} size="sm" variant="outline">
            {common.clear}
          </Button>
        </div>
      </div>

      {/* Input/Output */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{common.input}</label>
            <span className="text-xs text-muted-foreground">
              {input.length} {toolT.characters}
            </span>
          </div>
          <Textarea
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={common.inputPlaceholder}
            className="min-h-[200px] sm:min-h-[400px]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{common.output}</label>
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
            className="min-h-[200px] sm:min-h-[400px] bg-muted/50"
          />
        </div>
      </div>
    </div>
  );
}
