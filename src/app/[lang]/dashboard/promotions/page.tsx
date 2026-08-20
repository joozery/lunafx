import { hasLocale } from "@/dictionaries";
import { notFound } from "next/navigation";
import { PromotionsClient } from "@/components/dashboard/PromotionsClient";

export default async function PromotionsPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  return <PromotionsClient lang={lang} />;
}
