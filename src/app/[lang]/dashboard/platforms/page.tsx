import { hasLocale } from "@/dictionaries";
import { notFound } from "next/navigation";
import { PlatformsClient } from "@/components/dashboard/PlatformsClient";

export default async function PlatformsPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  return <PlatformsClient lang={lang} />;
}
