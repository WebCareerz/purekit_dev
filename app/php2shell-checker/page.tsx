import { defaultLocale, getDictionary } from "@/lib/i18n";
import { generateSEO } from "@/lib/seo";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import Php2ShellChecker from "@/components/tools/Php2ShellChecker";

const lang = defaultLocale;

export async function generateMetadata() {
  const t = await getDictionary(lang);
  const toolT = (t.tools as Record<string, Record<string, unknown>>)["php2shell-checker"];

  return generateSEO({
    title: toolT.metaTitle as string,
    description: toolT.metaDescription as string,
    path: "/php2shell-checker/",
    lang,
    keywords: toolT.keywords as string[],
  });
}

export default async function Php2ShellCheckerPage() {
  const t = await getDictionary(lang);

  return (
    <ToolPageLayout lang={lang} toolSlug="php2shell-checker" t={t}>
      <Php2ShellChecker lang={lang} t={t} />
    </ToolPageLayout>
  );
}
