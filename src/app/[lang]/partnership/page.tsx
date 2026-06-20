import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getDictionary, hasLocale } from "@/dictionaries";

export default async function PartnershipPage(props: PageProps<"/[lang]/partnership">) {
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
            Partner Programs
          </span>
          <h1 className="text-5xl lg:text-7xl font-bold mb-6 tracking-tight">
            Grow With <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c6a87c] to-[#e6d0a8]">Us</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Join our industry-leading partnership programs and earn highly competitive commissions by referring clients to Lunaforex.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { title: "Introducing Broker (IB)", desc: "Earn ongoing commissions based on the trading volume of the clients you refer to us." },
              { title: "CPA Affiliate", desc: "Get highly competitive CPA payouts for every qualifying client you refer through your marketing channels." },
              { title: "White Label Solutions", desc: "Start your own brokerage under your brand name using our robust technology and liquidity." },
              { title: "Regional Partner", desc: "Become an official representative of Lunaforex in your region with full operational support." }
            ].map((program, i) => (
              <div key={i} className="bg-[#111827] p-8 rounded-2xl border border-gray-800 hover:border-[#c6a87c]/50 transition-colors">
                <div className="w-12 h-12 rounded-full bg-[#c6a87c]/10 flex items-center justify-center mb-6">
                  <div className="w-6 h-6 bg-[#c6a87c] rounded-full" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{program.title}</h3>
                <p className="text-gray-400 mb-8">{program.desc}</p>
                <button className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors font-medium">
                  Learn More
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
