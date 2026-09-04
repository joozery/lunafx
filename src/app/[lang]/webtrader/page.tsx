import { hasLocale } from "@/dictionaries";
import { notFound } from "next/navigation";
import { WebTraderClient } from "@/components/dashboard/WebTraderClient";

export default async function WebTraderPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  return <WebTraderClient lang={lang} />;
}
