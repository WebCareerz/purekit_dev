import { getDictionary, locales, type Locale } from "@/lib/i18n";
import { generateSEO } from "@/lib/seo";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import HtmlFormatter from "@/components/tools/HtmlFormatter";

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
    "html-formatter"
  ];

  return generateSEO({
    title: toolT.metaTitle as string,
    description: toolT.metaDescription as string,
    path: `/${lang}/html-formatter/`,
    lang: lang as Locale,
    keywords: toolT.keywords as string[],
  });
}

export default async function HtmlFormatterPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = await getDictionary(lang as Locale);

  return (
    <ToolPageLayout lang={lang as Locale} toolSlug="html-formatter" t={t}>
      <HtmlFormatter t={t} />
    </ToolPageLayout>
  );
}
