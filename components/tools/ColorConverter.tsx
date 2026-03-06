"use client";

import { useState, useEffect, useCallback } from "react";
import CopyButton from "./CopyButton";

interface ColorConverterProps {
  t: Record<string, unknown>;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

// --- Conversion functions ---

function hexToRgb(hex: string): RGB | null {
  const cleaned = hex.replace(/^#/, "");
  let r: number, g: number, b: number;

  if (cleaned.length === 3) {
    r = parseInt(cleaned[0] + cleaned[0], 16);
    g = parseInt(cleaned[1] + cleaned[1], 16);
    b = parseInt(cleaned[2] + cleaned[2], 16);
  } else if (cleaned.length === 6) {
    r = parseInt(cleaned.substring(0, 2), 16);
    g = parseInt(cleaned.substring(2, 4), 16);
    b = parseInt(cleaned.substring(4, 6), 16);
  } else {
    return null;
  }

  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return { r, g, b };
}

function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, "0");
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    default:
      h = ((r - g) / d + 4) / 6;
      break;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  if (s === 0) {
    const val = Math.round(l * 255);
    return { r: val, g: val, b: val };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

// --- Parsing functions ---

function parseColor(input: string): RGB | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Try HEX
  const hexMatch = trimmed.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    return hexToRgb(trimmed.startsWith("#") ? trimmed : `#${trimmed}`);
  }

  // Try RGB
  const rgbMatch = trimmed.match(
    /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i
  );
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    if (r <= 255 && g <= 255 && b <= 255) {
      return { r, g, b };
    }
    return null;
  }

  // Try HSL
  const hslMatch = trimmed.match(
    /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/i
  );
  if (hslMatch) {
    const h = parseInt(hslMatch[1], 10);
    const s = parseInt(hslMatch[2], 10);
    const l = parseInt(hslMatch[3], 10);
    if (h <= 360 && s <= 100 && l <= 100) {
      return hslToRgb({ h, s, l });
    }
    return null;
  }

  return null;
}

export default function ColorConverter({ t }: ColorConverterProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "color-converter"
  ];

  const [input, setInput] = useState("#3b82f6");
  const [rgb, setRgb] = useState<RGB | null>(null);
  const [hexValue, setHexValue] = useState("");
  const [rgbValue, setRgbValue] = useState("");
  const [hslValue, setHslValue] = useState("");
  const [isValid, setIsValid] = useState(true);

  const updateFromRgb = useCallback((color: RGB) => {
    setRgb(color);
    setHexValue(rgbToHex(color));
    setRgbValue(`rgb(${color.r}, ${color.g}, ${color.b})`);
    const hsl = rgbToHsl(color);
    setHslValue(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`);
    setIsValid(true);
  }, []);

  // Parse input on change
  useEffect(() => {
    const parsed = parseColor(input);
    if (parsed) {
      updateFromRgb(parsed);
    } else {
      setIsValid(input.trim().length === 0);
      setRgb(null);
      setHexValue("");
      setRgbValue("");
      setHslValue("");
    }
  }, [input, updateFromRgb]);

  const handleColorPickerChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setInput(e.target.value);
  };

  return (
    <div className="space-y-6">
      {/* Input section */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{common.input}</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={toolT.inputPlaceholder}
            className="flex-1 h-10 px-3 rounded-md border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            spellCheck={false}
          />
          <input
            type="color"
            value={rgb ? rgbToHex(rgb) : "#000000"}
            onChange={handleColorPickerChange}
            className="h-10 w-14 rounded-md border border-border cursor-pointer bg-transparent p-1"
          />
        </div>
        {!isValid && input.trim().length > 0 && (
          <div className="text-sm px-3 py-1.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
            {toolT.invalidColor}
          </div>
        )}
      </div>

      {/* Preview swatch */}
      {rgb && (
        <div className="space-y-2">
          <label className="text-sm font-medium">{toolT.preview}</label>
          <div
            className="w-full h-32 rounded-lg border border-border"
            style={{ backgroundColor: hexValue }}
          />
        </div>
      )}

      {/* Color values */}
      {rgb && (
        <div className="space-y-3">
          <div className="border border-border rounded-lg divide-y divide-border">
            {/* HEX */}
            <div className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {toolT.hex}
                </span>
                <CopyButton
                  text={hexValue}
                  copyLabel={common.copy}
                  copiedLabel={common.copied}
                  size="sm"
                  className="h-6 text-xs"
                />
              </div>
              <div className="font-mono text-sm break-all text-foreground">
                {hexValue}
              </div>
            </div>

            {/* RGB */}
            <div className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {toolT.rgb}
                </span>
                <CopyButton
                  text={rgbValue}
                  copyLabel={common.copy}
                  copiedLabel={common.copied}
                  size="sm"
                  className="h-6 text-xs"
                />
              </div>
              <div className="font-mono text-sm break-all text-foreground">
                {rgbValue}
              </div>
            </div>

            {/* HSL */}
            <div className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {toolT.hsl}
                </span>
                <CopyButton
                  text={hslValue}
                  copyLabel={common.copy}
                  copiedLabel={common.copied}
                  size="sm"
                  className="h-6 text-xs"
                />
              </div>
              <div className="font-mono text-sm break-all text-foreground">
                {hslValue}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Values section */}
      {rgb && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">{toolT.cssValues}</h3>
          <div className="border border-border rounded-lg divide-y divide-border">
            {/* CSS HEX */}
            <div className="p-3 flex items-center justify-between">
              <code className="font-mono text-sm bg-muted/30 px-2 py-0.5 rounded">
                color: {hexValue};
              </code>
              <CopyButton
                text={`color: ${hexValue};`}
                copyLabel={common.copy}
                copiedLabel={common.copied}
                size="sm"
                className="h-6 text-xs"
              />
            </div>

            {/* CSS RGB */}
            <div className="p-3 flex items-center justify-between">
              <code className="font-mono text-sm bg-muted/30 px-2 py-0.5 rounded">
                color: {rgbValue};
              </code>
              <CopyButton
                text={`color: ${rgbValue};`}
                copyLabel={common.copy}
                copiedLabel={common.copied}
                size="sm"
                className="h-6 text-xs"
              />
            </div>

            {/* CSS HSL */}
            <div className="p-3 flex items-center justify-between">
              <code className="font-mono text-sm bg-muted/30 px-2 py-0.5 rounded">
                color: {hslValue};
              </code>
              <CopyButton
                text={`color: ${hslValue};`}
                copyLabel={common.copy}
                copiedLabel={common.copied}
                size="sm"
                className="h-6 text-xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
