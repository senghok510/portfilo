"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { algorithms, tutorialPath, tutorialSections } from "@/lib/tutorials";

export function AlgorithmNavigation() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const filtered = algorithms.filter(a => `${a.title} ${a.family} ${a.task}`.toLowerCase().includes(query.toLowerCase()));
  return <aside className="algorithm-sidebar"><div className="sidebar-sticky">
    <Link href="/tutorials" className="tutorial-back">← All tutorials</Link>
    <Link href="/tutorials/machine-learning" className="sidebar-title" aria-current={pathname === "/tutorials/machine-learning" ? "page" : undefined}>Machine Learning <span>05</span></Link>
    <label className="algorithm-search"><span className="sr-only">Find an algorithm</span><input type="search" placeholder="Find an algorithm…" value={query} onChange={e => setQuery(e.target.value)} /></label>
    <nav aria-label="Machine learning algorithms">
      {["Linear methods", "Tree methods"].map(family => <div className="algorithm-family" key={family}><p>{family}</p>{filtered.filter(a => a.family === family).map(a => <Link key={a.slug} href={tutorialPath(a.slug)} aria-current={pathname === tutorialPath(a.slug) ? "page" : undefined}><span>{a.title}</span><span aria-hidden="true">↗</span></Link>)}</div>)}
      {filtered.length === 0 && <p className="search-empty" role="status">No matching algorithms.</p>}
    </nav>
    <div className="sidebar-note"><span className="eyebrow">A WORKING REFERENCE</span><p>Understand the objective. Know the assumptions. Recognize the failure modes.</p><Link href="/tutorials/machine-learning#comparison">Compare the algorithms →</Link></div>
  </div></aside>;
}

export function TableOfContents({ overview = false }: { overview?: boolean }) {
  const pathname = usePathname();
  const [active, setActive] = useState("");
  const sections = overview ? [["start", "How to use this reference"], ["map", "Algorithm map"], ["comparison", "Decision matrix"], ["notation", "Shared notation"], ["scope", "Scope & source policy"]] : tutorialSections;
  const signature = sections.map(s => s[0]).join(",");
  useEffect(() => {
    const ids = signature.split(",");
    const update = () => {
      const current = ids.filter(id => (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= 150).at(-1);
      setActive(current ?? ids[0]);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [signature, pathname]);
  return <aside className="tutorial-toc"><div className="sidebar-sticky"><p className="eyebrow">ON THIS PAGE</p><nav aria-label="On this page">{sections.map(([id, label]) => <a key={id} href={`#${id}`} aria-current={active === id ? "location" : undefined}>{label}</a>)}</nav><a className="back-to-top" href="#main-content">Back to top ↑</a><button type="button" className="print-reference" onClick={() => window.print()}>Print / Save as PDF ↗</button><p className="toc-note">Equations, examples, and decision notes.<br />Reviewed September 2026.</p></div></aside>;
}
