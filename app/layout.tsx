import Script from "next/script";
import "./globals.css";
import { defaultLocale, getDictionary } from "@/lib/i18n";
import { SITE_URL } from "@/lib/seo";
import { ANALYTICS_INIT, ANALYTICS_SCRIPT_SRC } from "@/lib/analytics";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const lang = defaultLocale;

export async function generateMetadata() {
  const t = await getDictionary(lang);

  return {
    title: {
      default: t.meta.siteTitle,
      template: t.meta.titleTemplate,
    },
    description: t.meta.siteDescription,
    metadataBase: new URL(SITE_URL),
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getDictionary(lang);

  return (
    <html lang={lang}>
      <body className="font-sans antialiased min-h-screen flex flex-col bg-background text-foreground">
        <Header lang={lang} t={t} />
        <main className="flex-1">{children}</main>
        <Footer lang={lang} t={t} />
      </body>
      <Script src={ANALYTICS_SCRIPT_SRC} />
      <Script id="site-init">{ANALYTICS_INIT}</Script>
    </html>
  );
}
