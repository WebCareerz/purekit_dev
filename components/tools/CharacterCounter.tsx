"use client";

import { useState, useCallback, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CharacterCounterProps {
  t: Record<string, unknown>;
}

export default function CharacterCounter({ t }: CharacterCounterProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "character-counter"
  ];

  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, "").length;
    
    // Word count (Unicode-aware)
    const words = text.trim()
      ? text.trim().split(/\s+/).length
      : 0;
    
    // Sentence count
    const sentences = text.trim()
      ? text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length
      : 0;
    
    // Paragraph count
    const paragraphs = text.trim()
      ? text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length
      : 0;
    
    // Line count
    const lines = text ? text.split("\n").length : 0;
    
    // Reading time (average 200 words per minute)
    const readingMinutes = words > 0 ? Math.ceil(words / 200) : 0;

    return {
      chars,
      charsNoSpaces,
      words,
      sentences,
      paragraphs,
      lines,
      readingMinutes,
    };
  }, [text]);

  const wordFrequency = useMemo(() => {
    if (!text.trim()) return [];
    
    const words = text.toLowerCase().match(/\b[\w']+\b/g) || [];
    const freq = new Map<string, number>();
    
    for (const word of words) {
      if (word.length > 2) { // Ignore very short words
        freq.set(word, (freq.get(word) || 0) + 1);
      }
    }
    
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [text]);

  const charFrequency = useMemo(() => {
    if (!text) return [];
    
    const freq = new Map<string, number>();
    for (const char of text) {
      if (char !== " " && char !== "\n" && char !== "\t") {
        freq.set(char, (freq.get(char) || 0) + 1);
      }
    }
    
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [text]);

  const handleClear = useCallback(() => {
    setText("");
  }, []);

  const handlePaste = useCallback(async () => {
    const clipText = await navigator.clipboard.readText();
    setText(clipText);
  }, []);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 border border-border rounded-lg px-3 py-2 bg-muted/30">
        <div className="flex items-center gap-2">
          <Button onClick={handlePaste} size="sm" variant="outline">
            {common.paste}
          </Button>
          <Button onClick={handleClear} size="sm" variant="outline">
            {common.clear}
          </Button>
        </div>
      </div>

      {/* Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{toolT.inputText}</label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={toolT.placeholder}
          className="min-h-[200px] sm:min-h-[400px] text-base"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-primary">{stats.chars.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">{toolT.characters}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-primary">{stats.charsNoSpaces.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">{toolT.charactersNoSpaces}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-primary">{stats.words.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">{toolT.words}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-primary">{stats.sentences.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">{toolT.sentences}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-primary">{stats.paragraphs.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">{toolT.paragraphs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-primary">{stats.lines.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">{toolT.lines}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-primary">{stats.readingMinutes}</div>
            <div className="text-xs text-muted-foreground mt-1">{toolT.readingTime}</div>
          </CardContent>
        </Card>
      </div>

      {/* Word Frequency */}
      {wordFrequency.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">{toolT.topWords}</h3>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">{toolT.word}</th>
                  <th className="text-right px-3 py-2 font-medium">{toolT.count}</th>
                  <th className="text-right px-3 py-2 font-medium">{toolT.frequency}</th>
                </tr>
              </thead>
              <tbody>
                {wordFrequency.map(([word, count], idx) => (
                  <tr key={idx} className="border-t border-border">
                    <td className="px-3 py-2 font-mono">{word}</td>
                    <td className="px-3 py-2 text-right">{count}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {((count / stats.words) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Character Frequency */}
      {charFrequency.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">{toolT.topCharacters}</h3>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">{toolT.character}</th>
                  <th className="text-right px-3 py-2 font-medium">{toolT.count}</th>
                  <th className="text-right px-3 py-2 font-medium">{toolT.frequency}</th>
                </tr>
              </thead>
              <tbody>
                {charFrequency.map(([char, count], idx) => (
                  <tr key={idx} className="border-t border-border">
                    <td className="px-3 py-2 font-mono">{char}</td>
                    <td className="px-3 py-2 text-right">{count}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {((count / stats.charsNoSpaces) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
