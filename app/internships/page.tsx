import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Internships",
};

// Edit this list to add or update internships.
const internships = [
  {
    company: "Technip Energies",
    role: "Data Science & AI Intern",
    period: "Mar 2026 – Jul 2026",
    description:
      "Built an agentic GraphRAG system for tendering: implemented a Personalized PageRank algorithm for multi-hop questions and designed a multi-agent system to answer a wide range of queries over tender documents.",
    writeup: "/internships/agentic-graphrag",
    slides: "/agentic-graphrag/defense-slides.pdf",
  },
  {
    company: "PPS",
    role: "Machine Learning Intern",
    period: "Jun 2025 – Sep 2025",
    description:
      "Worked on data anonymization for cybersecurity: implemented and optimized the GLiNER classification model with LoRA fine-tuning on a synthetic dataset generated via Gretel.ai, and benchmarked it against BERT-BiLSTM-CRF and spaCy baselines. Extended the model into an explainable phishing detection pipeline.",
    writeup: "/internships/phishing-detection",
  },
];

export default function InternshipsPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-12">
      <p className="eyebrow index-eyebrow">EXPERIENCE / IN THE REAL WORLD</p>
      <h1 className="text-2xl font-semibold tracking-tight">From theory to impact.</h1>
      <p className="index-intro">Building intelligent systems for real problems. A closer look at my internships, research, and the lessons along the way.</p>
      <ul className="mt-8 space-y-10">
        {internships.map((internship) => (
          <li key={`${internship.company}-${internship.period}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-medium">
                {internship.role} · {internship.company}
              </h2>
              <span className="text-sm text-stone-500">
                {internship.period}
              </span>
            </div>
            <p className="mt-2 leading-relaxed text-stone-600">
              {internship.description}
            </p>
            {(internship.writeup || internship.slides) && (
              <p className="mt-2 flex gap-4 text-sm">
                {internship.writeup && (
                  <Link
                    href={internship.writeup}
                    className="font-medium underline decoration-stone-300 underline-offset-4 hover:decoration-stone-500"
                  >
                    Read the write-up →
                  </Link>
                )}
                {internship.slides && (
                  <a
                    href={internship.slides}
                    className="text-stone-500 underline decoration-stone-300 underline-offset-4 hover:text-stone-900 hover:decoration-stone-500"
                  >
                    Slides (PDF)
                  </a>
                )}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
