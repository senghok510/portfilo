"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "about" },
  { href: "/projects", label: "projects" },
  { href: "/internships", label: "internships" },
  { href: "/cv", label: "cv" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-stone-200">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
        <Link href="/" className="text-base font-semibold tracking-tight">
          <span className="text-accent">Hok</span> Seng
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`border-b-2 py-1 hover:border-accent ${
                  active
                    ? "border-accent font-medium text-accent"
                    : "border-transparent text-stone-600"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
