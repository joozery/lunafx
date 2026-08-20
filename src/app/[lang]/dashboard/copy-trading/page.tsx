import { hasLocale, type Locale } from "@/dictionaries";
import { notFound } from "next/navigation";
import { CopyTradingClient } from "@/components/dashboard/CopyTradingClient";

export default async function CopyTradingPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  return <CopyTradingClient lang={lang} />;
}
