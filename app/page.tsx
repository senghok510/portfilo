import Image from "next/image";
import Link from "next/link";
import { DataSculpture } from "@/components/data-sculpture";

const projects = [
  { number: "01", kind: "COMPUTER VISION", title: "Teaching machines\nto read music.", description: "From handwritten scores to playable MusicXML. An end-to-end optical music recognition pipeline.", href: "/projects/omr", className: "music", tags: ["YOLO", "U-Net", "Deep learning"] },
  { number: "02", kind: "GENERATIVE AI", title: "A new perspective\non face generation.", description: "Exploring controllable image synthesis with diffusion models, inpainting, and LoRA fine-tuning.", href: "/projects/mask-generation", className: "diffusion", tags: ["Stable Diffusion", "LoRA", "PyTorch"] },
  { number: "03", kind: "APPLIED MATHEMATICS", title: "Finding structure\nin uncertainty.", description: "Modelling volatility, spatial events, and financial dependencies through three time-series studies.", href: "/projects/time-series", className: "series", tags: ["GARCH", "Hawkes processes", "Statistics"] },
];

function ProjectArt({ kind }: { kind: string }) {
  if (kind === "music") return <div className="music-art" aria-hidden="true"><div className="music-lines">𝄞 <span>♪</span> ♩ <span>♫</span> ♩</div><span className="art-coordinate">INPUT: HANDWRITTEN → OUTPUT: STRUCTURED</span><span className="detection-box box-one">note · 0.98</span><span className="detection-box box-two">note · 0.96</span></div>;
  if (kind === "diffusion") return <div className="diffusion-art" aria-hidden="true"><div className="diffusion-orb" /><span className="art-coordinate">NOISE → LATENT SPACE → IMAGE</span><div className="diffusion-cross">+</div></div>;
  return <div className="series-art" aria-hidden="true"><svg viewBox="0 0 500 200" fill="none"><path d="M0 160L20 150L32 162L52 123L70 142L82 116L101 131L120 82L137 116L152 104L169 138L183 89L201 105L217 63L233 92L251 81L269 114L288 56L308 70L323 46L340 62L357 23L375 55L392 33L408 51L424 15L442 34L460 16L479 28L500 2" /><path className="chart-secondary" d="M0 175Q80 140 140 148T270 101T390 74T500 30" /></svg><span className="art-coordinate">OBSERVATION / PATTERN / PREDICTION</span></div>;
}

export default function Home() {
  return (
    <div className="home-page">
      <section className="hero page-width">
        <div className="hero-copy">
          <p className="eyebrow"><span className="status-dot" /> DATA SCIENCE & ARTIFICIAL INTELLIGENCE</p>
          <h1>Making sense<br />of complexity<span className="accent">.</span></h1>
          <div className="hero-intro"><div className="intro-rule" /><p>I’m <strong>Hok Seng</strong>, a data science & AI student at<br className="desktop-break" /> Institut Polytechnique de Paris. Turning curious<br className="desktop-break" /> questions into intelligent systems.</p></div>
          <div className="hero-actions"><a href="#selected-work" className="button button-dark">Explore my work <span>↘</span></a><Link href="/cv" className="text-link">About me <span>↗</span></Link></div>
          <div className="hero-meta"><span>BASED IN FRANCE</span><span>MASTER M2 · IP PARIS</span></div>
        </div>
        <DataSculpture />
      </section>

      <div className="discipline-strip"><div className="page-width"><span>MATHEMATICS AT THE CORE.</span><p>Machine learning <i>✳</i> Generative AI <i>✳</i> Computer vision <i>✳</i> Intelligent systems</p></div></div>

      <section className="work-section page-width" id="selected-work">
        <div className="section-heading"><div><p className="eyebrow">01 / SELECTED WORK</p><h2>Curiosity, put into practice.</h2></div><Link className="text-link" href="/projects">All projects <span>↗</span></Link></div>
        <div className="project-grid">{projects.map((project) => <Link className={`project-card ${project.className}`} href={project.href} key={project.number}><div className="project-visual"><div className="project-visual-top"><span>{project.kind}</span><span>{project.number} /</span></div><ProjectArt kind={project.className} /><span className="project-arrow">↗</span></div><div className="project-copy"><h3>{project.title}</h3><p>{project.description}</p><div className="tags">{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div></Link>)}</div>
      </section>

      <section className="experience-section page-width"><div className="section-heading"><div><p className="eyebrow">02 / IN THE REAL WORLD</p><h2>Research meets application.</h2></div><Link className="text-link" href="/internships">My experience <span>↗</span></Link></div>
        <Link href="/internships/agentic-graphrag" className="experience-row"><span className="experience-year">2026</span><div><h3>Technip Energies</h3><p>Data Science & AI Intern</p></div><span className="experience-focus">Agentic GraphRAG · Knowledge graphs</span><span className="experience-arrow">↗</span></Link>
        <Link href="/internships/phishing-detection" className="experience-row"><span className="experience-year">2025</span><div><h3>PPS</h3><p>Machine Learning Intern</p></div><span className="experience-focus">NLP · Explainable cybersecurity</span><span className="experience-arrow">↗</span></Link>
      </section>

      <section className="about-section page-width"><div className="portrait-frame"><Image src="/home/profile.png" alt="Hok Seng" width={420} height={460} className="portrait" /><span>A LITTLE ABOUT THE PERSON BEHIND THE WORK ↗</span></div><div className="about-copy"><p className="eyebrow">03 / ALWAYS LEARNING</p><h2>Driven by questions.<br /><span>Grounded in mathematics.</span></h2><p>I’m currently a Master M2 student at Institut Polytechnique de Paris, with a background in applied mathematics and artificial intelligence at École Polytechnique.</p><p>I enjoy the space between understanding an idea and making it work — whether that means connecting knowledge with AI agents, teaching a model to read music, or finding patterns in data.</p><Link href="/blogs" className="text-link">Notes from the journey <span>↗</span></Link></div></section>
      <section className="contact-section page-width"><p className="eyebrow">HAVE AN IDEA, A QUESTION, OR A CHALLENGE?</p><a href="mailto:hok.seng@polytechnique.edu">Let’s connect<span>↗</span></a><div><span>Good conversations are where interesting things begin.</span><a href="mailto:hok.seng@polytechnique.edu">hok.seng@polytechnique.edu</a></div></section>
    </div>
  );
}
