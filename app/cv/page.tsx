import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CV",
};

// Edit the data below to keep the CV up to date.
const contact = [
  { label: "hok.seng@polytechnique.edu", href: "mailto:hok.seng@polytechnique.edu" },
  { label: "(+33) 749 469 189", href: "tel:+33749469189" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/hok-seng" },
  { label: "GitHub", href: "https://github.com/senghok510" },
];

const summary =
  "Third-year student at École Polytechnique, looking for a 4-month internship in data science or AI starting March 2026. Passionate about teamwork, curious, and autonomous.";

const education = [
  {
    school: "École Polytechnique, Paris, France",
    degree: "Engineering degree in applied mathematics and artificial intelligence",
    period: "2023 – Present",
    details: [
      "Coursework: Computer Vision, Natural Language Processing, Machine Learning, Deep Learning",
    ],
  },
  {
    school: "Institute of Technology of Cambodia (ITC), Phnom Penh, Cambodia",
    degree: "Two years of core curriculum: Mathematics, Physics, Computer Science",
    period: "2020 – 2023",
    details: [],
  },
];

const experience = [
  {
    title: "Agentic GraphRAG for tendering",
    org: "Technip Energies",
    period: "Mar 2026 – Jul 2026",
    details: [
      "Implemented a Personalized PageRank algorithm for multi-hop questions and designed an agent system to answer a wide range of queries.",
    ],
  },
  {
    title: "Data anonymization in cybersecurity with GLiNER",
    org: "PPS",
    period: "Jun 2025 – Sep 2025",
    details: [
      "Implemented and optimized the GLiNER classification model with LoRA fine-tuning on a synthetic dataset generated via Gretel.ai; benchmarked against a BERT-BiLSTM-CRF baseline and spaCy (en_core_web_sm).",
    ],
  },
];

const projects = [
  {
    title: "Optical Music Recognition (OMR)",
    org: "École Polytechnique",
    period: "Sep 2025",
    details: [
      "Improved the OMR pipeline using a YOLO model and a graph neural network to convert raw sheet music into MusicXML.",
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
    title: "Improving meta-analysis methodologies",
    org: "INRAE",
    period: "Sep 2024 – Apr 2025",
    details: [
      "Developed data-imputation methods for ecological datasets with missing standard deviations, enabling meta-analyses with a multilevel model to estimate effect sizes and their variance. Won the 'Best Project' award from the Applied Mathematics Department.",
    ],
  },
];

const volunteering = [
  {
    title: "President of a study club",
    org: "Khmer Polytechnicians Association",
    period: "Oct 2024 – Present",
    details: [
      "Organize seminars, inviting experienced speakers to share knowledge on selected topics.",
    ],
  },
];

const skills = [
  { label: "Programming languages", value: "Python (PyTorch, LangChain), R, JavaScript" },
  { label: "Tools", value: "Git/GitHub, VS Code, Docker" },
];

const languages = [
  { label: "Khmer", value: "Native" },
  { label: "English", value: "C1 – Advanced" },
  { label: "French", value: "B2 – Intermediate" },
];

const interests = [
  { label: "Sports", value: "Football twice a week" },
  { label: "Chess", value: "Casual games in my free time" },
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
                className="transition-colors hover:text-stone-900"
              >
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

      <Section title="Volunteering">
        {volunteering.map((entry) => (
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
