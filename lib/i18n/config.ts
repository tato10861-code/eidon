export const locales = ["en", "ar", "es", "fr", "de"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const localeCookie = "eidon_locale";

export const localeMeta: Record<Locale, { label: string; short: string; dir: "ltr" | "rtl" }> = {
  en: { label: "English", short: "EN", dir: "ltr" },
  ar: { label: "العربية", short: "AR", dir: "rtl" },
  es: { label: "Español", short: "ES", dir: "ltr" },
  fr: { label: "Français", short: "FR", dir: "ltr" },
  de: { label: "Deutsch", short: "DE", dir: "ltr" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
