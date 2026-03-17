"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import CopyButton from "./CopyButton";

interface JwtDecoderProps {
  t: Record<string, unknown>;
}

function base64UrlDecode(str: string): string {
  // Replace base64url characters with standard base64
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  // Add padding if needed
  const padding = base64.length % 4;
  if (padding) {
    base64 += "=".repeat(4 - padding);
  }
  // Decode
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString();
}

interface DecodedJwt {
  header: string;
  payload: string;
  signature: string;
  headerObj: Record<string, unknown> | null;
  payloadObj: Record<string, unknown> | null;
}

export default function JwtDecoder({ t }: JwtDecoderProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "jwt-decoder"
  ];

  const [input, setInput] = useState("");
  const [decoded, setDecoded] = useState<DecodedJwt | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!input.trim()) {
      setDecoded(null);
      setError("");
      return;
    }

    try {
      const parts = input.trim().split(".");
      if (parts.length !== 3) {
        throw new Error(toolT.invalidToken);
      }

      const headerJson = base64UrlDecode(parts[0]);
      const payloadJson = base64UrlDecode(parts[1]);
      const signature = parts[2];

      const headerObj = JSON.parse(headerJson);
      const payloadObj = JSON.parse(payloadJson);

      setDecoded({
        header: JSON.stringify(headerObj, null, 2),
        payload: JSON.stringify(payloadObj, null, 2),
        signature,
        headerObj,
        payloadObj,
      });
      setError("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setDecoded(null);
    }
  }, [input, toolT.invalidToken]);

  const isExpired =
    decoded?.payloadObj?.exp != null
      ? (decoded.payloadObj.exp as number) < Date.now() / 1000
      : null;

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{common.input}</label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={toolT.inputPlaceholder}
          className="font-mono text-sm min-h-[120px] resize-y"
          spellCheck={false}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm px-3 py-1.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
          {common.error}: {error}
        </div>
      )}

      {/* Decoded output */}
      {decoded && (
        <div className="space-y-4">
          {/* Expiration status & time claims */}
          {decoded.payloadObj && (
            <div className="border border-border rounded-lg p-3 bg-muted/30 space-y-2">
              {/* Expiration badge */}
              {isExpired !== null && (
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isExpired
                        ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400"
                        : "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400"
                    }`}
                  >
                    {isExpired ? toolT.expired : toolT.active}
                  </span>
                </div>
              )}

              {/* Time claims */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                {decoded.payloadObj.iat != null && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {toolT.issuedAt}
                    </span>
                    <div className="font-mono text-foreground">
                      {formatTimestamp(decoded.payloadObj.iat as number)}
                    </div>
                  </div>
                )}
                {decoded.payloadObj.exp != null && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {toolT.expiresAt}
                    </span>
                    <div className="font-mono text-foreground">
                      {formatTimestamp(decoded.payloadObj.exp as number)}
                    </div>
                  </div>
                )}
                {decoded.payloadObj.nbf != null && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {toolT.notBefore}
                    </span>
                    <div className="font-mono text-foreground">
                      {formatTimestamp(decoded.payloadObj.nbf as number)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Header */}
          <div className="border border-border rounded-lg divide-y divide-border">
            <div className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {toolT.header}
                </span>
                <CopyButton
                  text={decoded.header}
                  copyLabel={common.copy}
                  copiedLabel={common.copied}
                  size="sm"
                  className="h-6 text-xs"
                />
              </div>
              <pre className="font-mono text-sm break-all text-foreground whitespace-pre-wrap">
                {decoded.header}
              </pre>
            </div>

            {/* Payload */}
            <div className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {toolT.payload}
                </span>
                <CopyButton
                  text={decoded.payload}
                  copyLabel={common.copy}
                  copiedLabel={common.copied}
                  size="sm"
                  className="h-6 text-xs"
                />
              </div>
              <pre className="font-mono text-sm break-all text-foreground whitespace-pre-wrap">
                {decoded.payload}
              </pre>
            </div>

            {/* Signature */}
            <div className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {toolT.signature}
                </span>
                <CopyButton
                  text={decoded.signature}
                  copyLabel={common.copy}
                  copiedLabel={common.copied}
                  size="sm"
                  className="h-6 text-xs"
                />
              </div>
              <div className="font-mono text-sm break-all text-foreground">
                {decoded.signature}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
