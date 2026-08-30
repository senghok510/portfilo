import katex from "katex";
import "katex/dist/katex.min.css";

// Renders LaTeX to HTML at build time (server component) — no client JS.
export function Formula({ math }: { math: string }) {
  const html = katex.renderToString(math, {
    displayMode: true,
    throwOnError: false,
  });
  return (
    <div
      className="overflow-x-auto rounded-lg border border-stone-200 bg-stone-50 px-5 py-2 text-stone-800"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
