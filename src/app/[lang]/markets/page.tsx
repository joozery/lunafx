import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getDictionary, hasLocale } from "@/dictionaries";

export default async function MarketsPage(props: PageProps<"/[lang]/markets">) {
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
            Global Markets
          </span>
          <h1 className="text-5xl lg:text-7xl font-bold mb-6 tracking-tight">
            Trade The <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c6a87c] to-[#e6d0a8]">World</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Diversify your portfolio with over 150+ instruments across Forex, Metals, Indices, Commodities, and Stocks.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Forex", desc: "Trade major, minor, and exotic currency pairs with tight spreads." },
              { title: "Metals", desc: "Trade Gold, Silver, and other precious metals against major currencies." },
              { title: "Indices", desc: "Access the world's most popular global stock market indices." },
              { title: "Commodities", desc: "Trade oil, natural gas, and soft commodities." },
              { title: "Stocks", desc: "Invest in shares of leading global companies." },
              { title: "Cryptocurrencies", desc: "Trade the most popular digital assets 24/7." }
            ].map((market, i) => (
              <div key={i} className="bg-[#111827] p-8 rounded-2xl border border-gray-800 hover:border-[#c6a87c]/50 transition-colors group cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold group-hover:text-[#c6a87c] transition-colors">{market.title}</h3>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#c6a87c]/20 transition-colors">
                    <span className="text-[#c6a87c]">→</span>
                  </div>
                </div>
                <p className="text-gray-400">{market.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer dict={dict} lang={lang} />
    </div>
  );
}
