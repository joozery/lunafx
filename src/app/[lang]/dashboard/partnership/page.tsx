import { hasLocale } from "@/dictionaries";
import { notFound } from "next/navigation";
import { PartnershipClient } from "@/components/dashboard/PartnershipClient";

export default async function PartnershipPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  return <PartnershipClient lang={lang} />;
}
