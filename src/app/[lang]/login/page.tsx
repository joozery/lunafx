import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { getDictionary, hasLocale } from "@/dictionaries";

export async function generateMetadata(props: PageProps<"/[lang]/login">): Promise<Metadata> {
  const { lang } = await props.params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return { title: dict.login.metaTitle, description: dict.login.metaDescription };
}

export default async function LoginPage(props: PageProps<"/[lang]/login">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0f1a] px-6 py-24 relative overflow-hidden">
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
          <h1 className="text-2xl font-bold text-white mb-2">{dict.login.heading}</h1>
          <p className="text-sm text-gray-400 mb-8">{dict.login.subheading}</p>

          <LoginForm dict={dict.login} />
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          {dict.login.noAccount}{" "}
          <Link href={`/${lang}/open-account`} className="text-[#c6a87c] font-semibold hover:text-[#d8bc91] transition-colors">
            {dict.login.openAccount}
          </Link>
        </p>
      </div>
    </main>
  );
}
