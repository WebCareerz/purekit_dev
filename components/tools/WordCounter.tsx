"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface WordCounterProps {
  t: Record<string, unknown>;
}

export default function WordCounter({ t }: WordCounterProps) {
  const common = t.common as Record<string, string>;
  const toolT = (t.tools as Record<string, Record<string, string>>)[
    "word-counter"
  ];

  const [input, setInput] = useState("");

  const stats = useMemo(() => {
    const text = input;
    
    // Character count (total)
    const characters = text.length;
    
    // Character count (excluding spaces)
    const charactersNoSpaces = text.replace(/\s/g, "").length;
    
    // Word count
    const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
    
    // Sentence count (rough approximation)
    const sentences = text.trim() === "" ? 0 : text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
    
    // Paragraph count
    const paragraphs = text.trim() === "" ? 0 : text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
    
    // Line count
    const lines = text ? text.split("\n").length : 0;
    
    // Reading time (avg 200 words per minute)
    const readingTimeMin = Math.ceil(words / 200);
    
    // Speaking time (avg 130 words per minute)
    const speakingTimeMin = Math.ceil(words / 130);
    
    return {
      characters,
      charactersNoSpaces,
      words,
      sentences,
      paragraphs,
      lines,
      readingTimeMin,
      speakingTimeMin,
    };
  }, [input]);

  const wordFrequency = useMemo(() => {
    if (!input.trim()) return [];
    
    const words = input.toLowerCase().match(/\b[\w']+\b/g) || [];
    const freq = new Map<string, number>();
    
    for (const word of words) {
      if (word.length > 2) { // Ignore very short words
        freq.set(word, (freq.get(word) || 0) + 1);
      }
    }
    
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [input]);

  const charFrequency = useMemo(() => {
    if (!input) return [];
    
    const freq = new Map<string, number>();
    for (const char of input) {
      if (char !== " " && char !== "\n" && char !== "\t") {
        freq.set(char, (freq.get(char) || 0) + 1);
      }
    }
    
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [input]);

  const handleClear = useCallback(() => {
    setInput("");
  }, []);

  const handlePaste = useCallback(async () => {
    const text = await navigator.clipboard.readText();
    setInput(text);
  }, []);

  const StatCard = ({ label, value }: { label: string; value: string | number }) => (
    <div className="border border-border rounded-lg p-4 bg-muted/30">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );

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
        <label className="text-sm font-medium">{toolT.textInput}</label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={toolT.textPlaceholder}
          className="min-h-[200px] sm:min-h-[400px]"
        />
      </div>

      {/* Statistics */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">{toolT.statistics}</h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <StatCard label={toolT.characters} value={stats.characters.toLocaleString()} />
          <StatCard label={toolT.charactersNoSpaces} value={stats.charactersNoSpaces.toLocaleString()} />
          <StatCard label={toolT.words} value={stats.words.toLocaleString()} />
          <StatCard label={toolT.sentences} value={stats.sentences.toLocaleString()} />
          <StatCard label={toolT.paragraphs} value={stats.paragraphs.toLocaleString()} />
          <StatCard label={toolT.lines} value={stats.lines.toLocaleString()} />
          <StatCard 
            label={toolT.readingTime} 
            value={stats.readingTimeMin === 1 ? `${stats.readingTimeMin} min` : `${stats.readingTimeMin} mins`}
          />
          <StatCard 
            label={toolT.speakingTime} 
            value={stats.speakingTimeMin === 1 ? `${stats.speakingTimeMin} min` : `${stats.speakingTimeMin} mins`}
          />
        </div>
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
                      {((count / stats.charactersNoSpaces) * 100).toFixed(1)}%
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
