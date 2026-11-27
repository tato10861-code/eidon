import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { brand } from "@/lib/brand";
import type { Locale } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "Eidon embed",
  robots: { index: false, follow: false },
};

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-void text-snow">
      <header className="flex h-14 items-center justify-between border-b border-white/[0.07] px-4">
        <Logo />
        <a
          href={brand.domain}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[9px] uppercase tracking-[0.16em] text-fog/60 transition-colors hover:text-snow"
        >
          Powered by Eidon AI
        </a>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
