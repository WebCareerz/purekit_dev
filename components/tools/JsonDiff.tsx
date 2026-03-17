"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GitCompare } from "lucide-react";

interface JsonDiffProps {
  t: Record<string, unknown>;
}

export default function JsonDiff({ t }: JsonDiffProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)["json-diff"];

  const [json1, setJson1] = useState("");
  const [json2, setJson2] = useState("");
  const [diff, setDiff] = useState<string>("");
  const [error, setError] = useState("");

  const handleCompare = useCallback(() => {
    try {
      const obj1 = JSON.parse(json1);
      const obj2 = JSON.parse(json2);
      
      const differences: string[] = [];
      const findDiff = (o1: any, o2: any, path = "") => {
        if (typeof o1 !== typeof o2) {
          differences.push(`${path}: type changed from ${typeof o1} to ${typeof o2}`);
          return;
        }
        if (typeof o1 === "object" && o1 !== null) {
          const keys = new Set([...Object.keys(o1), ...Object.keys(o2)]);
          keys.forEach(key => {
            const newPath = path ? `${path}.${key}` : key;
            if (!(key in o1)) {
              differences.push(`+ ${newPath}: ${JSON.stringify(o2[key])}`);
            } else if (!(key in o2)) {
              differences.push(`- ${newPath}: ${JSON.stringify(o1[key])}`);
            } else if (JSON.stringify(o1[key]) !== JSON.stringify(o2[key])) {
              findDiff(o1[key], o2[key], newPath);
            }
          });
        } else if (o1 !== o2) {
          differences.push(`${path}: ${JSON.stringify(o1)} → ${JSON.stringify(o2)}`);
        }
      };
      
      findDiff(obj1, obj2);
      setDiff(differences.length > 0 ? differences.join("\n") : toolT.noDifferences);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : toolT.invalidJson);
      setDiff("");
    }
  }, [json1, json2, toolT]);

  return (
    <div className="space-y-4">
      <Button onClick={handleCompare} size="sm">
        <GitCompare className="h-4 w-4 mr-1.5" />
        {toolT.compare}
      </Button>

      {error && (
        <div className="border border-destructive/50 bg-destructive/10 rounded-lg p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">{toolT.json1}</label>
          <Textarea
            value={json1}
            onChange={(e) => setJson1(e.target.value)}
            placeholder={toolT.jsonPlaceholder}
            className="font-mono text-sm min-h-[200px] sm:min-h-[300px]"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{toolT.json2}</label>
          <Textarea
            value={json2}
            onChange={(e) => setJson2(e.target.value)}
            placeholder={toolT.jsonPlaceholder}
            className="font-mono text-sm min-h-[200px] sm:min-h-[300px]"
          />
        </div>
      </div>

      {diff && (
        <div className="space-y-2">
          <label className="text-sm font-medium">{toolT.differences}</label>
          <pre className="p-3 bg-muted rounded-lg text-xs font-mono whitespace-pre-wrap min-h-[100px]">
            {diff}
          </pre>
        </div>
      )}
    </div>
  );
}
