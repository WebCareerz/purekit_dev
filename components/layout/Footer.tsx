import Link from "next/link";
import { type Locale } from "@/lib/i18n";

interface FooterProps {
  lang: Locale;
  t: Record<string, unknown>;
}

export default function Footer({ lang, t }: FooterProps) {
  const footer = t.footer as Record<string, string>;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Privacy */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">{footer.privacyTitle}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {footer.privacyText}
            </p>
          </div>

          {/* How it works */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">{footer.howItWorks}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {footer.howItWorksText}
            </p>
          </div>

          {/* Legal & Contact links */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">{footer.linksTitle}</h3>
            <nav className="flex flex-col gap-2">
              <Link
                href={`/${lang}/privacy/`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {footer.privacyPolicy}
              </Link>
              <Link
                href={`/${lang}/terms/`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {footer.termsOfService}
              </Link>
              <Link
                href={`/${lang}/contact/`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {footer.contact}
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-muted-foreground">
            {footer.copyright.replace("{year}", String(year))}
          </p>
          <p className="text-xs text-muted-foreground">{footer.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
