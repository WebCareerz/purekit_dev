"use client";

import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import CopyButton from "./CopyButton";

interface HtmlEntityEncoderProps {
  t: Record<string, unknown>;
}

export default function HtmlEntityEncoder({ t }: HtmlEntityEncoderProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "html-entity-encoder"
  ];

  const [encodeInput, setEncodeInput] = useState("");
  const [decodeInput, setDecodeInput] = useState("");

  const encodeHtml = useCallback((text: string): string => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }, []);

  const decodeHtml = useCallback((text: string): string => {
    if (typeof document === "undefined") return text;
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
  }, []);

  const encodeOutput = encodeHtml(encodeInput);
  const decodeOutput = decodeHtml(decodeInput);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="encode" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="encode">{common.encode}</TabsTrigger>
          <TabsTrigger value="decode">{common.decode}</TabsTrigger>
        </TabsList>

        <TabsContent value="encode" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{common.input}</label>
              </div>
              <Textarea
                value={encodeInput}
                onChange={(e) => setEncodeInput(e.target.value)}
                placeholder={toolT.encodePlaceholder}
                className="font-mono text-sm min-h-[200px] sm:min-h-[400px]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{common.output}</label>
                {encodeOutput && (
                  <CopyButton
                    text={encodeOutput}
                    copyLabel={common.copy}
                    copiedLabel={common.copied}
                  />
                )}
              </div>
              <Textarea
                value={encodeOutput}
                readOnly
                placeholder={toolT.encodeOutputPlaceholder}
                className="font-mono text-sm min-h-[200px] sm:min-h-[400px] bg-muted/50"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="decode" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{common.input}</label>
              </div>
              <Textarea
                value={decodeInput}
                onChange={(e) => setDecodeInput(e.target.value)}
                placeholder={toolT.decodePlaceholder}
                className="font-mono text-sm min-h-[200px] sm:min-h-[400px]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{common.output}</label>
                {decodeOutput && (
                  <CopyButton
                    text={decodeOutput}
                    copyLabel={common.copy}
                    copiedLabel={common.copied}
                  />
                )}
              </div>
              <Textarea
                value={decodeOutput}
                readOnly
                placeholder={toolT.decodeOutputPlaceholder}
                className="font-mono text-sm min-h-[200px] sm:min-h-[400px] bg-muted/50"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
