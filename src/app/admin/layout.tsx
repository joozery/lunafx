import "../globals.css";
import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-noto-sans-thai",
});

export const metadata: Metadata = {
  manifest: "/admin-app/manifest.webmanifest",
  appleWebApp: { capable: true, title: "LuxaFX Admin", statusBarStyle: "black-translucent" },
  icons: { apple: "/admin-app/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#0b1120",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // lets the bottom bar sit above the iPhone home indicator
};

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
