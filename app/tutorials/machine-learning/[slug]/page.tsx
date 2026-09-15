import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import { tutorialMdxOptions } from "@/lib/tutorial-mdx";
import { algorithms, tutorialPath } from "@/lib/tutorials";
import { Equation, Symbols, ReferenceTable, Insight } from "@/components/tutorials/content";
import { AlgorithmLab } from "@/components/tutorials/algorithm-lab";
import { TableOfContents } from "@/components/tutorials/navigation";
export const dynamicParams = false;
export function generateStaticParams() { return algorithms.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const algorithm = algorithms.find(a => a.slug === slug);
  return { title: algorithm ? `${algorithm.title} — Machine Learning Tutorials` : "Tutorial not found", description: algorithm?.summary };
}
export default async function AlgorithmPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const index = algorithms.findIndex(a => a.slug === slug);
  if (index === -1) notFound();
  const algorithm = algorithms[index];
  const source = fs.readFileSync(path.join(process.cwd(), "content/tutorials", `${algorithm.slug}.mdx`), "utf8");
  const words = source.split(/\s+/).length;
  return <><article className="tutorial-article"><div className="tutorial-breadcrumb"><Link href="/tutorials">Tutorials</Link><span>/</span><Link href="/tutorials/machine-learning">Machine Learning</Link></div><header className="tutorial-article-header"><p className="eyebrow">{algorithm.family.toUpperCase()} / REFERENCE {String(index + 1).padStart(2, "0")}</p><h1>{algorithm.title}</h1><p>{algorithm.summary}</p><div className="tutorial-meta"><span>{algorithm.task}</span><span>≈ {Math.ceil(words / 180)} min study</span><span>Includes interactive figure</span></div></header><div className="algorithm-brief"><strong>When to reach for it</strong><p>{algorithm.takeaway}</p><span>{algorithm.caution}</span></div><div className="tutorial-prose" key={algorithm.slug}><MDXRemote source={source} components={{ Equation, Symbols, ReferenceTable, Insight, AlgorithmLab }} options={{ ...tutorialMdxOptions, mdxOptions: { rehypePlugins: [[rehypePrettyCode, { theme: "github-light" }]] } }} /></div><nav className="tutorial-pagination" aria-label="Adjacent algorithms">{index > 0 ? <Link href={tutorialPath(algorithms[index - 1].slug)}><span>← PREVIOUS</span>{algorithms[index - 1].title}</Link> : <Link href="/tutorials/machine-learning"><span>← OVERVIEW</span>Algorithm decision guide</Link>}{index < algorithms.length - 1 ? <Link href={tutorialPath(algorithms[index + 1].slug)}><span>NEXT →</span>{algorithms[index + 1].title}</Link> : <Link href="/tutorials/machine-learning#comparison"><span>REVISIT →</span>Compare the algorithms</Link>}</nav></article><TableOfContents /></>;
}
