import { hasLocale } from "@/dictionaries";
import { notFound } from "next/navigation";
import { FundsClient } from "./FundsClient";

export default async function FundsPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  return <FundsClient lang={lang} />;
}
