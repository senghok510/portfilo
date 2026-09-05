import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "School Projects",
};

// Edit this list to add or update projects.
const projects = [
  {
    name: "Handwritten Music Recognition (OMR)",
    status: "Ongoing",
    description:
      "École Polytechnique research project: an end-to-end pipeline turning handwritten sheet music into playable MusicXML — U-Net staff removal, YOLOv12 symbol detection, an MLP relation linker (0.86 Match+AUC on MUSCIMA++), and a rule-based assembler handling multi-staff grouping, polyphony, and tuplets.",
    link: "/projects/omr",
  },
  {
    name: "Face-Mask Generation with Stable Diffusion Inpainting",
    status: "2026",
    description:
      "Generative modelling course (École Polytechnique): synthesising realistic masked faces from clean portraits with a two-stage pipeline — a U-Net mask predictor (IoU 0.93) followed by diffusion generation. A LoRA-fine-tuned Stable Diffusion inpainting model reached FID 17.7, beating DDPM-from-scratch and CycleGAN baselines.",
    link: "/projects/mask-generation",
  },
  {
    name: "Statistical Modelling of Random Processes",
    status: "2026",
    description:
      "Three time-series case studies (APM 52065, École Polytechnique): forecasting gold-futures volatility with a GARCH(1,1)-Student model, modelling crime contagion in Chicago with spatio-temporal Hawkes processes, and a copula-based VIX/RVX pair-trading strategy returning +93% over 2021–2025.",
    link: "/projects/time-series",
  },
  {
    name: "Influencer or Observer: Predicting Social Roles",
    status: "Autumn 2025",
    description:
      "Kaggle challenge (3rd year, École Polytechnique): classifying Twitter accounts as Influencers or Observers with an end-to-end ML pipeline — user-level feature engineering, RoBERTa/Pythia embeddings, Optuna-tuned LightGBM/XGBoost, and a bagged ensemble reaching 0.859 leaderboard accuracy.",
    link: "/projects/influencer-observer",
  },
];

export default function ProjectsPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-12">
      <p className="eyebrow index-eyebrow">THE PROJECT ARCHIVE</p>
      <h1 className="text-2xl font-semibold tracking-tight">Ideas into experiments.</h1>
      <p className="index-intro">Selected work across computer vision, generative AI, and applied mathematics. Explore the questions, methods, and results behind each project.</p>
      <ul className="mt-8 space-y-10">
        {projects.map((project) => (
          <li key={project.name}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-medium">
                <a
                  href={project.link}
                  className="underline decoration-stone-300 underline-offset-4 hover:decoration-stone-500"
                >
                  {project.name}
                </a>
              </h2>
              <span className="text-sm text-stone-500">{project.status}</span>
            </div>
            <p className="mt-2 leading-relaxed text-stone-600">
              {project.description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
