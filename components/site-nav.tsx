"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import type { Dict } from "@/messages/en";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const links = [
  { key: "employees", href: "/employees" },
  { key: "integrations", href: "/integrations" },
  { key: "pricing", href: "/pricing" },
  { key: "docs", href: "/docs" },
] as const;

export function SiteNav({ t, locale }: { t: Dict["nav"]; locale: Locale }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50">
      <div
        className={cn(
          "border-b transition-all duration-300",
          scrolled
            ? "border-white/[0.07] bg-void/80 backdrop-blur-xl"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="container-page flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
              {links.map((link) => {
                const active = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-white/[0.06] text-snow"
                        : "text-fog hover:bg-white/[0.04] hover:text-snow",
                    )}
                  >
                    {t[link.key]}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <LanguageSwitcher locale={locale} />
            <Link
              href="/dashboard"
              className="rounded-full px-3 py-2 text-[13px] font-medium text-mist transition-colors hover:text-snow"
            >
              {t.signIn}
            </Link>
            <Button href="/studio" size="sm">
              {t.start}
              <ArrowUpRight className="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? t.close : t.menu}
            className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-mist md:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-b border-white/[0.07] bg-void/95 backdrop-blur-xl md:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-3 text-sm font-medium text-mist transition-colors hover:bg-white/[0.05] hover:text-snow"
              >
                {t[link.key]}
              </Link>
            ))}
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
              <LanguageSwitcher locale={locale} />
              <Button href="/studio" size="sm">
                {t.start}
                <ArrowUpRight className="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
