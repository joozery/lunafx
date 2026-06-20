import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { StatsBar } from "@/components/StatsBar";
import { AboutSection } from "@/components/AboutSection";
import { MarketsSection } from "@/components/MarketsSection";
import { PlatformsSection } from "@/components/PlatformsSection";
import { Footer } from "@/components/Footer";
import { getDictionary, hasLocale } from "@/dictionaries";

export default async function Home(props: PageProps<"/[lang]">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white font-sans selection:bg-[#c6a87c] selection:text-black">
      <Navbar dict={dict} lang={lang} />
      <Hero dict={dict} lang={lang} />
      <StatsBar dict={dict} />
      <AboutSection dict={dict} />
      <MarketsSection dict={dict} />
      <PlatformsSection dict={dict} />
      <Footer dict={dict} lang={lang} />
    </div>
  );
}
