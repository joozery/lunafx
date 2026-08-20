import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { locales } from "@/dictionaries";
import "../globals.css";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lunaforex",
  description: "Lunaforex is a global online broker providing institutional-grade trading conditions.",
};

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function RootLayout(props: LayoutProps<"/[lang]">) {
  const { lang } = await props.params;

  return (
    <html
      lang={lang}
      className={`${notoSansThai.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {props.children}
      </body>
    </html>
  );
}
