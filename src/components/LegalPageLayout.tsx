"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import type { Dictionary, Locale, LegalPageDictionary } from "@/dictionaries";

export function LegalPageLayout({
  dict,
  lang,
  page,
  email,
  slug,
}: {
  dict: Dictionary;
  lang: Locale;
  page: LegalPageDictionary;
  email: string;
  slug?: string;
}) {
  const [docData, setDocData] = useState<{
    title?: string;
    lastUpdated?: string;
    email?: string;
    sections?: any[];
  } | null>(null);

  useEffect(() => {
    if (slug) {
      fetch(`/api/legal?slug=${slug}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.document) {
            setDocData(data.document);
          }
        })
        .catch(() => {});
    }
  }, [slug]);

  const displayTitle = docData?.title || page.title;
  const displayLastUpdated = docData?.lastUpdated || page.lastUpdated;
  const displayEmail = docData?.email || email;
  const displaySections = docData?.sections && docData.sections.length > 0 ? docData.sections : page.sections;

  return (
    <div className="min-h-screen bg-white text-[#111827] font-sans">
      <Navbar dict={dict} lang={lang} />
      <main className="pt-36 pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-sm font-bold text-[#c6a87c] tracking-widest uppercase mb-4">{dict.legal.label}</div>
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-3">{displayTitle}</h1>
          <p className="text-gray-500 text-sm mb-12">{dict.legal.lastUpdatedLabel}: {displayLastUpdated}</p>
          
          <div className="space-y-10">
            {displaySections.map((section: any, idx: number) => (
              <section key={section.heading || idx}>
                <h2 className="text-xl font-bold text-[#111827] mb-3">{section.heading}</h2>
                <div className="text-gray-600 leading-relaxed space-y-4">
                  {section.paragraphs?.map((paragraph: string, pIdx: number) => (
                    <p key={pIdx}>{paragraph}</p>
                  ))}
                  {section.intro && <p>{section.intro}</p>}
                  {section.items && section.items.length > 0 && (
                    <ul className="list-disc list-inside space-y-2">
                      {section.items.map((item: string, iIdx: number) => (
                        <li key={iIdx}>{item}</li>
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
                  {page.contact.before}{" "}
                  <a href={`mailto:${displayEmail}`} className="text-[#c6a87c] hover:underline font-semibold">
                    {displayEmail}
                  </a>{" "}
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
