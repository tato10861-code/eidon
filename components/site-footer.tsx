import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { brand } from "@/lib/brand";
import type { Dict } from "@/messages/en";
import type { Locale } from "@/lib/i18n/config";

export function SiteFooter({ t, locale }: { t: Dict; locale: Locale }) {
  const columns = [
    {
      title: t.footer.product,
      links: [
        { label: t.footer.employees, href: "/employees" },
        { label: t.footer.studio, href: "/studio" },
        { label: t.footer.playground, href: "/playground" },
        { label: t.footer.integrations, href: "/integrations" },
        { label: t.footer.pricing, href: "/pricing" },
      ],
    },
    {
      title: t.footer.platform,
      links: [
        { label: t.footer.docs, href: "/docs" },
        { label: t.footer.api, href: "/docs#api" },
        { label: t.footer.security, href: "/security" },
        { label: t.footer.status, href: "/status" },
        { label: t.footer.changelog, href: "/docs#changelog" },
      ],
    },
    {
      title: t.footer.company,
      links: [
        { label: t.footer.about, href: "/about" },
        { label: t.footer.careers, href: "/about#careers" },
        { label: t.footer.blog, href: "/about#blog" },
        { label: t.footer.contact, href: "mailto:hello@eidon.ai" },
      ],
    },
    {
      title: t.footer.legal,
      links: [
        { label: t.footer.privacy, href: "/legal/privacy" },
        { label: t.footer.terms, href: "/legal/terms" },
        { label: t.footer.dpa, href: "/legal/dpa" },
        { label: t.footer.subprocessors, href: "/legal/subprocessors" },
      ],
    },
  ];

  return (
    <footer className="relative mt-24 border-t border-white/[0.07]">
      <div className="container-page py-14">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2.6fr]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-[13px] leading-relaxed text-fog">{t.footer.tagline}</p>
            <div className="mt-6 flex items-center gap-2 text-[11px] font-mono text-fog">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
              </span>
              {t.footer.operational}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((column) => (
              <div key={column.title}>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog/80">
                  {column.title}
                </p>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[13px] text-mist/80 transition-colors hover:text-snow"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/[0.07] pt-6 text-[11px] text-fog sm:flex-row sm:items-center sm:justify-between">
          <p>{t.footer.rights}</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono">
            <span>{t.footer.built}</span>
            <Link
              href={brand.github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-fog transition-colors hover:text-snow"
            >
              GitHub
              <ArrowUpRight className="size-3" aria-hidden="true" />
            </Link>
            <span className="text-fog/60">
              {locale === "ar"
                ? "الرياض · لندن · سان فرانسيسكو"
                : "Riyadh · London · San Francisco"}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
