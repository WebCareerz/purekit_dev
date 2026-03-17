import Link from "next/link";
import { type Locale } from "@/lib/i18n";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Braces,
  FileCode,
  FilePlus,
  Fingerprint,
  ShieldCheck,
} from "lucide-react";

const iconMap = {
  Braces,
  FileCode,
  FilePlus,
  Fingerprint,
  ShieldCheck,
};

const popularToolSlugs = [
  "json-formatter",
  "base64-encode-decode",
  "pdf-merge",
  "uuid-generator",
  "hash-generator",
];

interface MostPopularToolsProps {
  lang: Locale;
  t: Record<string, unknown>;
}

export default function MostPopularTools({ lang, t }: MostPopularToolsProps) {
  const home = t.home as Record<string, string>;
  const toolsT = t.tools as Record<string, Record<string, string>>;

  return (
    <section className="mb-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{home.mostPopular}</h2>
        <p className="text-muted-foreground">{home.mostPopularSubtitle}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {popularToolSlugs.map((slug) => {
          const toolT = toolsT[slug];
          if (!toolT) return null;

          const iconName = slug === "json-formatter" ? "Braces"
            : slug === "base64-encode-decode" ? "FileCode"
            : slug === "pdf-merge" ? "FilePlus"
            : slug === "uuid-generator" ? "Fingerprint"
            : "ShieldCheck";

          const Icon = iconMap[iconName];

          return (
            <Link key={slug} href={`/${lang}/${slug}/`}>
              <Card className="h-full transition-all hover:border-primary hover:shadow-md cursor-pointer group">
                <CardHeader className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg leading-tight mb-1.5">
                        {toolT.name}
                      </CardTitle>
                      <CardDescription className="text-sm line-clamp-2">
                        {toolT.shortDescription}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
