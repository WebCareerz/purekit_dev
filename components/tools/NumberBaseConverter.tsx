"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import CopyButton from "./CopyButton";

interface NumberBaseConverterProps {
  t: Record<string, unknown>;
}

type Base = "bin" | "oct" | "dec" | "hex";

interface ConversionResult {
  bin: string;
  oct: string;
  dec: string;
  hex: string;
  error: string;
}

function convert(value: string, from: Base): ConversionResult {
  const empty: ConversionResult = { bin: "", oct: "", dec: "", hex: "", error: "" };
  const trimmed = value.trim();
  if (!trimmed) return empty;

  let decimalValue: bigint;

  try {
    switch (from) {
      case "bin":
        if (!/^[01]+$/.test(trimmed)) return { ...empty, error: "Invalid binary number" };
        decimalValue = BigInt("0b" + trimmed);
        break;
      case "oct":
        if (!/^[0-7]+$/.test(trimmed)) return { ...empty, error: "Invalid octal number" };
        decimalValue = BigInt("0o" + trimmed);
        break;
      case "dec":
        if (!/^-?\d+$/.test(trimmed)) return { ...empty, error: "Invalid decimal number" };
        decimalValue = BigInt(trimmed);
        break;
      case "hex":
        if (!/^[0-9a-fA-F]+$/.test(trimmed)) return { ...empty, error: "Invalid hexadecimal number" };
        decimalValue = BigInt("0x" + trimmed);
        break;
    }
  } catch {
    return { ...empty, error: "Conversion error" };
  }

  const zero = BigInt(0);
  const isNeg = decimalValue < zero;
  const abs = isNeg ? -decimalValue : decimalValue;
  const prefix = isNeg ? "-" : "";

  return {
    bin: prefix + abs.toString(2),
    oct: prefix + abs.toString(8),
    dec: decimalValue.toString(10),
    hex: prefix + abs.toString(16).toUpperCase(),
    error: "",
  };
}

function getSteps(value: string, from: Base, toolT: Record<string, string>): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];

  const result = convert(trimmed, from);
  if (result.error) return [];

  const steps: string[] = [];
  const labels: Record<Base, string> = {
    bin: toolT.binary,
    oct: toolT.octal,
    dec: toolT.decimal,
    hex: toolT.hexadecimal,
  };

  if (from !== "dec") {
    steps.push(`${labels[from]} "${trimmed}" → ${labels.dec} ${result.dec}`);
  }

  const bases: Base[] = ["bin", "oct", "dec", "hex"];
  for (const base of bases) {
    if (base !== from && base !== "dec") {
      steps.push(`${labels.dec} ${result.dec} → ${labels[base]} ${result[base]}`);
    }
  }

  return steps;
}

const inputClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm font-mono transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export default function NumberBaseConverter({ t }: NumberBaseConverterProps) {
  const toolT = (t.tools as Record<string, Record<string, string>>)["number-base-converter"];
  const common = t.common as Record<string, string>;

  const [activeBase, setActiveBase] = useState<Base>("dec");
  const [inputValue, setInputValue] = useState("");
  const [showSteps, setShowSteps] = useState(false);

  const result = convert(inputValue, activeBase);
  const steps = showSteps ? getSteps(inputValue, activeBase, toolT) : [];

  const handleInput = useCallback((base: Base, value: string) => {
    setActiveBase(base);
    setInputValue(value);
  }, []);

  const bases: { key: Base; label: string; placeholder: string }[] = [
    { key: "bin", label: toolT.binary, placeholder: "e.g. 11010110" },
    { key: "oct", label: toolT.octal, placeholder: "e.g. 326" },
    { key: "dec", label: toolT.decimal, placeholder: "e.g. 214" },
    { key: "hex", label: toolT.hexadecimal, placeholder: "e.g. D6" },
  ];

  return (
    <div className="space-y-6">
      {/* Input fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {bases.map(({ key, label, placeholder }) => {
          const isActive = activeBase === key;
          const displayValue = isActive ? inputValue : result[key];

          return (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  className={`text-sm font-medium ${isActive ? "text-primary" : ""}`}
                >
                  {label}
                </label>
                {displayValue && <CopyButton text={displayValue} copyLabel={common.copy} copiedLabel={common.copied} />}
              </div>
              <input
                value={displayValue}
                onChange={(e) => handleInput(key, e.target.value)}
                placeholder={placeholder}
                className={`${inputClass} ${isActive ? "ring-2 ring-primary/50" : ""}`}
                spellCheck={false}
              />
            </div>
          );
        })}
      </div>

      {/* Error */}
      {result.error && (
        <p className="text-sm text-destructive">{result.error}</p>
      )}

      {/* Show Steps toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSteps(!showSteps)}
        >
          {showSteps ? toolT.hideSteps : toolT.showSteps}
        </Button>
      </div>

      {/* Steps */}
      {showSteps && steps.length > 0 && (
        <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
          <label className="text-sm font-semibold">{toolT.conversionSteps}</label>
          <ol className="space-y-1.5 text-sm text-muted-foreground font-mono">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
