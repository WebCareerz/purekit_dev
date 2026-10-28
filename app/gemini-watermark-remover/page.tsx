import { defaultLocale, getDictionary } from "@/lib/i18n";
import { generateSEO } from "@/lib/seo";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import GeminiWatermarkRemover from "@/components/tools/GeminiWatermarkRemover";

const lang = defaultLocale;

export async function generateMetadata() {
  const t = await getDictionary(lang);
  const toolT = (t.tools as Record<string, Record<string, unknown>>)["gemini-watermark-remover"];

  return generateSEO({
    title: toolT.metaTitle as string,
    description: toolT.metaDescription as string,
    path: "/gemini-watermark-remover/",
    lang,
    keywords: toolT.keywords as string[],
  });
}

export default async function GeminiWatermarkRemoverPage() {
  const t = await getDictionary(lang);

  return (
    <ToolPageLayout lang={lang} toolSlug="gemini-watermark-remover" t={t}>
      <GeminiWatermarkRemover t={t} />
    </ToolPageLayout>
  );
}
