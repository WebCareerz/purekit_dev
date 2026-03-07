import { getDictionary, locales, type Locale } from "@/lib/i18n";
import { generateSEO } from "@/lib/seo";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import PdfCompress from "@/components/tools/PdfCompress";

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
  const toolT = (t.tools as Record<string, Record<string, unknown>>)["pdf-compress"];

  return generateSEO({
    title: toolT.title as string,
    description: toolT.description as string,
    path: `/${lang}/pdf-compress/`,
    lang: lang as Locale,
    keywords: toolT.keywords as string[],
  });
}

export default async function PdfCompressPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = await getDictionary(lang as Locale);

  return (
    <ToolPageLayout lang={lang as Locale} toolSlug="pdf-compress" t={t}>
      <PdfCompress t={t} />
    </ToolPageLayout>
  );
}
