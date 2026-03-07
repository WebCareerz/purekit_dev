import { getDictionary, locales, type Locale } from "@/lib/i18n";
import { generateSEO } from "@/lib/seo";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import YamlJsonTomlConverter from "@/components/tools/YamlJsonTomlConverter";

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
  const toolT = (t.tools as Record<string, Record<string, unknown>>)["yaml-json-toml-converter"];

  return generateSEO({
    title: toolT.title as string,
    description: toolT.description as string,
    path: `/${lang}/yaml-json-toml-converter/`,
    lang: lang as Locale,
    keywords: toolT.keywords as string[],
  });
}

export default async function YamlJsonTomlConverterPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = await getDictionary(lang as Locale);

  return (
    <ToolPageLayout lang={lang as Locale} toolSlug="yaml-json-toml-converter" t={t}>
      <YamlJsonTomlConverter t={t} />
    </ToolPageLayout>
  );
}
