import { getDictionary, locales, type Locale } from "@/lib/i18n";
import { generateSEO } from "@/lib/seo";
import { Badge } from "@/components/ui/badge";
import ToolGrid from "@/components/tools/ToolGrid";

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
  const meta = t.meta as Record<string, string>;

  return generateSEO({
    title: meta.siteTitle,
    description: meta.siteDescription,
    path: `/${lang}/`,
    lang: lang as Locale,
    keywords: meta.keywords as unknown as string[],
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = await getDictionary(lang as Locale);
  const home = t.home as Record<string, string>;
  const toolsT = t.tools as Record<string, Record<string, string>>;
  const navCategories = (t.nav as Record<string, unknown>)
    .categories as Record<string, string>;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-10 space-y-4">
        <Badge variant="secondary" className="mb-2">
          {home.badge}
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          {home.title}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {home.subtitle}
        </p>
      </div>

      {/* Tools with search */}
      <ToolGrid
        lang={lang as Locale}
        toolsT={toolsT}
        navCategories={navCategories}
        searchPlaceholder={home.searchPlaceholder}
        noResults={home.noResults}
      />
    </div>
  );
}
