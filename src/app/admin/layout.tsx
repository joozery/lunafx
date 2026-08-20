import "../globals.css";
import { Noto_Sans_Thai } from "next/font/google";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-noto-sans-thai",
});

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`h-full antialiased ${notoSansThai.variable}`}>
      <body
        className="h-full bg-gray-50"
        style={{ fontFamily: "var(--font-noto-sans-thai), sans-serif" }}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
