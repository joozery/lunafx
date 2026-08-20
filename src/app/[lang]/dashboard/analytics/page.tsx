import { hasLocale } from "@/dictionaries";
import { notFound } from "next/navigation";
import { AnalyticsClient } from "@/components/dashboard/AnalyticsClient";

export default async function AnalyticsPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  return <AnalyticsClient lang={lang} />;
}
