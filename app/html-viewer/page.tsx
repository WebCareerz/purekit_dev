import { defaultLocale, getDictionary } from "@/lib/i18n";
import { generateSEO } from "@/lib/seo";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import HtmlViewer from "@/components/tools/HtmlViewer";

const lang = defaultLocale;

export async function generateMetadata() {
  const t = await getDictionary(lang);
  const toolT = (t.tools as Record<string, Record<string, unknown>>)[
    "html-viewer"
  ];

  return generateSEO({
    title: toolT.metaTitle as string,
    description: toolT.metaDescription as string,
    path: "/html-viewer/",
    lang,
    keywords: toolT.keywords as string[],
  });
}

export default async function HtmlViewerPage() {
  const t = await getDictionary(lang);

  return (
    <ToolPageLayout lang={lang} toolSlug="html-viewer" t={t}>
      <HtmlViewer t={t} />
    </ToolPageLayout>
  );
}
