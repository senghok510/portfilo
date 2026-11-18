import type { Metadata } from "next";
import Image from "next/image";
import polytechniqueLogo from "@/images/POLYTECHNIQUE-IP_PARIS.png";

export const metadata: Metadata = {
  title: "School Projects",
};

type Project = {
  name: string;
  status: string;
  topics: string[];
  description: string;
  link?: string;
};

const projectGroups: { title: string; projects: Project[] }[] = [
  {
    title: "Ongoing",
    projects: [
      {
        name: "SheetPilot: Multi-Agent Spreadsheet Automation with SkillOpt",
        status: "Sep 2026 – Present",
        topics: [
          "Multi-agent systems",
          "SkillOpt",
          "Financial modelling",
          "SpreadsheetBench 2",
        ],
        description:
          "Multi-agent assistant for financial reporting with three specialised agents — spreadsheet generation for budget models, formula debugging and repair, and KPI chart visualisation. Investigating SkillOpt-based optimisation of agent skills through execution feedback, formula dependency analysis and recalculation checks, with reproducible evaluations on SpreadsheetBench 2 comparing single-agent and multi-agent approaches on accuracy, workbook preservation, latency and cost.",
      },
      {
        name: "Multimodal OCR Fine-Tuning for Document Digitization",
        status: "Ongoing",
        topics: [
          "OCR",
          "Multimodal models",
          "Fine-tuning",
          "PaddleOCR-VL",
          "SVTR",
          "DBNet",
          "PP-OCR",
        ],
        description:
          "Fine-tuning multimodal OCR models to convert scanned documents into digitised, editable formats such as Word, building on open-source Chinese pretrained models: PaddleOCR-VL, SVTR, DBNet and PP-OCR.",
      },
    ],
  },
  {
    title: "Machine Learning",
    projects: [
      {
        name: "Influencer or Observer: Predicting Social Roles",
        status: "Autumn 2025",
        topics: [
          "Fine-tuning RoBERTa/Pythia",
          "Feature engineering",
          "Transformer embeddings",
          "Optuna",
          "Ensemble learning",
        ],
        description:
          "Kaggle challenge (3rd year, École Polytechnique): classifying Twitter accounts as Influencers or Observers with an end-to-end ML pipeline — user-level feature engineering, RoBERTa/Pythia embeddings, Optuna-tuned LightGBM/XGBoost, and a bagged ensemble reaching 0.859 leaderboard accuracy.",
        link: "/projects/influencer-observer",
      },
      {
        name: "Statistical Modelling of Random Processes",
        status: "2026",
        topics: [
          "Time-series analysis",
          "GARCH",
          "Hawkes processes",
          "Quantitative finance",
          "Pair trading",
        ],
        description:
          "Three time-series case studies (APM 52065, École Polytechnique): forecasting gold-futures volatility with a GARCH(1,1)-Student model, modelling crime contagion in Chicago with spatio-temporal Hawkes processes, and a copula-based VIX/RVX pair-trading strategy returning +93% over 2021–2025.",
        link: "/projects/time-series",
      },
    ],
  },
  {
    title: "Artificial Intelligence",
    projects: [
      {
        name: "Handwritten Music Recognition (OMR)",
        status: "2025",
        topics: [
          "Image segmentation",
          "U-Net",
          "YOLOv12",
          "Graph algorithms",
          "Link prediction",
          "Rule-based reasoning",
        ],
        description:
          "École Polytechnique research project: an end-to-end pipeline turning handwritten sheet music into playable MusicXML — U-Net staff removal, YOLOv12 symbol detection, an MLP relation linker (0.86 Match+AUC on MUSCIMA++), and a rule-based assembler handling multi-staff grouping, polyphony, and tuplets.",
        link: "/projects/omr",
      },
      {
        name: "Face-Mask Generation with Stable Diffusion Inpainting",
        status: "2026",
        topics: [
          "Generative AI",
          "Image segmentation",
          "Stable Diffusion",
          "LoRA",
          "Image inpainting",
        ],
        description:
          "Generative modelling course (École Polytechnique): synthesising realistic masked faces from clean portraits with a two-stage pipeline — a U-Net mask predictor (IoU 0.93) followed by diffusion generation. A LoRA-fine-tuned Stable Diffusion inpainting model reached FID 17.7, beating DDPM-from-scratch and CycleGAN baselines.",
        link: "/projects/mask-generation",
      },
    ],
  },
  {
    title: "Hackathon",
    projects: [
      {
        name: "Île-de-France Mobilités Data Visualization Hackathon",
        status: "2026",
        topics: [
          "Data visualization",
          "Public transport",
          "Accessibility",
          "Employment",
          "Inequality",
          "Train timetables",
        ],
        description:
          "Île-de-France Mobilités visualization hackathon (2026): built an interactive data visualization exploring how access to employment relates to public-transport accessibility, using train timetables to reveal territorial inequalities across the region.",
        link: "https://dataviz.hokseng.dev",
      },
      {
        name: "MMBU Challenge: Biomedical Object Detection with Fine-Tuned VLMs",
        status: "2026",
        topics: [
          "Vision-language models",
          "Fine-tuning",
          "Object detection",
          "Biomedical imaging",
          "Benchmarking",
        ],
        description:
          "Challenge built on MMBU (Massive Multimodal Biomedical Understanding), the Stanford benchmark that tests how well vision-language models perceive biomedical images across 11 modalities. Its authors report that object detection is the main failure mode: models often recognise a finding when given a region but struggle to localise it on their own. I fine-tuned an open-source VLM on the object-detection task, aiming for precise localisation and to compete with the baselines published by the Stanford team.",
        link: "https://arxiv.org/abs/2606.06696",
      },
    ],
  },
];

export default function ProjectsPage() {
  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-12">
      <header className="relative overflow-hidden rounded-2xl border border-[#c6dce8] bg-gradient-to-br from-[#eef7fb] via-white to-stone-50 px-6 py-8 shadow-sm sm:px-8 sm:py-10">
        <div className="relative z-10 max-w-lg pr-20 sm:pr-32">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#075078]">
            École Polytechnique · IP Paris
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
            School Projects
          </h1>
          <p className="mt-3 max-w-md leading-relaxed text-stone-600">
            Selected coursework and research across machine learning,
            artificial intelligence, statistical modelling, and generative
            systems.
          </p>
        </div>
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-14 size-48 rounded-full bg-[#dcecf4]/70 blur-2xl sm:right-0"
        />
        <Image
          src={polytechniqueLogo}
          alt="École Polytechnique and Institut Polytechnique de Paris"
          priority
          className="absolute right-3 top-1/2 h-36 w-auto -translate-y-1/2 drop-shadow-sm sm:right-7 sm:h-48"
        />
      </header>
      <div className="mt-10 space-y-6">
        {projectGroups.map((group) => (
          <details key={group.title} className="group">
            <summary className="flex cursor-pointer list-none items-center gap-3 border-b-2 border-stone-300 pb-3 marker:hidden hover:border-accent hover:text-accent [&::-webkit-details-marker]:hidden">
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="size-5 shrink-0 transition-transform group-open:rotate-90"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 4l6 6-6 6" />
              </svg>
              <h2 className="text-2xl font-semibold tracking-tight">
                {group.title}
              </h2>
              <span className="ml-auto text-sm text-stone-500">
                {group.projects.length}{" "}
                {group.projects.length === 1 ? "project" : "projects"}
              </span>
            </summary>
            <ul className="mt-7 space-y-10">
              {group.projects.map((project) => (
                <li key={project.name}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-lg font-medium">
                      {project.link ? (
                        <a
                          href={project.link}
                          {...(project.link.startsWith("http")
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                          className="underline decoration-stone-300 underline-offset-4 hover:decoration-stone-500"
                        >
                          {project.name}
                        </a>
                      ) : (
                        project.name
                      )}
                    </h3>
                    <span className="text-sm text-stone-500">
                      {project.status}
                    </span>
                  </div>
                  <ul
                    className="mt-3 flex flex-wrap gap-2"
                    aria-label={`${project.name} topics`}
                  >
                    {project.topics.map((topic) => (
                      <li
                        key={topic}
                        className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-600"
                      >
                        {topic}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 leading-relaxed text-stone-600">
                    {project.description}
                  </p>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  );
}
