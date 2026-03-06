import type { Metadata } from "next";
import { locales, ogLocales, type Locale } from "./i18n";

export const SITE_URL = "https://www.purekit.dev";

interface SEOParams {
  title: string;
  description: string;
  path: string;
  lang: Locale;
  keywords?: string[];
}

export function generateSEO({
  title,
  description,
  path,
  lang,
  keywords,
}: SEOParams): Metadata {
  const url = `${SITE_URL}${path}`;

  return {
    title: { absolute: title },
    description,
    keywords,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(
          locales.map((l) => [l, `${SITE_URL}/${l}${path.replace(`/${lang}`, "")}`])
        ),
        "x-default": `${SITE_URL}/${locales[0]}${path.replace(`/${lang}`, "")}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "PureKit",
      locale: ogLocales[lang],
      type: "website",
      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: "PureKit - Developer Tools",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/og-image.png`],
    },
  };
}

interface WebAppSchemaParams {
  name: string;
  description: string;
  url: string;
}

export function generateWebApplicationSchema({
  name,
  description,
  url,
}: WebAppSchemaParams) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    description,
    url,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    browserRequirements: "Requires JavaScript",
  };
}

export function generateFAQSchema(
  faq: { question: string; answer: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
