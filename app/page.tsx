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
        Hi, I&apos;m Hok Seng👋
      </h1>
      <p className="mt-4 max-w-md text-balance leading-relaxed text-stone-600">
        Welcome! I&apos;m a data science and AI student who loves building things.
        Have a look around — my projects, internships, and blog posts are all
        here.
      </p>
    </section>
  );
}
