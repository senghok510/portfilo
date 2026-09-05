"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/projects", label: "Projects" },
  { href: "/internships", label: "Experience" },
  { href: "/blogs", label: "Writing" },
  { href: "/cv", label: "Résumé" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="wordmark" aria-label="Hok Seng home">hs<span>.</span></Link>
        <nav aria-label="Main navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} aria-current={pathname.startsWith(link.href) ? "page" : undefined}>{link.label}</Link>
          ))}
        </nav>
        <a className="header-contact" href="mailto:hok.seng@polytechnique.edu">Let’s talk <span>↗</span></a>
      </div>
    </header>
  );
}
