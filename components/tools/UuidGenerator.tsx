"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import CopyButton from "./CopyButton";

interface UuidGeneratorProps {
  t: Record<string, unknown>;
}

const QUANTITIES = [1, 5, 10, 25, 50];

export default function UuidGenerator({ t }: UuidGeneratorProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "uuid-generator"
  ];

  const [uuids, setUuids] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const quantityOptions = QUANTITIES.map((q) => ({
    label: String(q),
    value: q,
  }));

  const caseOptions = [
    { label: toolT.lowercase, value: "lower" },
    { label: toolT.uppercase, value: "upper" },
  ];

  const hyphenOptions = [
    { label: toolT.hyphens, value: "yes" },
    { label: toolT.noHyphens, value: "no" },
  ];

  const generateUuids = useCallback(() => {
    const generated: string[] = [];
    for (let i = 0; i < quantity; i++) {
      let uuid = crypto.randomUUID();
      if (!hyphens) uuid = uuid.replace(/-/g, "");
      if (uppercase) uuid = uuid.toUpperCase();
      generated.push(uuid);
    }
    setUuids(generated);
  }, [quantity, uppercase, hyphens]);

  const copyOne = useCallback(async (uuid: string, index: number) => {
    await navigator.clipboard.writeText(uuid);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  }, []);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border border-border rounded-lg px-3 py-2 bg-muted/30">
        <Button onClick={generateUuids} size="sm">
          {common.generate}
        </Button>

        <div className="h-5 w-px bg-border" />

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{toolT.quantity}</span>
          <SegmentedControl
            options={quantityOptions}
            value={quantity}
            onChange={setQuantity}
            size="sm"
          />
        </div>

        <div className="h-5 w-px bg-border hidden sm:block" />

        <div className="flex items-center gap-2">
          <SegmentedControl
            options={caseOptions}
            value={uppercase ? "upper" : "lower"}
            onChange={(v) => setUppercase(v === "upper")}
            size="sm"
          />
          <SegmentedControl
            options={hyphenOptions}
            value={hyphens ? "yes" : "no"}
            onChange={(v) => setHyphens(v === "yes")}
            size="sm"
          />
        </div>
      </div>

      {/* Results */}
      {uuids.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {uuids.length} UUID{uuids.length > 1 ? "s" : ""}
            </span>
            <CopyButton
              text={uuids.join("\n")}
              copyLabel={toolT.copyAll}
              copiedLabel={common.copied}
            />
          </div>
          <div className="border border-border rounded-lg divide-y divide-border">
            {uuids.map((uuid, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => copyOne(uuid, i)}
              >
                <code className="font-mono text-sm">{uuid}</code>
                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {copiedIndex === i ? common.copied : common.copy}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {uuids.length === 0 && (
        <div className="border border-dashed border-border rounded-lg p-12 text-center text-muted-foreground">
          <p className="text-sm">{common.outputPlaceholder}</p>
        </div>
      )}
    </div>
  );
}
