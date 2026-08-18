import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blogs",
};

export default function BlogsPage() {
  const posts = getAllPosts();

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Blogs</h1>
      <ul className="mt-8 space-y-10">
        {posts.map((post) => (
          <li key={post.slug}>
            <h2 className="text-lg font-medium">
              <Link
                href={`/blogs/${post.slug}`}
                className="underline decoration-stone-300 underline-offset-4 hover:decoration-stone-500"
              >
                {post.title}
              </Link>
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              {formatDate(post.date)}
            </p>
            <p className="mt-2 leading-relaxed text-stone-600">
              {post.description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
