import { getDictionary, locales, type Locale } from "@/lib/i18n";
import { generateSEO } from "@/lib/seo";

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
  const page = t.terms as Record<string, string>;

  return generateSEO({
    title: page.metaTitle,
    description: page.metaDescription,
    path: `/${lang}/terms/`,
    lang: lang as Locale,
  });
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = await getDictionary(lang as Locale);
  const page = t.terms as {
    title: string;
    lastUpdated: string;
    intro: string;
    sections: { heading: string; content: string }[];
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-2">{page.title}</h1>
      <p className="text-sm text-muted-foreground mb-8">{page.lastUpdated}</p>
      <p className="text-muted-foreground mb-8 leading-relaxed">{page.intro}</p>

      <div className="space-y-8">
        {page.sections.map((section, i) => (
          <section key={i}>
            <h2 className="text-lg font-semibold mb-2">{section.heading}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {section.content}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
