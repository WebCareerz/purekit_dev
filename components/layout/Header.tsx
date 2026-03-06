"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { categories } from "@/lib/tools";
import { type Locale, localeNames } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import SearchDialog from "./SearchDialog";

interface HeaderProps {
  lang: Locale;
  t: Record<string, unknown>;
}

export default function Header({ lang, t }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const nav = t.nav as Record<string, unknown>;
  const navCategories = nav.categories as Record<string, string>;
  const toolsT = t.tools as Record<string, Record<string, string>>;
  const home = t.home as Record<string, string>;

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

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href={`/${lang}/`}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                pathname === `/${lang}/` || pathname === `/${lang}`
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {(nav as Record<string, string>).home}
            </Link>
            {categories.map((category) => (
              <DropdownMenu key={category.key}>
                <DropdownMenuTrigger asChild>
                  <button className="px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                    {navCategories[category.key] || category.key}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {category.tools.map((toolSlug) => {
                    const toolT = toolsT[toolSlug];
                    return (
                      <DropdownMenuItem key={toolSlug} asChild>
                        <Link
                          href={`/${lang}/${toolSlug}/`}
                          className={
                            pathname.includes(toolSlug) ? "font-medium" : ""
                          }
                        >
                          {toolT?.name || toolSlug}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ))}
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

            <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
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

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
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
