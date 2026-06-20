import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getDictionary, hasLocale } from "@/dictionaries";

export default async function ResourcesPage(props: PageProps<"/[lang]/resources">) {
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
            Educational Center
          </span>
          <h1 className="text-5xl lg:text-7xl font-bold mb-6 tracking-tight">
            Learn & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c6a87c] to-[#e6d0a8]">Grow</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Enhance your trading skills with our comprehensive educational resources, market analysis, and webinars.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { title: "Market Analysis", desc: "Daily insights and technical analysis from our market experts." },
              { title: "Economic Calendar", desc: "Stay ahead of market-moving events with our real-time calendar." },
              { title: "Video Tutorials", desc: "Step-by-step guides on using our platforms and trading strategies." },
              { title: "Help Center", desc: "Find answers to frequently asked questions and manage your account." }
            ].map((resource, i) => (
              <div key={i} className="bg-[#111827] p-8 rounded-2xl border border-gray-800 hover:border-[#c6a87c]/50 transition-colors">
                <h3 className="text-2xl font-bold mb-3">{resource.title}</h3>
                <p className="text-gray-400 mb-6">{resource.desc}</p>
                <button className="text-[#c6a87c] font-semibold hover:text-[#e6d0a8] transition-colors">
                  Explore →
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
