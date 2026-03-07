import { getDictionary, locales, type Locale } from "@/lib/i18n";
import { generateSEO } from "@/lib/seo";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import JsonToCsvConverter from "@/components/tools/JsonToCsvConverter";

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
    "json-to-csv-converter"
  ];

  return generateSEO({
    title: toolT.metaTitle as string,
    description: toolT.metaDescription as string,
    path: `/${lang}/json-to-csv-converter/`,
    lang: lang as Locale,
    keywords: toolT.keywords as string[],
  });
}

export default async function JsonToCsvConverterPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = await getDictionary(lang as Locale);

  return (
    <ToolPageLayout lang={lang as Locale} toolSlug="json-to-csv-converter" t={t}>
      <JsonToCsvConverter t={t} />
    </ToolPageLayout>
  );
}
