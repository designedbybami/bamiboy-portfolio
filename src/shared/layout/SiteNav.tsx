import Link from "next/link";
import { routes } from "@/shared/lib/site-config";

const links = [
  { href: routes.home, label: "Home" },
  { href: routes.about, label: "About" },
  { href: routes.works, label: "Works" },
  { href: routes.playground, label: "Playground" },
];

export function SiteNav() {
  return (
    <nav>
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
