import type { Metadata } from "next";
import localFont from "next/font/local";
import { Caveat, Parkinsans } from "next/font/google";
import { SiteNav } from "@/shared/layout/SiteNav";
import { SiteFrame } from "@/shared/layout/SiteFrame";
import { BottomBlur } from "@/shared/layout/BottomBlur";
import { SiteFooter } from "@/shared/layout/SiteFooter";
import { GoogleTagManager } from "@/shared/layout/GoogleTagManager";
import { TransitionProvider } from "@/shared/transitions";
import { siteConfig } from "@/shared/lib/site-config";
import "./globals.css";

// Trying Bami's previous display font (public/fonts/) in place of Bebas Neue, Parkinsans stays as the body font. Swap back to next/font/google's Bebas_Neue if this doesn't land.
const clashDisplay = localFont({
  src: "../../public/fonts/clash-display-variable.woff2",
  variable: "--font-display",
  display: "swap",
});

const parkinsans = Parkinsans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Handwritten accent, polaroid captions and similar one-off touches only, not a body/display substitute.
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-hand",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${clashDisplay.variable} ${parkinsans.variable} ${caveat.variable}`}>
      <body className="bg-paper font-sans text-ink antialiased">
        <GoogleTagManager />
        <TransitionProvider>
          <BottomBlur />
          <SiteNav />
          <div className="relative">
            <SiteFrame />
            {children}
          </div>
          <SiteFooter />
        </TransitionProvider>
      </body>
    </html>
  );
}
