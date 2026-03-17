"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, Plus, Trash2 } from "lucide-react";
import CopyButton from "./CopyButton";

interface MarkdownTableGeneratorProps {
  t: Record<string, unknown>;
}

export default function MarkdownTableGenerator({ t }: MarkdownTableGeneratorProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)["markdown-table-generator"];

  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [data, setData] = useState<string[][]>(
    Array(3).fill(null).map(() => Array(3).fill(""))
  );

  const updateData = useCallback((row: number, col: number, value: string) => {
    const newData = data.map((r, i) => i === row ? r.map((c, j) => j === col ? value : c) : r);
    setData(newData);
  }, [data]);

  const addRow = useCallback(() => {
    setData([...data, Array(cols).fill("")]);
    setRows(rows + 1);
  }, [data, cols, rows]);

  const addCol = useCallback(() => {
    setData(data.map(row => [...row, ""]));
    setCols(cols + 1);
  }, [data, cols]);

  const generateMarkdown = useCallback(() => {
    let md = "| ";
    md += data[0]?.join(" | ") || "";
    md += " |\n| ";
    md += Array(cols).fill("---").join(" | ");
    md += " |\n";
    for (let i = 1; i < data.length; i++) {
      md += "| " + data[i].join(" | ") + " |\n";
    }
    return md;
  }, [data, cols]);

  const markdown = generateMarkdown();

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={addRow} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          {toolT.addRow}
        </Button>
        <Button onClick={addCol} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          {toolT.addColumn}
        </Button>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {data[0]?.map((_, colIdx) => (
                <th key={colIdx} className="p-2 border-r">
                  <Input
                    value={data[0][colIdx]}
                    onChange={(e) => updateData(0, colIdx, e.target.value)}
                    placeholder={`Column ${colIdx + 1}`}
                    className="text-sm"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(1).map((row, rowIdx) => (
              <tr key={rowIdx} className="border-t">
                {row.map((cell, colIdx) => (
                  <td key={colIdx} className="p-2 border-r">
                    <Input
                      value={cell}
                      onChange={(e) => updateData(rowIdx + 1, colIdx, e.target.value)}
                      placeholder={`Cell ${rowIdx + 1}-${colIdx + 1}`}
                      className="text-sm"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{toolT.markdownOutput}</label>
          <CopyButton text={markdown} copyLabel={common.copy} copiedLabel={common.copied} />
        </div>
        <pre className="p-3 bg-muted rounded-lg text-xs font-mono overflow-x-auto">
          {markdown}
        </pre>
      </div>
    </div>
  );
}
