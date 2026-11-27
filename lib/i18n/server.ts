import { cookies } from "next/headers";
import { defaultLocale, isLocale, localeCookie } from "./config";
import { en } from "@/messages/en";
import { ar } from "@/messages/ar";
import { es } from "@/messages/es";
import { fr } from "@/messages/fr";
import { de } from "@/messages/de";

const dictionaries = { en, ar, es, fr, de };

export async function getLocale() {
  const store = await cookies();
  const value = store.get(localeCookie)?.value;
  return isLocale(value) ? value : defaultLocale;
}

export async function getDictionary() {
  const locale = await getLocale();
  const dict = dictionaries[locale as keyof typeof dictionaries] ?? en;
  return { locale, t: dict };
}
