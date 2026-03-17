"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SegmentedControl } from "@/components/ui/segmented-control";
import CopyButton from "./CopyButton";

interface UrlEncodeToolProps {
  t: Record<string, unknown>;
}

export default function UrlEncodeTool({ t }: UrlEncodeToolProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "url-encode-decode"
  ];

  const [encodeInput, setEncodeInput] = useState("");
  const [encodeOutput, setEncodeOutput] = useState("");
  const [decodeInput, setDecodeInput] = useState("");
  const [decodeOutput, setDecodeOutput] = useState("");
  const [encodeMode, setEncodeMode] = useState<"component" | "full">("component");
  const [encodeError, setEncodeError] = useState("");
  const [decodeError, setDecodeError] = useState("");

  const encodeModeOptions = [
    { label: toolT.encodeMode, value: "component" as const },
    { label: toolT.encodeFullUrl, value: "full" as const },
  ];

  // Real-time encode
  useEffect(() => {
    if (!encodeInput) {
      setEncodeOutput("");
      setEncodeError("");
      return;
    }
    try {
      const result =
        encodeMode === "component"
          ? encodeURIComponent(encodeInput)
          : encodeURI(encodeInput);
      setEncodeOutput(result);
      setEncodeError("");
    } catch (e) {
      setEncodeError(e instanceof Error ? e.message : String(e));
      setEncodeOutput("");
    }
  }, [encodeInput, encodeMode]);

  // Real-time decode
  useEffect(() => {
    if (!decodeInput) {
      setDecodeOutput("");
      setDecodeError("");
      return;
    }
    try {
      setDecodeOutput(decodeURIComponent(decodeInput.trim()));
      setDecodeError("");
    } catch (e) {
      setDecodeError(e instanceof Error ? e.message : String(e));
      setDecodeOutput("");
    }
  }, [decodeInput]);

  return (
    <Tabs defaultValue="encode" className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <TabsList>
          <TabsTrigger value="encode">{common.encode}</TabsTrigger>
          <TabsTrigger value="decode">{common.decode}</TabsTrigger>
        </TabsList>

        <SegmentedControl
          options={encodeModeOptions}
          value={encodeMode}
          onChange={setEncodeMode}
          size="sm"
        />
      </div>

      <TabsContent value="encode" className="space-y-4 mt-0">
        {encodeError && (
          <div className="text-sm px-3 py-1.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
            {common.error}: {encodeError}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{common.input}</label>
            <Textarea
              value={encodeInput}
              onChange={(e) => setEncodeInput(e.target.value)}
              placeholder={toolT.encodePlaceholder}
              className="font-mono text-sm min-h-[300px] resize-y"
              spellCheck={false}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{common.output}</label>
              <CopyButton
                text={encodeOutput}
                copyLabel={common.copy}
                copiedLabel={common.copied}
              />
            </div>
            <Textarea
              value={encodeOutput}
              readOnly
              placeholder={toolT.encodeOutputPlaceholder}
              className="font-mono text-sm min-h-[300px] resize-y"
              spellCheck={false}
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="decode" className="space-y-4 mt-0">
        {decodeError && (
          <div className="text-sm px-3 py-1.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
            {common.error}: {decodeError}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{common.input}</label>
            <Textarea
              value={decodeInput}
              onChange={(e) => setDecodeInput(e.target.value)}
              placeholder={toolT.decodePlaceholder}
              className="font-mono text-sm min-h-[300px] resize-y"
              spellCheck={false}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{common.output}</label>
              <CopyButton
                text={decodeOutput}
                copyLabel={common.copy}
                copiedLabel={common.copied}
              />
            </div>
            <Textarea
              value={decodeOutput}
              readOnly
              placeholder={toolT.decodeOutputPlaceholder}
              className="font-mono text-sm min-h-[300px] resize-y"
              spellCheck={false}
            />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
