import { getDictionary, locales, type Locale } from "@/lib/i18n";
import { generateSEO } from "@/lib/seo";
import Link from "next/link";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = await getDictionary(lang as Locale);
  const page = t.itToolsAlternative as Record<string, string>;

  return generateSEO({
    title: page.metaTitle,
    description: page.metaDescription,
    path: `/${lang}/it-tools-alternative/`,
    lang: lang as Locale,
  });
}

export default async function ITToolsAlternativePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = await getDictionary(lang as Locale);
  const page = t.itToolsAlternative as {
    title: string;
    intro: string;
    whyPureKit: string;
    comparisonTitle: string;
    features: { name: string; purekit: boolean; ittools: boolean }[];
    advantages: { title: string; description: string }[];
    ctaTitle: string;
    ctaText: string;
    ctaButton: string;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <h1 className="text-4xl font-bold tracking-tight mb-4">{page.title}</h1>
      <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
        {page.intro}
      </p>

      {/* Why PureKit */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">{page.whyPureKit}</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {page.advantages.map((advantage, i) => (
            <div
              key={i}
              className="p-6 rounded-lg border bg-card text-card-foreground"
            >
              <h3 className="text-lg font-semibold mb-2">{advantage.title}</h3>
              <p className="text-sm text-muted-foreground">
                {advantage.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">{page.comparisonTitle}</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold">Feature</th>
                <th className="text-center py-3 px-4 font-semibold">PureKit</th>
                <th className="text-center py-3 px-4 font-semibold">
                  IT-Tools
                </th>
              </tr>
            </thead>
            <tbody>
              {page.features.map((feature, i) => (
                <tr key={i} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4">{feature.name}</td>
                  <td className="text-center py-3 px-4">
                    {feature.purekit ? (
                      <span className="text-green-600 dark:text-green-400 text-xl">
                        ✓
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400 text-xl">
                        ✗
                      </span>
                    )}
                  </td>
                  <td className="text-center py-3 px-4">
                    {feature.ittools ? (
                      <span className="text-green-600 dark:text-green-400 text-xl">
                        ✓
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400 text-xl">
                        ✗
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA Section */}
      <section className="p-8 rounded-lg border bg-card text-card-foreground text-center">
        <h2 className="text-2xl font-semibold mb-3">{page.ctaTitle}</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          {page.ctaText}
        </p>
        <Link
          href={`/${lang}`}
          className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {page.ctaButton}
        </Link>
      </section>
    </div>
  );
}
