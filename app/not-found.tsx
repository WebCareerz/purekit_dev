import Link from "next/link";
import { defaultLocale } from "@/lib/i18n";

export default function NotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4 px-4">
          <h1 className="text-6xl font-bold">404</h1>
          <p className="text-xl text-muted-foreground">Page not found</p>
          <Link
            href={`/${defaultLocale}/`}
            className="inline-block mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
          >
            Go Home
          </Link>
        </div>
      </body>
    </html>
  );
}
