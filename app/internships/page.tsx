import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ppsLogo from "@/images/logos/pps_logo.png";
import technipLogo from "@/images/logos/technip_logo.png";

export const metadata: Metadata = {
  title: "Internships",
};

// Edit this list to add or update internships.
const internships = [
  {
    company: "Technip Energies",
    logo: technipLogo,
    role: "Data Science & AI Intern",
    period: "Mar 2026 – Jul 2026",
    description:
      "Built an agentic GraphRAG system for tendering: implemented a Personalized PageRank algorithm for multi-hop questions and designed a multi-agent system to answer a wide range of queries over tender documents.",
    writeup: "/internships/agentic-graphrag",
  },
  {
    company: "PPS",
    logo: ppsLogo,
    role: "Machine Learning Intern",
    period: "Jun 2025 – Sep 2025",
    description:
      "Worked on data anonymization for cybersecurity: implemented and optimized the GLiNER classification model with LoRA fine-tuning on a synthetic dataset generated via Gretel.ai, and benchmarked it against BERT-BiLSTM-CRF and spaCy baselines. Extended the model into an explainable phishing detection pipeline.",
    writeup: "/internships/phishing-detection",
  },
];

export default function InternshipsPage() {
  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Internships</h1>
      <ul className="mt-8 space-y-10">
        {internships.map((internship) => (
          <li key={`${internship.company}-${internship.period}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="flex items-center gap-3 text-lg font-medium">
                <Image
                  src={internship.logo}
                  alt={`${internship.company} logo`}
                  className="h-6 w-auto shrink-0"
                />
                <span>
                  {internship.role} · {internship.company}
                </span>
              </h2>
              <span className="text-sm text-stone-500">
                {internship.period}
              </span>
            </div>
            <p className="mt-2 leading-relaxed text-stone-600">
              {internship.description}
            </p>
            {internship.writeup && (
              <p className="mt-2 flex gap-4 text-sm">
                <Link
                  href={internship.writeup}
                  className="font-medium underline decoration-stone-300 underline-offset-4 hover:decoration-stone-500"
                >
                  Read the write-up →
                </Link>
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
