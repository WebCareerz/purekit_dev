import { defaultLocale, getDictionary } from "@/lib/i18n";
import { generateSEO } from "@/lib/seo";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import JsonDiff from "@/components/tools/JsonDiff";

const lang = defaultLocale;

export async function generateMetadata() {
  const t = await getDictionary(lang);
  const toolT = (t.tools as Record<string, Record<string, unknown>>)["json-diff"];

  return generateSEO({
    title: toolT.metaTitle as string,
    description: toolT.metaDescription as string,
    path: "/json-diff/",
    lang,
    keywords: toolT.keywords as string[],
  });
}

export default async function JsonDiffPage() {
  const t = await getDictionary(lang);

  return (
    <ToolPageLayout lang={lang} toolSlug="json-diff" t={t}>
      <JsonDiff t={t} />
    </ToolPageLayout>
  );
}
