import "server-only";
import { cookies } from "next/headers";
import { DICTS, type Lang } from "./i18n";

export async function getLang(): Promise<Lang> {
  return (await cookies()).get("lang")?.value === "ar" ? "ar" : "fr";
}

export async function getT() {
  const lang = await getLang();
  return { lang, t: DICTS[lang] };
}
