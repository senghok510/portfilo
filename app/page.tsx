import Image from "next/image";
import { SocialIcon } from "@/components/social-icon";

const socials = [
  { label: "Email", href: "mailto:hok.seng@polytechnique.edu" },
  { label: "GitHub", href: "https://github.com/senghok510" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/hok-seng" },
];

function Key({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-accent">{children}</strong>;
}

export default function Home() {
  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-14">
      <div className="flex flex-col-reverse gap-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xl">
          <h1 className="text-4xl font-semibold tracking-tight">
            <span className="text-accent">Hok</span> Seng
          </h1>
          <p className="mt-1 text-stone-500">hok.seng@polytechnique.edu</p>

          <p className="mt-6 leading-relaxed text-stone-700">
            I build at the intersection of <Key>data</Key>, <Key>AI</Key>, and
            real-world problems. From machine learning experiments to
            production-minded AI systems, I enjoy turning ideas into things
            that actually work.
          </p>
          <p className="mt-4 leading-relaxed text-stone-600">
            This portfolio is a collection of the projects, internships,
            experiments, and lessons that have shaped how I think and build.
          </p>

          <ul className="mt-8 flex flex-wrap gap-3 text-sm">
            {socials.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target={social.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-4 py-1.5 hover:border-accent hover:bg-accent-soft"
                >
                  <SocialIcon name={social.label} />
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <Image
          src="/home/profile.png"
          alt="Portrait of Seng Hok"
          width={224}
          height={224}
          priority
          className="size-44 shrink-0 rounded-full border border-stone-200 object-cover shadow-sm md:size-56"
        />
      </div>
    </section>
  );
}
