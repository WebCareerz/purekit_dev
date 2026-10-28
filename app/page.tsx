import { defaultLocale, getDictionary } from "@/lib/i18n";
import { generateSEO } from "@/lib/seo";
import { Badge } from "@/components/ui/badge";
import ToolGrid from "@/components/tools/ToolGrid";
import MostPopularTools from "@/components/home/MostPopularTools";

const lang = defaultLocale;

export async function generateMetadata() {
  const t = await getDictionary(lang);
  const meta = t.meta as Record<string, string>;

  return generateSEO({
    title: meta.siteTitle,
    description: meta.siteDescription,
    path: "/",
    lang,
    keywords: meta.keywords as unknown as string[],
  });
}

export default async function HomePage() {
  const t = await getDictionary(lang);
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

      {/* Most Popular Tools */}
      <MostPopularTools lang={lang} t={t} />

      {/* Tools with search */}
      <ToolGrid
        lang={lang}
        toolsT={toolsT}
        navCategories={navCategories}
        searchPlaceholder={home.searchPlaceholder}
        noResults={home.noResults}
      />
    </div>
  );
}
