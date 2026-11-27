import { cookies } from "next/headers";
import { defaultLocale, isLocale, localeCookie } from "./config";
import { en } from "@/messages/en";
import { ar } from "@/messages/ar";

const dictionaries = { en, ar };

export async function getLocale() {
  const store = await cookies();
  const value = store.get(localeCookie)?.value;
  return isLocale(value) ? value : defaultLocale;
}

export async function getDictionary() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}
