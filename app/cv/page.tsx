import type { Metadata } from "next";
import { SocialIcon } from "@/components/social-icon";

export const metadata: Metadata = {
  title: "CV",
};

// Edit the data below to keep the CV up to date.
const contact = [
  { label: "hok.seng@polytechnique.edu", href: "mailto:hok.seng@polytechnique.edu", icon: "Email" },
  { label: "(+33) 749 469 189", href: "tel:+33749469189" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/hok-seng", icon: "LinkedIn" },
  { label: "GitHub", href: "https://github.com/senghok510", icon: "GitHub" },
  { label: "hokseng.dev", href: "https://www.hokseng.dev" },
];

const summary =
  "École Polytechnique student specializing in Data Science and AI, passionate about building end-to-end AI solutions for real-world challenges. Eager to apply innovative approaches, tackle technical challenges, and contribute to impactful projects. Seeking a 6-month internship starting in April 2027.";

const education = [
  {
    school: "Institut Polytechnique de Paris (IP Paris), Paris, France",
    degree: "Master degree in Data Science and AI",
    period: "2026 – 2027",
    details: [
      "Courses: Geometry processing for Deep Learning, AI for sound, Reinforcement Learning, generative models, etc.",
    ],
  },
  {
    school: "École Polytechnique, Paris, France",
    degree: "Engineering degree in AI",
    period: "2023 – 2027",
    details: [
      "Courses: Computer vision, Data structure & Algorithm, Machine Learning, Deep learning, Representation Learning, etc.",
    ],
  },
];

const experience = [
  {
    title: "Agentic GraphRAG for Tendering Intelligence",
    org: "Technip Energies, Nanterre",
    period: "Mar 2026 – Aug 2026",
    details: [
      "Built Agentic Query Efficient GraphRAG including extraction ontology, entity-resolution, and document-classification pipelines for tender documents using Neo4j and Cypher.",
      "Implemented graph retrieval algorithms—including penalized hub-weighted Personalized PageRank and dual-level retrieval.",
      "Evaluated graph quality and workflow components through benchmarks and ablation studies, with agent tracing in MLflow.",
    ],
  },
  {
    title: "Data Anonymization in Cybersecurity",
    org: "Paris Partner Software, Courbevoie",
    period: "Jun 2025 – Sep 2025",
    details: [
      "Developed an NLP model from scratch using semi-supervised learning, enabling secure anonymization of PII to prevent leaks in collaborative development while ensuring GDPR compliance.",
      "Fine-tuned the GLiNER model for multi-entity recognition, safeguarding sensitive data in team-based software development and secure data sharing in enterprise projects, ensuring scalability and privacy.",
    ],
  },
];

const projects = [
  {
    title: "SheetPilot: Multi-Agent Spreadsheet Automation with SkillOpt",
    period: "Sep 2026 – Present",
    details: [
      "Designing a multi-agent assistant for financial reporting with three specialized agents: spreadsheet generation for budget models, financial modeling, debugging for formula repair, and visualization for business KPI charts.",
      "Investigating SkillOpt-based optimization of agent skills through execution feedback, formula dependency analysis, and recalculation checks to improve reliability.",
      "Defining reproducible evaluations on SpreadsheetBench 2 to compare single-agent and multi-agent approaches across task accuracy, workbook preservation, latency, and cost.",
    ],
  },
  {
    title: "Multimodal OCR Fine-Tuning for Document Digitization",
    period: "Ongoing",
    details: [
      "Fine-tuning multimodal OCR models to convert scanned documents into digitized, editable formats such as Word, building on open-source Chinese pretrained models: PaddleOCR-VL, SVTR, DBNet and PP-OCR.",
    ],
  },
  {
    title: "Optical Music Recognition",
    org: "École Polytechnique",
    period: "Jan 2026 – Mar 2026",
    details: [
      "Built an end-to-end pipeline turning handwritten sheet music into playable MusicXML: U-Net staff removal, YOLOv12 symbol detection, an MLP relation linker and a rule-based assembler handling multi-staff grouping, polyphony, and tuplets.",
    ],
  },
  {
    title: "Stable Diffusion Fine-Tuning",
    org: "École Polytechnique",
    period: "Jan 2026 – Mar 2026",
    details: [
      "Fine-tuned a Stable Diffusion inpainting model to generate realistic face masks, using segmentation-based conditioning and evaluating image quality with IoU and Dice metrics.",
    ],
  },
  {
    title: "Multi-agent travel service",
    org: "AI Tinkerers, Google Cloud Run",
    period: "Sep 2025 – Oct 2025",
    details: [
      "Built an end-to-end multi-agent travel chatbot as a team, using multimodal models to book hotels, recommend attractions, and generate invoices with scannable tickets through voice and chat interfaces, deployed on Cloud Run.",
    ],
  },
  {
    title: "Influencer or Observer: Predicting Social Roles",
    org: "École Polytechnique",
    period: "Oct 2025 – Dec 2025",
    details: [
      "Fine-tuned Pythia and RoBERTa for social-role classification, combining their embeddings with user-level features and gradient-boosted ensembles; achieved 85.9% accuracy and ranked in the top 3 out of 80 teams.",
    ],
  },
];

const skills = [
  { label: "Programming languages", value: "Python (PyTorch, LangChain, LangGraph), R, Java, PySpark" },
  { label: "Tools", value: "Git/GitHub, GitLab, Docker" },
];

const languages = [
  { label: "Khmer", value: "Native" },
  { label: "English", value: "C1 – Advanced" },
  { label: "French", value: "B2 – Intermediate" },
];

const interests = [
  { label: "Sports", value: "Soccer, played 3 times every week since 2023" },
  { label: "Chess", value: "Playing in my free time for one year" },
];

type Entry = {
  title: string;
  org?: string;
  period: string;
  details: string[];
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-400">
        {title}
      </h2>
      <div className="mt-4 space-y-8">{children}</div>
    </section>
  );
}

function EntryItem({ entry }: { entry: Entry }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-medium">
          {entry.title}
          {entry.org && <span className="text-stone-500"> · {entry.org}</span>}
        </h3>
        <span className="shrink-0 text-sm text-stone-500">{entry.period}</span>
      </div>
      {entry.details.map((detail) => (
        <p key={detail} className="mt-2 leading-relaxed text-stone-600">
          {detail}
        </p>
      ))}
    </div>
  );
}

function FactList({ facts }: { facts: { label: string; value: string }[] }) {
  return (
    <dl className="space-y-2">
      {facts.map((fact) => (
        <div key={fact.label} className="flex flex-wrap gap-x-2">
          <dt className="font-medium">{fact.label}:</dt>
          <dd className="text-stone-600">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function CVPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <header>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">Hok Seng</h1>
          <a
            href="/cv/cv.pdf"
            className="text-sm text-stone-500 underline decoration-stone-300 underline-offset-4 hover:text-stone-900 hover:decoration-stone-500"
          >
            Download PDF
          </a>
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone-500">
          {contact.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className="inline-flex items-center gap-1.5 transition-colors hover:text-stone-900"
              >
                {item.icon && <SocialIcon name={item.icon} />}
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-2xl leading-relaxed text-stone-600">
          {summary}
        </p>
      </header>

      <Section title="Education">
        {education.map((item) => (
          <EntryItem
            key={item.school}
            entry={{
              title: item.school,
              period: item.period,
              details: [item.degree, ...item.details],
            }}
          />
        ))}
      </Section>

      <Section title="Professional Experience">
        {experience.map((entry) => (
          <EntryItem key={entry.title} entry={entry} />
        ))}
      </Section>

      <Section title="Academic Projects">
        {projects.map((entry) => (
          <EntryItem key={entry.title} entry={entry} />
        ))}
      </Section>

      <Section title="Skills">
        <FactList facts={skills} />
      </Section>

      <Section title="Languages">
        <FactList facts={languages} />
      </Section>

      <Section title="Interests">
        <FactList facts={interests} />
      </Section>
    </div>
  );
}
