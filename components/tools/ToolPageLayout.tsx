import { type Locale } from "@/lib/i18n";
import { SITE_URL, generateWebApplicationSchema, generateFAQSchema } from "@/lib/seo";
import { getRelatedTools } from "@/lib/tools";
import { Badge } from "@/components/ui/badge";
import RelatedTools from "./RelatedTools";

interface ToolPageLayoutProps {
  lang: Locale;
  toolSlug: string;
  t: Record<string, unknown>;
  children: React.ReactNode;
}

export default function ToolPageLayout({
  lang,
  toolSlug,
  t,
  children,
}: ToolPageLayoutProps) {
  const toolsT = t.tools as Record<string, Record<string, unknown>>;
  const toolT = toolsT[toolSlug];
  const common = t.common as Record<string, string>;

  const name = toolT.name as string;
  const shortDescription = toolT.shortDescription as string;
  const features = toolT.features as { title: string; items: string[] };
  const howToUse = toolT.howToUse as { title: string; steps: string[] };
  const faq = toolT.faq as { question: string; answer: string }[];

  const relatedTools = getRelatedTools(toolSlug);

  const webAppSchema = generateWebApplicationSchema({
    name,
    description: shortDescription,
    url: `${SITE_URL}/${lang}/${toolSlug}/`,
  });

  const faqSchema = faq?.length ? generateFAQSchema(faq) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* Header */}
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {name}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-muted-foreground">{shortDescription}</p>
          <Badge variant="outline" className="text-xs shrink-0">
            {common.processedLocally}
          </Badge>
        </div>
      </div>

      {/* Tool Area */}
      <div className="mb-12">{children}</div>

      {/* Features */}
      {features && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">{features.title}</h2>
          <ul className="space-y-2">
            {features.items.map((item, i) => (
              <li key={i} className="flex gap-2 text-muted-foreground">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5 shrink-0 text-primary mt-0.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* How to Use */}
      {howToUse && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">{howToUse.title}</h2>
          <ol className="space-y-3">
            {howToUse.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-muted-foreground">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* FAQ */}
      {faq && faq.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">{common.faq}</h2>
          <div className="space-y-4">
            {faq.map((item, i) => (
              <div key={i} className="border border-border rounded-lg p-4">
                <h3 className="font-medium mb-2">{item.question}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related Tools */}
      {relatedTools.length > 0 && (
        <RelatedTools
          lang={lang}
          relatedTools={relatedTools}
          t={t}
          title={common.relatedTools}
        />
      )}
    </div>
  );
}
