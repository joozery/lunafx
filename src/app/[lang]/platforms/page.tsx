import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getDictionary, hasLocale } from "@/dictionaries";

export default async function PlatformsPage(props: PageProps<"/[lang]/platforms">) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white font-sans selection:bg-[#c6a87c] selection:text-black">
      <Navbar dict={dict} lang={lang} />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[#c6a87c]/5 blur-[120px] rounded-full w-[600px] h-[600px] top-0 left-1/2 -translate-x-1/2" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#c6a87c]/10 text-[#c6a87c] border border-[#c6a87c]/20 text-sm font-medium mb-6">
            Trading Technology
          </span>
          <h1 className="text-5xl lg:text-7xl font-bold mb-6 tracking-tight">
            Powerful <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c6a87c] to-[#e6d0a8]">Platforms</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Trade anywhere, anytime with our industry-leading trading platforms for Web, Desktop, and Mobile.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="space-y-12">
            {[
              { title: "MetaTrader 5 Desktop", desc: "The most powerful platform for advanced technical analysis and algorithmic trading." },
              { title: "Lunaforex Web Trader", desc: "Trade directly from your browser with no downloads or installation required." },
              { title: "Mobile Trading App", desc: "Manage your portfolio on the go with our intuitive mobile application for iOS and Android." }
            ].map((platform, i) => (
              <div key={i} className="bg-[#111827] p-8 lg:p-12 rounded-3xl border border-gray-800 flex flex-col md:flex-row items-center gap-8 justify-between">
                <div>
                  <h3 className="text-3xl font-bold mb-4">{platform.title}</h3>
                  <p className="text-gray-400 text-lg max-w-xl">{platform.desc}</p>
                </div>
                <button className="px-8 py-3 bg-[#c6a87c] hover:bg-[#b09265] text-white font-semibold rounded-lg transition-colors whitespace-nowrap">
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer dict={dict} lang={lang} />
    </div>
  );
}
