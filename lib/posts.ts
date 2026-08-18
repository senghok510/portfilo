import fs from "fs";
import path from "path";
import matter from "gray-matter";

const postsDirectory = path.join(process.cwd(), "content", "blogs");

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  description: string;
};

export function getAllPosts(): PostMeta[] {
  return fs
    .readdirSync(postsDirectory)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const source = fs.readFileSync(path.join(postsDirectory, file), "utf8");
      const { data } = matter(source);
      return {
        slug,
        title: data.title ?? slug,
        date: data.date ?? "",
        description: data.description ?? "",
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(slug: string) {
  const source = fs.readFileSync(
    path.join(postsDirectory, `${slug}.mdx`),
    "utf8",
  );
  const { data, content } = matter(source);
  return {
    meta: {
      slug,
      title: data.title ?? slug,
      date: data.date ?? "",
      description: data.description ?? "",
    } satisfies PostMeta,
    content,
  };
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
