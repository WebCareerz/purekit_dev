import { getDictionary, locales, type Locale } from "@/lib/i18n";
import { generateSEO } from "@/lib/seo";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import GeminiWatermarkRemover from "@/components/tools/GeminiWatermarkRemover";

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
  const toolT = (t.tools as Record<string, Record<string, unknown>>)["gemini-watermark-remover"];

  return generateSEO({
    title: toolT.metaTitle as string,
    description: toolT.metaDescription as string,
    path: `/${lang}/gemini-watermark-remover/`,
    lang: lang as Locale,
    keywords: toolT.keywords as string[],
  });
}

export default async function GeminiWatermarkRemoverPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = await getDictionary(lang as Locale);

  return (
    <ToolPageLayout lang={lang as Locale} toolSlug="gemini-watermark-remover" t={t}>
      <GeminiWatermarkRemover t={t} />
    </ToolPageLayout>
  );
}
