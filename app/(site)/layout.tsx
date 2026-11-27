import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { getDictionary } from "@/lib/i18n/server";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = await getDictionary();

  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteNav t={t.nav} locale={locale} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter t={t} locale={locale} />
    </div>
  );
}
