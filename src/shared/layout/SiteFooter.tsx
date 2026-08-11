import { siteConfig } from "@/shared/lib/site-config";

export function SiteFooter() {
  return (
    <footer>
      <p>© {new Date().getFullYear()} {siteConfig.name}</p>
    </footer>
  );
}
