import { getDictionary, locales, type Locale } from "@/lib/i18n";
import { generateSEO } from "@/lib/seo";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import CharacterCounter from "@/components/tools/CharacterCounter";

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
  const toolT = (t.tools as Record<string, Record<string, unknown>>)[
    "character-counter"
  ];

  return generateSEO({
    title: toolT.metaTitle as string,
    description: toolT.metaDescription as string,
    path: `/${lang}/character-counter/`,
    lang: lang as Locale,
    keywords: toolT.keywords as string[],
  });
}

export default async function CharacterCounterPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = await getDictionary(lang as Locale);

  return (
    <ToolPageLayout lang={lang as Locale} toolSlug="character-counter" t={t}>
      <CharacterCounter t={t} />
    </ToolPageLayout>
  );
}
