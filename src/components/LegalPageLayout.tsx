import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import type { Dictionary, Locale, LegalPageDictionary } from "@/dictionaries";

export function LegalPageLayout({
  dict,
  lang,
  page,
  email,
}: {
  dict: Dictionary;
  lang: Locale;
  page: LegalPageDictionary;
  email: string;
}) {
  return (
    <div className="min-h-screen bg-white text-[#111827] font-sans">
      <Navbar dict={dict} lang={lang} />
      <main className="pt-36 pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-sm font-bold text-[#c6a87c] tracking-widest uppercase mb-4">{dict.legal.label}</div>
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-3">{page.title}</h1>
          <p className="text-gray-500 text-sm mb-12">{dict.legal.lastUpdatedLabel}: {page.lastUpdated}</p>
          <div className="space-y-10">
            {page.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-xl font-bold text-[#111827] mb-3">{section.heading}</h2>
                <div className="text-gray-600 leading-relaxed space-y-4">
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.intro && <p>{section.intro}</p>}
                  {section.items && (
                    <ul className="list-disc list-inside space-y-2">
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}

            <section>
              <h2 className="text-xl font-bold text-[#111827] mb-3">{page.contact.heading}</h2>
              <div className="text-gray-600 leading-relaxed space-y-4">
                <p>
                  {page.contact.before}
                  <a href={`mailto:${email}`} className="text-[#c6a87c] hover:underline">
                    {email}
                  </a>
                  {page.contact.after}
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer dict={dict} lang={lang} />
    </div>
  );
}
