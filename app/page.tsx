import Image from "next/image";

export default function Home() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-6 text-center">
  <Image
    src="/home/profile.png"
    alt="Portrait of Seng Hok"
    width={160}
    height={160}
    priority
    className="size-40 rounded-full border border-stone-200 object-cover"
  />

  <h1 className="mt-8 text-3xl font-semibold tracking-tight">
    Hi, I&apos;m Hok Seng 👋
  </h1>

  <p className="mt-4 max-w-xl text-balance leading-relaxed text-stone-600">
    I build at the intersection of{" "}
    <span className="font-medium text-stone-900">data, AI, and real-world problems</span>.
    From machine learning experiments to production-minded AI systems, I enjoy
    turning ideas into things that actually work.
  </p>

  <p className="mt-3 max-w-xl text-balance leading-relaxed text-stone-500">
    This portfolio is a collection of the projects, internships, experiments,
    and lessons that have shaped how I think and build.
  </p>
</section>
   
  );
}
