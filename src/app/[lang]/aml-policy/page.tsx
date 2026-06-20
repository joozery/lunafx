import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { getDictionary, hasLocale } from "@/dictionaries";

export async function generateMetadata(props: PageProps<"/[lang]/aml-policy">): Promise<Metadata> {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return { title: dict.legal.aml.metaTitle, description: dict.legal.aml.metaDescription };
}

export default async function AmlPolicyPage(props: PageProps<"/[lang]/aml-policy">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return <LegalPageLayout dict={dict} lang={lang} page={dict.legal.aml} email="compliance@lunaforex.com" />;
}
