export function Note({ children }: { children: React.ReactNode }) {
  return (
    <aside className="my-6 rounded-lg border border-stone-200 bg-stone-50 px-5 py-4 text-[0.95rem] leading-relaxed text-stone-700 [&>p]:m-0">
      {children}
    </aside>
  );
}
