import { notFound } from "next/navigation";
import { isValidLocale, getDictionary, locales, type Locale } from "@/lib/i18n";
import { SITE_URL } from "@/lib/seo";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) return {};
  const t = await getDictionary(lang);

  return {
    title: {
      default: t.meta.siteTitle,
      template: t.meta.titleTemplate,
    },
    description: t.meta.siteDescription,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: `${SITE_URL}/${lang}/`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `${SITE_URL}/${l}/`])
      ),
    },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();

  const t = await getDictionary(lang as Locale);

  return (
    <html lang={lang}>
      <body className="font-sans antialiased min-h-screen flex flex-col bg-background text-foreground">
        <Header lang={lang as Locale} t={t} />
        <main className="flex-1">{children}</main>
        <Footer lang={lang as Locale} t={t} />
      </body>
    </html>
  );
}
