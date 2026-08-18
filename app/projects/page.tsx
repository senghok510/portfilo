import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
};

// Edit this list to add or update projects.
const projects = [
  {
    name: "Personal Portfolio",
    status: "Ongoing",
    description:
      "This website — built with Next.js, Tailwind CSS, and MDX for blog posts.",
    link: "https://github.com/",
  },
  {
    name: "Example Project",
    status: "Past",
    description:
      "Placeholder entry — describe the problem it solves, the stack you used, and link to the code or a demo.",
    link: "https://github.com/",
  },
];

export default function ProjectsPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
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
