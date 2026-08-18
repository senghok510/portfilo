import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import { Note } from "@/components/note";
import { formatDate, getAllPosts, getPost } from "@/lib/posts";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { meta } = getPost(slug);
  return { title: meta.title, description: meta.description };
}

// React components available inside MDX posts.
const components = { Note };

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { meta, content } = getPost(slug);

  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-12">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{meta.title}</h1>
        <p className="mt-2 text-sm text-stone-500">{formatDate(meta.date)}</p>
      </header>
      <div className="prose prose-stone mt-8 max-w-none">
        <MDXRemote
          source={content}
          components={components}
          options={{
            mdxOptions: {
              rehypePlugins: [
                [rehypePrettyCode, { theme: "github-light" }],
              ],
            },
          }}
        />
      </div>
    </article>
  );
}
