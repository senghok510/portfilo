import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GroupedBarChart } from "@/components/grouped-bar-chart";

export const metadata: Metadata = {
  title: "Agentic GraphRAG at Technip Energies",
  description:
    "Internship write-up: agentic GraphRAG with adaptive graph traversal for EPC tendering documents.",
};

const contributions = [
  "Domain-aware knowledge graph construction from a heterogeneous tender corpus",
  "An adaptive graph retrieval pipeline that picks a strategy based on the query",
  "Dual-Level RAG and Weighted Hub-aware PPR-RAG, combined with a cross-encoder reranker",
  "Quantitative and qualitative evaluation against a Hybrid RAG baseline",
];

const pipelineSteps = [
  {
    name: "Query understanding",
    detail:
      "Each query is classified by retrieval need (textual factoid, single-hop lookup, aggregation/summarization, or relation discovery/multi-hop) and mapped to a graph scope: single domain, multi-domain, or full graph.",
  },
  {
    name: "Entity linking",
    detail:
      "Entities extracted from the query are matched to graph nodes with fuzzy matching and semantic search, fused via reciprocal rank fusion, then disambiguated and deduplicated by an LLM to produce seed entities.",
  },
  {
    name: "Adaptive retrieval",
    detail:
      "Based on the query type, the system routes to Hub-aware PPR retrieval, local graph retrieval, Dual-Level retrieval, or plain Hybrid RAG (BM25 + dense vectors on Azure AI Search) — avoiding expensive graph traversal when it isn't needed.",
  },
  {
    name: "Fusion and answering",
    detail:
      "Graph evidence and hybrid-search evidence are fused and deduplicated, reranked by a cross-encoder, and passed to an LLM for answer generation.",
  },
];

const dualLevelResults = {
  caption:
    "Dual-Level RAG vs the Hybrid RAG baseline, across all 200 questions.",
  columns: ["Hybrid RAG", "Dual-Level RAG"],
  rows: [
    { metric: "Accuracy", values: ["0.840", "0.965"] },
    { metric: "Completeness", values: ["0.794", "0.882"] },
    { metric: "Relevance", values: ["0.930", "0.988"] },
    { metric: "Context precision", values: ["0.824", "0.857"] },
    { metric: "Latency", values: ["20 s", "31 s"] },
  ],
};

const pprResults = {
  caption:
    "Weighted Hub-aware PPR-RAG vs Hybrid RAG, on relational and multi-hop queries only.",
  columns: ["Hybrid RAG", "PPR-RAG"],
  rows: [
    { metric: "Accuracy", values: ["0.875", "0.882"] },
    { metric: "Completeness", values: ["0.850", "0.862"] },
    { metric: "Relevance", values: ["0.905", "0.951"] },
    { metric: "Context precision", values: ["0.805", "0.841"] },
    { metric: "Latency", values: ["21 s", "37 s"] },
  ],
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-400">
        {title}
      </h2>
      <div className="mt-4 space-y-4 leading-relaxed text-stone-700">
        {children}
      </div>
    </section>
  );
}

function ResultsTable({
  data,
}: {
  data: typeof dualLevelResults;
}) {
  return (
    <figure>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-300 text-left">
              <th className="py-2 pr-4 font-medium">Metric</th>
              {data.columns.map((column) => (
                <th key={column} className="py-2 pr-4 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.metric} className="border-b border-stone-100">
                <td className="py-2 pr-4 text-stone-600">{row.metric}</td>
                {row.values.map((value, i) => (
                  <td
                    key={i}
                    className={
                      i === row.values.length - 1
                        ? "py-2 pr-4 font-medium"
                        : "py-2 pr-4 text-stone-600"
                    }
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="mt-2 text-sm text-stone-500">
        {data.caption}
      </figcaption>
    </figure>
  );
}

export default function AgenticGraphragPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link
        href="/internships"
        className="text-sm text-stone-500 transition-colors hover:text-stone-900"
      >
        ← Internships
      </Link>

      <header className="mt-6">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          Agentic GraphRAG with Adaptive Graph Traversal for EPC Tendering
        </h1>
        <p className="mt-3 text-stone-500">
          Technip Energies · Mar 2026 – Jul 2026 · Supervised by Julien Cadart
        </p>
        <p className="mt-1 text-sm text-stone-500">
          <a
            href="/Soutenace_stage_3A_Hok_SENG_final.pdf"
            className="underline decoration-stone-300 underline-offset-4 hover:text-stone-900 hover:decoration-stone-500"
          >
            Defense slides (PDF)
          </a>
        </p>
      </header>

      <Section title="Context">
        <p>
          Tendering for EPC (engineering, procurement, and construction)
          projects produces a large, multidisciplinary corpus: engineering,
          procurement, project management, legal, finance, insurance, and
          safety documents spanning about 40 specialised domains — from
          rotating equipment and piping to document control and risk
          management — in heterogeneous formats (PDF, Word, Excel,
          PowerPoint…).
        </p>
        <p>
          Finding information across this corpus is manual, cross-checking is
          time-consuming, and critical information is easy to miss. The
          internship asked a concrete research question:{" "}
          <em>
            can knowledge-graph-based retrieval improve the accuracy and
            completeness of the existing RAG system for large-scale
            engineering tender documents?
          </em>
        </p>
      </Section>

      <Section title="Contributions">
        <ul className="list-disc space-y-2 pl-5">
          {contributions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title="How the system works">
        <p>
          The pipeline builds a domain-aware knowledge graph from the tender
          corpus (free-form semantic relation extraction, constrained to
          entity types like deliverable, risk, requirement, project, and
          system), then answers queries in four stages:
        </p>
        <ol className="list-decimal space-y-3 pl-5">
          {pipelineSteps.map((step) => (
            <li key={step.name}>
              <span className="font-medium text-stone-900">{step.name}.</span>{" "}
              {step.detail}
            </li>
          ))}
        </ol>
        <figure className="mt-6">
          <div className="overflow-hidden rounded-lg border border-stone-200 bg-white p-4">
            <Image
              src="/graphrag-architecture.png"
              alt="System architecture: a query flows through query understanding, domain prediction, and retrieval-need classification into one of four retrieval strategies, whose evidence is fused, reranked by a cross-encoder, and answered by an LLM."
              width={1310}
              height={915}
              className="h-auto w-full"
            />
          </div>
          <figcaption className="mt-2 text-sm text-stone-500">
            Overall system architecture: adaptive routing between graph-based
            retrieval strategies and Hybrid RAG.
          </figcaption>
        </figure>
      </Section>

      <Section title="Results">
        <p>
          Evaluation used 200 questions, an LLM-as-a-judge protocol, and a
          Hybrid RAG baseline (BM25 + dense vectors). Dual-Level RAG clearly
          improved summarisation and aggregation queries:
        </p>
        <GroupedBarChart
          series={["Hybrid RAG", "Dual-Level RAG"]}
          ariaLabel="Grouped bar chart comparing Hybrid RAG and Dual-Level RAG on accuracy, completeness, relevance, and context precision. Dual-Level RAG scores higher on every metric."
          groups={[
            { label: "Accuracy", values: [0.84, 0.965] },
            { label: "Completeness", values: [0.794, 0.882] },
            { label: "Relevance", values: [0.93, 0.988] },
            { label: "Context precision", values: [0.824, 0.857] },
          ]}
        />
        <ResultsTable data={dualLevelResults} />
        <p>
          For relational and multi-hop queries, Weighted Hub-aware PPR-RAG
          brought smaller, not clearly significant gains — at almost double
          the latency:
        </p>
        <GroupedBarChart
          series={["Hybrid RAG", "PPR-RAG"]}
          ariaLabel="Grouped bar chart comparing Hybrid RAG and Weighted Hub-aware PPR-RAG on accuracy, completeness, relevance, and context precision for relational and multi-hop queries. PPR-RAG scores slightly higher on every metric."
          groups={[
            { label: "Accuracy", values: [0.875, 0.882] },
            { label: "Completeness", values: [0.85, 0.862] },
            { label: "Relevance", values: [0.905, 0.951] },
            { label: "Context precision", values: [0.805, 0.841] },
          ]}
        />
        <ResultsTable data={pprResults} />
      </Section>

      <Section title="Limitations">
        <p>
          Failure analysis pointed to the graph itself: the constructed
          knowledge graph had 3,921 connected components, and 75.2% of them
          contained five nodes or fewer. Most entities were isolated or lived
          in tiny neighbourhoods, so Personalized PageRank could not
          propagate across disconnected components. Imperfect entity
          resolution (acronyms, aliases, inconsistent terminology) was a major
          cause of that fragmentation.
        </p>
      </Section>

      <Section title="Takeaway">
        <p>
          Knowledge graphs improve information aggregation over plain Hybrid
          RAG, and graph retrieval and hybrid retrieval are complementary
          rather than competing. But reliable multi-hop retrieval requires a
          cleaner, better-connected graph — pointing to future work on
          ontology refinement, entity resolution (acronym and alias
          normalisation, merging semantically equivalent entities), a
          gold-standard question–answer benchmark, and evaluation on other
          EPC tenders.
        </p>
      </Section>
    </article>
  );
}
