import { defaultLocale, getDictionary } from "@/lib/i18n";
import { generateSEO } from "@/lib/seo";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import GzipCompressDecompress from "@/components/tools/GzipCompressDecompress";

const lang = defaultLocale;

export async function generateMetadata() {
  const t = await getDictionary(lang);
  const toolT = (t.tools as Record<string, Record<string, unknown>>)[
    "gzip-compress-decompress"
  ];

  return generateSEO({
    title: toolT.metaTitle as string,
    description: toolT.metaDescription as string,
    path: "/gzip-compress-decompress/",
    lang,
    keywords: toolT.keywords as string[],
  });
}

export default async function GzipCompressDecompressPage() {
  const t = await getDictionary(lang);

  return (
    <ToolPageLayout lang={lang} toolSlug="gzip-compress-decompress" t={t}>
      <GzipCompressDecompress t={t} />
    </ToolPageLayout>
  );
}
