import type { Metadata } from "next";
import Image from "next/image";
import polytechniqueLogo from "@/images/POLYTECHNIQUE-IP_PARIS.png";

export const metadata: Metadata = {
  title: "School Projects",
};

const projectGroups = [
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
];

export default function ProjectsPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-12">
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
      <div className="mt-10 space-y-14">
        {projectGroups.map((group) => (
          <section key={group.title}>
            <h2 className="border-b-2 border-stone-300 pb-3 text-2xl font-semibold tracking-tight text-stone-900">
              {group.title}
            </h2>
            <ul className="mt-7 space-y-10">
              {group.projects.map((project) => (
                <li key={project.name}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-lg font-medium">
                      <a
                        href={project.link}
                        className="underline decoration-stone-300 underline-offset-4 hover:decoration-stone-500"
                      >
                        {project.name}
                      </a>
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
          </section>
        ))}
      </div>
    </section>
  );
}
