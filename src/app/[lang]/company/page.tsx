import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getDictionary, hasLocale } from "@/dictionaries";

export default async function CompanyPage(props: PageProps<"/[lang]/company">) {
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
            About Lunaforex
          </span>
          <h1 className="text-5xl lg:text-7xl font-bold mb-6 tracking-tight">
            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c6a87c] to-[#e6d0a8]">Story</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            We are a leading global multi-asset broker, empowering traders worldwide with transparent and innovative financial solutions.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Built for Traders, by Traders</h2>
              <p className="text-gray-400 mb-6 text-lg leading-relaxed">
                Founded with a vision to revolutionize the trading industry, Lunaforex provides institutional-grade trading conditions to retail and institutional clients globally.
              </p>
              <p className="text-gray-400 text-lg leading-relaxed">
                Our core values are transparency, innovation, and client success. We continually invest in our technology and infrastructure to ensure we provide the best possible trading environment.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: "Founded", value: "2010" },
                { label: "Active Clients", value: "1M+" },
                { label: "Global Offices", value: "12" },
                { label: "Industry Awards", value: "40+" }
              ].map((stat, i) => (
                <div key={i} className="bg-[#111827] p-6 rounded-2xl border border-gray-800 text-center">
                  <div className="text-3xl font-bold text-[#c6a87c] mb-2">{stat.value}</div>
                  <div className="text-sm text-gray-400 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer dict={dict} lang={lang} />
    </div>
  );
}
