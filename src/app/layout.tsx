import type { Metadata } from "next";
import { SiteNav } from "@/shared/layout/SiteNav";
import { SiteFooter } from "@/shared/layout/SiteFooter";
import { TransitionProvider } from "@/shared/transitions";
import { siteConfig } from "@/shared/lib/site-config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s — ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TransitionProvider>
          <SiteNav />
          {children}
          <SiteFooter />
        </TransitionProvider>
      </body>
    </html>
  );
}
