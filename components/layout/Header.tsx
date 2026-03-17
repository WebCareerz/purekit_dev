"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { categories } from "@/lib/tools";
import { type Locale, localeNames } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SearchDialog from "./SearchDialog";

interface HeaderProps {
  lang: Locale;
  t: Record<string, unknown>;
}

export default function Header({ lang, t }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = usePathname();
  const nav = t.nav as Record<string, unknown>;
  const navCategories = nav.categories as Record<string, string>;
  const toolsT = t.tools as Record<string, Record<string, string>>;
  const home = t.home as Record<string, string>;

  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openDropdown]);

  // Top 3 categories shown directly, rest under "More"
  const primaryKeys = ["formatters", "encodersDecoders", "pdfTools"];
  const primaryCategories = categories.filter((c) =>
    primaryKeys.includes(c.key)
  );
  const moreCategories = categories.filter(
    (c) => !primaryKeys.includes(c.key)
  );

  const isCategoryActive = (category: { tools: string[] }) =>
    category.tools.some((slug) => pathname.includes(slug));

  const isMoreActive = moreCategories.some((c) => isCategoryActive(c));

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href={`/${lang}/`}
            className="flex items-center gap-2 font-semibold text-lg shrink-0"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-primary"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5Z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span>PureKit</span>
          </Link>

          {/* Desktop Nav — 3 primary categories + More */}
          <nav className="hidden md:flex items-center gap-0.5" ref={navRef}>
            {primaryCategories.map((category) => {
              const isOpen = openDropdown === category.key;
              const isActive = isCategoryActive(category);

              return (
                <div key={category.key} className="relative">
                  <button
                    onClick={() =>
                      setOpenDropdown(isOpen ? null : category.key)
                    }
                    className={`flex items-center gap-1 px-3 py-2 text-sm rounded-md transition-colors ${
                      isOpen || isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    {navCategories[category.key] || category.key}
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`size-3 opacity-50 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="absolute top-full left-0 mt-1 z-50 min-w-[200px] rounded-lg border border-border bg-background shadow-lg py-1">
                      {category.tools.map((toolSlug) => {
                        const toolT = toolsT[toolSlug];
                        const isToolActive = pathname.includes(toolSlug);
                        return (
                          <Link
                            key={toolSlug}
                            href={`/${lang}/${toolSlug}/`}
                            className={`block px-3 py-1.5 text-sm transition-colors ${
                              isToolActive
                                ? "bg-accent font-medium text-accent-foreground"
                                : "text-foreground hover:bg-accent"
                            }`}
                            onClick={() => setOpenDropdown(null)}
                          >
                            {toolT?.name || toolSlug}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* More dropdown */}
            <div className="relative">
              <button
                onClick={() =>
                  setOpenDropdown(openDropdown === "_more" ? null : "_more")
                }
                className={`flex items-center gap-1 px-3 py-2 text-sm rounded-md transition-colors ${
                  openDropdown === "_more" || isMoreActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {(nav as Record<string, string>).more}
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`size-3 opacity-50 transition-transform ${openDropdown === "_more" ? "rotate-180" : ""}`}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {openDropdown === "_more" && (
                <div className="absolute top-full right-0 mt-1 z-50 w-[480px] max-h-[70vh] overflow-y-auto rounded-lg border border-border bg-background shadow-lg p-3">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {moreCategories.map((category) => (
                      <div key={category.key}>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {navCategories[category.key] || category.key}
                        </div>
                        <div className="mt-0.5">
                          {category.tools.map((toolSlug) => {
                            const toolT = toolsT[toolSlug];
                            const isToolActive = pathname.includes(toolSlug);
                            return (
                              <Link
                                key={toolSlug}
                                href={`/${lang}/${toolSlug}/`}
                                className={`block px-2 py-1.5 text-sm rounded-md transition-colors ${
                                  isToolActive
                                    ? "bg-accent font-medium text-accent-foreground"
                                    : "text-foreground hover:bg-accent"
                                }`}
                                onClick={() => setOpenDropdown(null)}
                              >
                                {toolT?.name || toolSlug}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <SearchDialog
              lang={lang}
              toolsT={toolsT}
              navCategories={navCategories}
              searchPlaceholder={home.searchPlaceholder}
              searchHint={home.searchHint}
              noResults={home.noResults}
            />

            <Badge
              variant="secondary"
              className="text-xs hidden sm:inline-flex"
            >
              {localeNames[lang]}
            </Badge>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                {mobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="4" y1="8" x2="20" y2="8" />
                    <line x1="4" y1="16" x2="20" y2="16" />
                  </>
                )}
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile / Tablet menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background max-h-[70vh] overflow-y-auto">
          <div className="px-4 py-3 space-y-3">
            <Link
              href={`/${lang}/`}
              className="block px-3 py-2 text-sm rounded-md hover:bg-accent"
              onClick={() => setMobileMenuOpen(false)}
            >
              {(nav as Record<string, string>).home}
            </Link>
            {categories.map((category) => (
              <div key={category.key}>
                <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {navCategories[category.key] || category.key}
                </div>
                {category.tools.map((toolSlug) => {
                  const toolT = toolsT[toolSlug];
                  return (
                    <Link
                      key={toolSlug}
                      href={`/${lang}/${toolSlug}/`}
                      className={`block px-3 py-2 text-sm rounded-md hover:bg-accent ml-2 ${
                        pathname.includes(toolSlug)
                          ? "bg-accent font-medium"
                          : ""
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {toolT?.name || toolSlug}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
