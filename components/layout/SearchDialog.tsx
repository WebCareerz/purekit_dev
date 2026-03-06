"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { categories, tools as toolsRegistry } from "@/lib/tools";
import { type Locale } from "@/lib/i18n";

interface SearchDialogProps {
  lang: Locale;
  toolsT: Record<string, Record<string, string>>;
  navCategories: Record<string, string>;
  searchPlaceholder: string;
  searchHint: string;
  noResults: string;
}

export default function SearchDialog({
  lang,
  toolsT,
  navCategories,
  searchPlaceholder,
  searchHint,
  noResults,
}: SearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const allTools = useMemo(
    () => categories.flatMap((c) => c.tools),
    []
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return allTools;
    const q = query.toLowerCase().trim();
    return allTools.filter((slug) => {
      const tool = toolsRegistry[slug];
      const toolT = toolsT[slug];
      if (!tool || !toolT) return false;
      const name = (toolT.name || "").toLowerCase();
      const desc = (toolT.shortDescription || "").toLowerCase();
      const terms = tool.searchTerms.join(" ").toLowerCase();
      return name.includes(q) || desc.includes(q) || terms.includes(q);
    });
  }, [query, allTools, toolsT]);

  // Cmd+K to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Reset selected index on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const navigate = useCallback(
    (slug: string) => {
      setOpen(false);
      router.push(`/${lang}/${slug}/`);
    },
    [lang, router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        navigate(filtered[selectedIndex]);
      }
    },
    [filtered, selectedIndex, navigate]
  );

  const getCategoryName = (slug: string) => {
    const tool = toolsRegistry[slug];
    if (!tool) return "";
    return navCategories[tool.categoryKey] || tool.categoryKey;
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span>{searchHint}</span>
        <kbd className="ml-1 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      {/* Mobile search icon */}
      <button
        onClick={() => setOpen(true)}
        className="sm:hidden p-2 text-muted-foreground hover:text-foreground"
        aria-label="Search"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>

      {/* Dialog overlay — rendered via portal to escape Header's backdrop-filter stacking context */}
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-md"
            onClick={() => setOpen(false)}
          >
            <div
              className="w-full max-w-lg mx-4 rounded-xl border border-border bg-background shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-muted-foreground shrink-0">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={searchPlaceholder}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[50vh] overflow-y-auto py-2">
                {filtered.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {noResults}
                  </div>
                ) : (
                  filtered.map((slug, index) => {
                    const toolT = toolsT[slug];
                    return (
                      <button
                        key={slug}
                        onClick={() => navigate(slug)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                          index === selectedIndex
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground hover:bg-accent/50"
                        }`}
                      >
                        <span className="font-medium flex-1">
                          {toolT?.name || slug}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {getCategoryName(slug)}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
