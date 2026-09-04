import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { getDictionary, hasLocale } from "@/dictionaries";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export async function generateMetadata(
  props: PageProps<"/[lang]/forgot-password">
): Promise<Metadata> {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.forgotPassword.metaTitle,
    description: dict.forgotPassword.metaDescription,
  };
}

export default async function ForgotPasswordPage(
  props: PageProps<"/[lang]/forgot-password">
) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0f1a] text-white font-sans selection:bg-[#c6a87c] selection:text-black">
      <Navbar dict={dict} lang={lang} />
      <main className="flex-grow flex items-center justify-center px-6 py-32 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#c6a87c]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#c6a87c]/10 rounded-full blur-3xl" />

        <div className="relative z-10 w-full max-w-md">
          <Link href={`/${lang}`} className="flex justify-center mb-10">
            <Image
              src="/logo/logow.png"
              alt="Lunaforex"
              width={180}
              height={54}
              className="h-10 w-auto object-contain"
            />
          </Link>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
            <h1 className="text-2xl font-bold text-white mb-2">
              {dict.forgotPassword.heading}
            </h1>
            <p className="text-sm text-gray-400 mb-8">
              {dict.forgotPassword.subheading}
            </p>

            <ForgotPasswordForm dict={dict.forgotPassword} lang={lang} />
          </div>
        </div>
      </main>
      <Footer dict={dict} lang={lang} />
    </div>
  );
}
