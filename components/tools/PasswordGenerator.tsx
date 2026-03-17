"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import CopyButton from "./CopyButton";

interface PasswordGeneratorProps {
  t: Record<string, unknown>;
}

type CommonT = Record<string, string>;

const LENGTHS = [8, 12, 16, 20, 24, 32, 48, 64];
const QUANTITIES = [1, 5, 10, 25, 50];

const CHARSETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

function generatePassword(length: number, options: Record<string, boolean>): string {
  let chars = "";
  if (options.uppercase) chars += CHARSETS.uppercase;
  if (options.lowercase) chars += CHARSETS.lowercase;
  if (options.numbers) chars += CHARSETS.numbers;
  if (options.symbols) chars += CHARSETS.symbols;
  if (!chars) chars = CHARSETS.lowercase + CHARSETS.numbers;

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (n) => chars[n % chars.length]).join("");
}

function getStrength(password: string): { label: string; color: string; width: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 20) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { label: "Weak", color: "bg-red-500", width: "w-1/6" };
  if (score === 3) return { label: "Fair", color: "bg-yellow-500", width: "w-2/6" };
  if (score === 4) return { label: "Good", color: "bg-orange-500", width: "w-3/6" };
  if (score === 5) return { label: "Strong", color: "bg-blue-500", width: "w-4/6" };
  return { label: "Very Strong", color: "bg-green-500", width: "w-full" };
}

export default function PasswordGenerator({ t }: PasswordGeneratorProps) {
  const toolT = (t.tools as Record<string, Record<string, string>>)["password-generator"];
  const common = t.common as CommonT;

  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [passwords, setPasswords] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  const generate = useCallback(() => {
    const result: string[] = [];
    for (let i = 0; i < quantity; i++) {
      result.push(generatePassword(length, options));
    }
    setPasswords(result);
  }, [length, options, quantity]);

  const toggleOption = (key: string) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const strength = passwords.length > 0 ? getStrength(passwords[0]) : null;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="border border-border rounded-lg p-4 bg-muted/30 space-y-4">
        {/* Length */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">{toolT.length}</label>
          <SegmentedControl
            options={LENGTHS.map((l) => ({ label: String(l), value: l }))}
            value={length}
            onChange={setLength}
            size="sm"
          />
        </div>

        {/* Charset Options */}
        <div className="flex flex-wrap gap-2">
          {Object.keys(CHARSETS).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleOption(key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                options[key as keyof typeof options]
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {toolT[key]}
            </button>
          ))}
        </div>

        {/* Quantity & Generate */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">{toolT.quantity}</label>
            <SegmentedControl
              options={QUANTITIES.map((q) => ({ label: String(q), value: q }))}
              value={quantity}
              onChange={setQuantity}
              size="sm"
            />
          </div>
          <Button onClick={generate} size="lg" className="text-base px-8 py-3 font-semibold">
            {toolT.generate}
          </Button>
        </div>
      </div>

      {/* Strength Meter */}
      {strength && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{toolT.strength}</span>
            <span>{strength.label}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className={`h-full ${strength.color} ${strength.width} transition-all rounded-full`} />
          </div>
        </div>
      )}

      {/* Output */}
      {passwords.length > 0 && (
        <div className="space-y-2">
          {passwords.length > 1 && (
            <div className="flex justify-end">
              <CopyButton text={passwords.join("\n")} copyLabel={toolT.copyAll} copiedLabel={common.copied} />
            </div>
          )}
          <div className="space-y-1">
            {passwords.map((pw, i) => (
              <div
                key={i}
                className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-background font-mono text-sm break-all"
              >
                <span className="flex-1 select-all">{pw}</span>
                <CopyButton text={pw} copyLabel={common.copy} copiedLabel={common.copied} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
