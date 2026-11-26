import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, posts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes and explainers on machine learning, AI and data.",
};

export default function BlogPage() {
  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
      <p className="mt-2 text-stone-600">
        Notes and explainers on ideas in machine learning I find interesting.
      </p>
      <ul className="mt-8 space-y-10">
        {posts.map((post) => (
          <li key={post.slug}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-medium">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <span className="text-sm text-stone-500">
                {formatDate(post.date)} · {post.readingTime}
              </span>
            </div>
            <p className="mt-2 leading-relaxed text-stone-600">
              {post.summary}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-stone-200 px-2.5 py-0.5 text-stone-500"
                >
                  {tag}
                </span>
              ))}
              <Link
                href={`/blog/${post.slug}`}
                className="ml-auto text-sm font-medium underline decoration-stone-300 underline-offset-4 hover:decoration-stone-500"
              >
                Read the post →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
