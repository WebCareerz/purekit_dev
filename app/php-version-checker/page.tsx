import { defaultLocale, getDictionary } from "@/lib/i18n";
import { generateSEO } from "@/lib/seo";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import PhpVersionChecker from "@/components/tools/PhpVersionChecker";

const lang = defaultLocale;

export async function generateMetadata() {
  const t = await getDictionary(lang);
  const toolT = (t.tools as Record<string, Record<string, unknown>>)["php-version-checker"];

  return generateSEO({
    title: toolT.metaTitle as string,
    description: toolT.metaDescription as string,
    path: "/php-version-checker/",
    lang,
    keywords: toolT.keywords as string[],
  });
}

export default async function PhpVersionCheckerPage() {
  const t = await getDictionary(lang);

  return (
    <ToolPageLayout lang={lang} toolSlug="php-version-checker" t={t}>
      <PhpVersionChecker lang={lang} t={t} />
    </ToolPageLayout>
  );
}
