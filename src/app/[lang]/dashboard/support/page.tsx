import { use } from "react";
import { hasLocale, type Locale } from "@/dictionaries";
import { notFound } from "next/navigation";
import { SupportClient } from "@/components/dashboard/SupportClient";

export default function SupportPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = use(props.params);
  if (!hasLocale(lang)) notFound();

  return <SupportClient lang={lang} />;
}
