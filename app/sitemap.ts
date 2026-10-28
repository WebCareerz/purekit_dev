import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { SITE_URL } from "@/lib/seo";
import { allToolSlugs } from "@/lib/tools";

export const dynamic = "force-static";

const staticPages = ["privacy", "terms", "contact"];

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date().toISOString();

  const homeUrls: MetadataRoute.Sitemap = locales.map((locale) => ({
    url: `${SITE_URL}/${locale}/`,
    lastModified: currentDate,
    changeFrequency: "weekly",
    priority: 1.0,
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [l, `${SITE_URL}/${l}/`])
      ),
    },
  }));

  const toolUrls: MetadataRoute.Sitemap = allToolSlugs.flatMap((slug) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/${slug}/`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.9,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${SITE_URL}/${l}/${slug}/`])
        ),
      },
    }))
  );

  const staticUrls: MetadataRoute.Sitemap = staticPages.flatMap((page) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}/${page}/`,
      lastModified: currentDate,
      changeFrequency: "yearly" as const,
      priority: 0.3,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${SITE_URL}/${l}/${page}/`])
        ),
      },
    }))
  );

  return [...homeUrls, ...toolUrls, ...staticUrls];
}
