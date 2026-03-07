"use client";

import { useState, useEffect, useCallback } from "react";
import yaml from "js-yaml";
import * as TOML from "smol-toml";
import { Textarea } from "@/components/ui/textarea";
import { SegmentedControl } from "@/components/ui/segmented-control";
import CopyButton from "./CopyButton";

type Format = "yaml" | "json" | "toml";

interface YamlJsonTomlConverterProps {
  t: Record<string, unknown>;
}

export default function YamlJsonTomlConverter({
  t,
}: YamlJsonTomlConverterProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "yaml-json-toml-converter"
  ];

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [inputFormat, setInputFormat] = useState<Format>("yaml");
  const [outputFormat, setOutputFormat] = useState<Format>("json");

  const allFormats: Format[] = ["yaml", "json", "toml"];

  const formatLabels: Record<Format, string> = {
    yaml: "YAML",
    json: "JSON",
    toml: "TOML",
  };

  const inputOptions = allFormats.map((f) => ({
    label: formatLabels[f],
    value: f,
  }));

  const outputOptions = allFormats
    .filter((f) => f !== inputFormat)
    .map((f) => ({
      label: formatLabels[f],
      value: f,
    }));

  const parseInput = useCallback(
    (text: string, format: Format): unknown => {
      switch (format) {
        case "json":
          return JSON.parse(text);
        case "yaml":
          return yaml.load(text);
        case "toml":
          return TOML.parse(text);
      }
    },
    []
  );

  const serializeOutput = useCallback(
    (data: unknown, format: Format): string => {
      switch (format) {
        case "json":
          return JSON.stringify(data, null, 2);
        case "yaml":
          return yaml.dump(data);
        case "toml":
          return TOML.stringify(data as Record<string, unknown>);
      }
    },
    []
  );

  const convert = useCallback(
    (text: string, inFmt: Format, outFmt: Format) => {
      if (!text.trim()) {
        setOutput("");
        setError("");
        return;
      }
      try {
        const parsed = parseInput(text, inFmt);
        const result = serializeOutput(parsed, outFmt);
        setOutput(result);
        setError("");
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        setOutput("");
      }
    },
    [parseInput, serializeOutput]
  );

  // Real-time conversion
  useEffect(() => {
    convert(input, inputFormat, outputFormat);
  }, [input, inputFormat, outputFormat, convert]);

  // When input format changes and equals output format, auto-switch output
  const handleInputFormatChange = (newFormat: Format) => {
    setInputFormat(newFormat);
    if (newFormat === outputFormat) {
      const alternative = allFormats.find(
        (f) => f !== newFormat
      ) as Format;
      setOutputFormat(alternative);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border border-border rounded-lg px-3 py-2 bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {toolT.inputFormat}
          </span>
          <SegmentedControl
            options={inputOptions}
            value={inputFormat}
            onChange={handleInputFormatChange}
            size="sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {toolT.outputFormat}
          </span>
          <SegmentedControl
            options={outputOptions}
            value={outputFormat}
            onChange={setOutputFormat}
            size="sm"
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="text-sm px-3 py-1.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
          {common.error}: {error}
        </div>
      )}

      {/* Input / Output */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">{common.input}</label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={toolT.inputPlaceholder}
            className="font-mono text-sm min-h-[200px] sm:min-h-[400px] resize-y"
            spellCheck={false}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{common.output}</label>
            <CopyButton
              text={output}
              copyLabel={common.copy}
              copiedLabel={common.copied}
            />
          </div>
          <Textarea
            value={output}
            readOnly
            placeholder={toolT.outputPlaceholder}
            className="font-mono text-sm min-h-[200px] sm:min-h-[400px] resize-y"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
