import { defaultLocale, getDictionary } from "@/lib/i18n";
import { generateSEO } from "@/lib/seo";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import UuidGenerator from "@/components/tools/UuidGenerator";

const lang = defaultLocale;

export async function generateMetadata() {
  const t = await getDictionary(lang);
  const toolT = (t.tools as Record<string, Record<string, unknown>>)[
    "uuid-generator"
  ];

  return generateSEO({
    title: toolT.metaTitle as string,
    description: toolT.metaDescription as string,
    path: "/uuid-generator/",
    lang,
    keywords: toolT.keywords as string[],
  });
}

export default async function UuidGeneratorPage() {
  const t = await getDictionary(lang);

  return (
    <ToolPageLayout lang={lang} toolSlug="uuid-generator" t={t}>
      <UuidGenerator t={t} />
    </ToolPageLayout>
  );
}
