import Link from "next/link";
import { type Locale } from "@/lib/i18n";
import { type ToolDefinition } from "@/lib/tools";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface RelatedToolsProps {
  lang: Locale;
  relatedTools: ToolDefinition[];
  t: Record<string, unknown>;
  title: string;
}

export default function RelatedTools({
  lang,
  relatedTools,
  t,
  title,
}: RelatedToolsProps) {
  const toolsT = t.tools as Record<string, Record<string, string>>;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatedTools.map((tool) => {
          const toolT = toolsT[tool.slug];
          return (
            <Link key={tool.slug} href={`/${lang}/${tool.slug}/`}>
              <Card className="h-full transition-colors hover:border-primary/50 hover:shadow-sm cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-base">
                    {toolT?.name || tool.slug}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {toolT?.shortDescription || ""}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
