"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "sql-formatter";
import { Textarea } from "@/components/ui/textarea";
import { SegmentedControl } from "@/components/ui/segmented-control";
import CopyButton from "./CopyButton";

interface SqlFormatterProps {
  t: Record<string, unknown>;
}

export default function SqlFormatter({ t }: SqlFormatterProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "sql-formatter"
  ];

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [dialect, setDialect] = useState<string>("sql");
  const [indent, setIndent] = useState<string>("2");
  const [uppercase, setUppercase] = useState(false);

  const dialectOptions = [
    { label: toolT.standard, value: "sql" },
    { label: toolT.mysql, value: "mysql" },
    { label: toolT.postgresql, value: "postgresql" },
    { label: toolT.transactsql, value: "transactsql" },
    { label: toolT.plsql, value: "plsql" },
    { label: toolT.sqlite, value: "sqlite" },
  ];

  const indentOptions = [
    { label: toolT.spaces2, value: "2" },
    { label: toolT.spaces4, value: "4" },
    { label: toolT.tab, value: "tab" },
  ];

  const formatSql = useCallback(
    (text: string, currentDialect: string, currentIndent: string, currentUppercase: boolean) => {
      if (!text.trim()) {
        setOutput("");
        return;
      }
      try {
        const indentNum = currentIndent === "tab" ? 2 : Number(currentIndent);
        const result = format(text, {
          language: currentDialect as
            | "sql"
            | "mysql"
            | "postgresql"
            | "transactsql"
            | "plsql"
            | "sqlite",
          tabWidth: indentNum,
          useTabs: currentIndent === "tab",
          keywordCase: currentUppercase ? "upper" : "preserve",
        });
        setOutput(result);
      } catch {
        setOutput(text);
      }
    },
    []
  );

  useEffect(() => {
    formatSql(input, dialect, indent, uppercase);
  }, [input, dialect, indent, uppercase, formatSql]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border border-border rounded-lg px-3 py-2 bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {toolT.dialect}
          </span>
          <SegmentedControl
            options={dialectOptions}
            value={dialect}
            onChange={setDialect}
            size="sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {toolT.indentation}
          </span>
          <SegmentedControl
            options={indentOptions}
            value={indent}
            onChange={setIndent}
            size="sm"
          />
        </div>

        <button
          type="button"
          onClick={() => setUppercase((prev) => !prev)}
          className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            uppercase
              ? "bg-foreground text-background shadow-sm"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {toolT.uppercase}
        </button>
      </div>

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
            placeholder={common.outputPlaceholder}
            className="font-mono text-sm min-h-[200px] sm:min-h-[400px] resize-y"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
