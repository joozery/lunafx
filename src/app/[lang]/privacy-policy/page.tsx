import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { getDictionary, hasLocale } from "@/dictionaries";

export async function generateMetadata(props: PageProps<"/[lang]/privacy-policy">): Promise<Metadata> {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return { title: dict.legal.privacy.metaTitle, description: dict.legal.privacy.metaDescription };
}

export default async function PrivacyPolicyPage(props: PageProps<"/[lang]/privacy-policy">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return <LegalPageLayout dict={dict} lang={lang} page={dict.legal.privacy} email="privacy@lunaforex.com" slug="privacy-policy" />;
}
