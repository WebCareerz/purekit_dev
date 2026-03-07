import { getDictionary, locales, type Locale } from "@/lib/i18n";
import { generateSEO } from "@/lib/seo";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import SqlFormatter from "@/components/tools/SqlFormatter";

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
  const toolT = (t.tools as Record<string, Record<string, unknown>>)["sql-formatter"];

  return generateSEO({
    title: toolT.title as string,
    description: toolT.description as string,
    path: `/${lang}/sql-formatter/`,
    lang: lang as Locale,
    keywords: toolT.keywords as string[],
  });
}

export default async function SqlFormatterPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = await getDictionary(lang as Locale);

  return (
    <ToolPageLayout lang={lang as Locale} toolSlug="sql-formatter" t={t}>
      <SqlFormatter t={t} />
    </ToolPageLayout>
  );
}
