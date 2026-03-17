"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Plus, Trash2 } from "lucide-react";
import CopyButton from "./CopyButton";

interface CssGradientGeneratorProps {
  t: Record<string, unknown>;
}

type GradientType = "linear" | "radial" | "conic";
interface ColorStop {
  color: string;
  position: number;
}

export default function CssGradientGenerator({ t }: CssGradientGeneratorProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "css-gradient-generator"
  ];

  const [gradientType, setGradientType] = useState<GradientType>("linear");
  const [angle, setAngle] = useState(90);
  const [colorStops, setColorStops] = useState<ColorStop[]>([
    { color: "#667eea", position: 0 },
    { color: "#764ba2", position: 100 },
  ]);

  const addColorStop = useCallback(() => {
    setColorStops([...colorStops, { color: "#000000", position: 50 }]);
  }, [colorStops]);

  const removeColorStop = useCallback((index: number) => {
    if (colorStops.length > 2) {
      setColorStops(colorStops.filter((_, i) => i !== index));
    }
  }, [colorStops]);

  const updateColor = useCallback((index: number, color: string) => {
    const newStops = [...colorStops];
    newStops[index].color = color;
    setColorStops(newStops);
  }, [colorStops]);

  const updatePosition = useCallback((index: number, position: number) => {
    const newStops = [...colorStops];
    newStops[index].position = position;
    setColorStops(newStops);
  }, [colorStops]);

  const generateCss = useCallback(() => {
    const stops = colorStops
      .sort((a, b) => a.position - b.position)
      .map(stop => `${stop.color} ${stop.position}%`)
      .join(", ");

    if (gradientType === "linear") {
      return `linear-gradient(${angle}deg, ${stops})`;
    } else if (gradientType === "radial") {
      return `radial-gradient(circle, ${stops})`;
    } else {
      return `conic-gradient(from ${angle}deg, ${stops})`;
    }
  }, [gradientType, angle, colorStops]);

  const cssCode = generateCss();

  return (
    <div className="space-y-4">
      {/* Type Selection */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
        <Button
          onClick={() => setGradientType("linear")}
          size="sm"
          variant={gradientType === "linear" ? "default" : "ghost"}
        >
          {toolT.linear}
        </Button>
        <Button
          onClick={() => setGradientType("radial")}
          size="sm"
          variant={gradientType === "radial" ? "default" : "ghost"}
        >
          {toolT.radial}
        </Button>
        <Button
          onClick={() => setGradientType("conic")}
          size="sm"
          variant={gradientType === "conic" ? "default" : "ghost"}
        >
          {toolT.conic}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="angle" className="text-sm mb-2 block">
              {gradientType === "conic" ? toolT.startAngle : toolT.angle}: {angle}°
            </Label>
            <Input
              id="angle"
              type="range"
              min="0"
              max="360"
              value={angle}
              onChange={(e) => setAngle(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">{toolT.colorStops}</Label>
              <Button onClick={addColorStop} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                {toolT.addStop}
              </Button>
            </div>

            {colorStops.map((stop, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="color"
                  value={stop.color}
                  onChange={(e) => updateColor(index, e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={stop.position}
                  onChange={(e) => updatePosition(index, parseInt(e.target.value))}
                  className="w-20"
                />
                <span className="text-xs text-muted-foreground">%</span>
                {colorStops.length > 2 && (
                  <Button
                    onClick={() => removeColorStop(index)}
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">{toolT.cssCode}</Label>
              <CopyButton
                text={`background: ${cssCode};`}
                copyLabel={common.copy}
                copiedLabel={common.copied}
              />
            </div>
            <pre className="p-3 bg-muted rounded-lg text-xs font-mono overflow-x-auto">
              background: {cssCode};
            </pre>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label className="text-sm">{toolT.preview}</Label>
          <div
            className="w-full h-64 rounded-lg border border-border"
            style={{ background: cssCode }}
          />
        </div>
      </div>
    </div>
  );
}
