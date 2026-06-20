import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { getDictionary, hasLocale } from "@/dictionaries";

export async function generateMetadata(props: PageProps<"/[lang]/terms-and-conditions">): Promise<Metadata> {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return { title: dict.legal.terms.metaTitle, description: dict.legal.terms.metaDescription };
}

export default async function TermsAndConditionsPage(props: PageProps<"/[lang]/terms-and-conditions">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return <LegalPageLayout dict={dict} lang={lang} page={dict.legal.terms} email="legal@lunaforex.com" />;
}
