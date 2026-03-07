import { getDictionary, locales, type Locale } from "@/lib/i18n";
import { generateSEO } from "@/lib/seo";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import CssBeautifier from "@/components/tools/CssBeautifier";

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
    "css-beautifier"
  ];

  return generateSEO({
    title: toolT.metaTitle as string,
    description: toolT.metaDescription as string,
    path: `/${lang}/css-beautifier/`,
    lang: lang as Locale,
    keywords: toolT.keywords as string[],
  });
}

export default async function CssBeautifierPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = await getDictionary(lang as Locale);

  return (
    <ToolPageLayout lang={lang as Locale} toolSlug="css-beautifier" t={t}>
      <CssBeautifier t={t} />
    </ToolPageLayout>
  );
}
