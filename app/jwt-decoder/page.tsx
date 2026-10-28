import { defaultLocale, getDictionary } from "@/lib/i18n";
import { generateSEO } from "@/lib/seo";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import JwtDecoder from "@/components/tools/JwtDecoder";

const lang = defaultLocale;

export async function generateMetadata() {
  const t = await getDictionary(lang);
  const toolT = (t.tools as Record<string, Record<string, unknown>>)["jwt-decoder"];

  return generateSEO({
    title: toolT.metaTitle as string,
    description: toolT.metaDescription as string,
    path: "/jwt-decoder/",
    lang,
    keywords: toolT.keywords as string[],
  });
}

export default async function JwtDecoderPage() {
  const t = await getDictionary(lang);

  return (
    <ToolPageLayout lang={lang} toolSlug="jwt-decoder" t={t}>
      <JwtDecoder t={t} />
    </ToolPageLayout>
  );
}
