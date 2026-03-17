"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import CopyButton from "./CopyButton";

interface LoremIpsumGeneratorProps {
  t: Record<string, unknown>;
}

const WORDS = [
  "lorem","ipsum","dolor","sit","amet","consectetur","adipiscing","elit",
  "sed","do","eiusmod","tempor","incididunt","ut","labore","et","dolore",
  "magna","aliqua","enim","ad","minim","veniam","quis","nostrud",
  "exercitation","ullamco","laboris","nisi","aliquip","ex","ea","commodo",
  "consequat","duis","aute","irure","in","reprehenderit","voluptate",
  "velit","esse","cillum","fugiat","nulla","pariatur","excepteur","sint",
  "occaecat","cupidatat","non","proident","sunt","culpa","qui","officia",
  "deserunt","mollit","anim","id","est","laborum","porta","nibh","venenatis",
  "cras","pulvinar","mattis","nunc","sapien","faucibus","ornare","suspendisse",
  "interdum","posuere","malesuada","fames","ac","ante","primis","morbi",
  "tristique","senectus","netus","turpis","egestas","maecenas","pharetra",
  "convallis","vestibulum","pellentesque","habitant","diam","vulputate",
  "arcu","dictum","varius","duis","massa","ultricies","leo","integer",
  "feugiat","scelerisque","varius","morbi","blandit","cursus","risus",
];

function randomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function generateSentence(minWords = 5, maxWords = 15): string {
  const count = minWords + Math.floor(Math.random() * (maxWords - minWords + 1));
  const words = Array.from({ length: count }, () => randomWord());
  words[0] = capitalize(words[0]);
  return words.join(" ") + ".";
}

function generateParagraph(sentences = 5): string {
  return Array.from({ length: sentences }, () => generateSentence()).join(" ");
}

type Mode = "paragraphs" | "sentences" | "words";

export default function LoremIpsumGenerator({ t }: LoremIpsumGeneratorProps) {
  const toolT = (t.tools as Record<string, Record<string, string>>)["lorem-ipsum-generator"];

  const [mode, setMode] = useState<Mode>("paragraphs");
  const [count, setCount] = useState(3);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [output, setOutput] = useState("");

  const generate = useCallback(() => {
    let result = "";
    if (mode === "paragraphs") {
      const paras = Array.from({ length: count }, () => generateParagraph());
      if (startWithLorem && paras.length > 0) {
        paras[0] = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " + paras[0];
      }
      result = paras.join("\n\n");
    } else if (mode === "sentences") {
      const sents = Array.from({ length: count }, () => generateSentence());
      if (startWithLorem && sents.length > 0) {
        sents[0] = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
      }
      result = sents.join(" ");
    } else {
      const words = Array.from({ length: count }, () => randomWord());
      if (startWithLorem && words.length >= 2) {
        words[0] = "lorem";
        words[1] = "ipsum";
      }
      result = words.join(" ");
    }
    setOutput(result);
  }, [mode, count, startWithLorem]);

  const wordCount = output ? output.split(/\s+/).filter(Boolean).length : 0;
  const charCount = output.length;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="border border-border rounded-lg p-4 bg-muted/30 space-y-4">
        <div className="flex flex-col gap-3">
          {/* Mode */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-sm font-medium">{toolT.type}</label>
            <SegmentedControl
              options={[
                { label: toolT.paragraphs, value: "paragraphs" as Mode },
                { label: toolT.sentences, value: "sentences" as Mode },
                { label: toolT.words, value: "words" as Mode },
              ]}
              value={mode}
              onChange={setMode}
              size="sm"
            />
          </div>

          {/* Count & Start with Lorem */}
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">{toolT.count}</label>
              <input
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
                className="w-20 rounded border border-border bg-background px-2 py-1 text-sm"
              />
            </div>

            <button
              type="button"
              onClick={() => setStartWithLorem(!startWithLorem)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                startWithLorem
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {toolT.startWithLorem}
            </button>
          </div>
        </div>

        <Button onClick={generate} size="sm">
          {toolT.generate}
        </Button>
      </div>

      {/* Output */}
      {output && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{wordCount} {toolT.wordsLabel} · {charCount} {toolT.charsLabel}</span>
            <CopyButton text={output} copyLabel={(t.common as Record<string,string>).copy} copiedLabel={(t.common as Record<string,string>).copied} />
          </div>
          <div className="border border-border rounded-lg p-4 bg-background whitespace-pre-wrap text-sm leading-relaxed max-h-[500px] overflow-y-auto">
            {output}
          </div>
        </div>
      )}
    </div>
  );
}
