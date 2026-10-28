export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200">
      <p className="mx-auto max-w-4xl px-6 py-6 text-sm text-stone-500">
        © {new Date().getFullYear()} Hok Seng. Built with Next.js.
      </p>
    </footer>
  );
}
