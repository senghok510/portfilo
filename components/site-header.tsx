import Link from "next/link";

const links = [
  { href: "/cv", label: "CV" },
  { href: "/internships", label: "Internships" },
  { href: "/projects", label: "Projects" },
  { href: "/blogs", label: "Blogs" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-stone-200">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
        <Link href="/" className="text-base font-semibold tracking-tight">
          Home
        </Link>
        <nav className="flex items-center gap-6 text-sm text-stone-600">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-stone-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
