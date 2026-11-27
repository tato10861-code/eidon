import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getLocale } from "@/lib/i18n/server";
import { localeMeta } from "@/lib/i18n/config";
import { siteUrl } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Eidon — The AI Employee Company",
    template: "%s · Eidon",
  },
  description:
    "Build, deploy and manage production-ready AI employees that reason, use your tools and finish real work. Sales, data, support, finance, legal, engineering and more.",
  applicationName: "Eidon",
  authors: [{ name: "Eidon Labs" }],
  creator: "Eidon Labs",
  keywords: [
    "AI employees",
    "AI workforce",
    "AI agents",
    "AI sales agent",
    "AI data analyst",
    "AI customer support",
    "AI recruiter",
    "agent platform",
    "AI employee builder",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Eidon",
    title: "Eidon — The AI Employee Company",
    description:
      "Production-ready AI employees that reason, use your tools and finish real work. Hired in minutes, not quarters.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Eidon — The AI Employee Company",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Eidon — The AI Employee Company",
    description: "Production-ready AI employees that reason, use your tools and finish real work.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: {
    canonical: "/",
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: "#05060a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const dir = localeMeta[locale].dir;

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=Inter:wght@300..700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-void text-snow antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-lime focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-void"
        >
          Skip to content
        </a>

        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-void" />
          <div className="absolute inset-x-0 top-0 h-[980px] grid-lines mask-fade-b opacity-60" />
          <div className="absolute -top-56 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-indigo/[0.07] blur-[150px]" />
          <div className="absolute right-[-10%] top-[420px] h-[420px] w-[420px] rounded-full bg-lime/[0.035] blur-[120px]" />
          <div className="absolute inset-0 noise opacity-[0.035] mix-blend-overlay" />
        </div>

        {children}

        <noscript>
          <style>{`.reveal{opacity:1 !important;transform:none !important}`}</style>
        </noscript>

        <Analytics />
      </body>
    </html>
  );
}
