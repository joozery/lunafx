import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { defaultLocale, hasLocale, locales, type Locale } from "@/dictionaries";

function detectLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;
  const preferred = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0].trim().toLowerCase());
  for (const lang of preferred) {
    const match = locales.find((l) => lang === l || lang.startsWith(`${l}-`));
    if (match) return match;
  }
  return defaultLocale;
}

export default async function RootPage() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

  const locale =
    cookieLocale && hasLocale(cookieLocale)
      ? cookieLocale
      : detectLocale((await headers()).get("accept-language"));

  redirect(`/${locale}`);
}
