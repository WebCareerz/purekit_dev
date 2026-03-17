import { getDictionary, locales, type Locale } from "@/lib/i18n";
import { generateSEO } from "@/lib/seo";

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
  const page = t.contact as Record<string, string>;

  return generateSEO({
    title: page.metaTitle,
    description: page.metaDescription,
    path: `/${lang}/contact/`,
    lang: lang as Locale,
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = await getDictionary(lang as Locale);
  const page = t.contact as {
    title: string;
    intro: string;
    emailTitle: string;
    emailDescription: string;
    email: string;
    responseTime: string;
    topics: { title: string; items: string[] };
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-4">{page.title}</h1>
      <p className="text-muted-foreground mb-10 leading-relaxed">{page.intro}</p>

      {/* Email */}
      <div className="border border-border rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-2">{page.emailTitle}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {page.emailDescription}
        </p>
        <a
          href={`mailto:${page.email}`}
          className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          {page.email}
        </a>
        <p className="text-xs text-muted-foreground mt-3">
          {page.responseTime}
        </p>
      </div>

      {/* Topics */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{page.topics.title}</h2>
        <ul className="space-y-2">
          {page.topics.items.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5 shrink-0 text-primary mt-0.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
