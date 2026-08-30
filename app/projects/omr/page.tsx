import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Formula } from "@/components/formula";

export const metadata: Metadata = {
  title: "Handwritten Optical Music Recognition",
  description:
    "Project write-up: an end-to-end handwritten music recognition pipeline — U-Net destaffing, YOLOv12 symbol detection, an MLP relation linker, and rule-based semantic assembly producing playable MusicXML.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-400">
        {title}
      </h2>
      <div className="mt-4 space-y-4 leading-relaxed text-stone-700">
        {children}
      </div>
    </section>
  );
}

function Figure({
  src,
  alt,
  width,
  height,
  caption,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption: string;
}) {
  return (
    <figure>
      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white p-3">
        <Image src={src} alt={alt} width={width} height={height} className="h-auto w-full" />
      </div>
      <figcaption className="mt-2 text-sm text-stone-500">{caption}</figcaption>
    </figure>
  );
}

function Remark({ children }: { children: React.ReactNode }) {
  return (
    <p>
      <span className="font-medium text-stone-900">Remark.</span> {children}
    </p>
  );
}

export default function OMRPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link
        href="/projects"
        className="text-sm text-stone-500 transition-colors hover:text-stone-900"
      >
        ← Projects
      </Link>

      <header className="mt-6">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          Handwritten Music Recognition: From Score Image to MusicXML
        </h1>
        <p className="mt-3 text-stone-500">
          Optical Music Recognition project, École Polytechnique · Sep 2025 · with Yuguang Yao
        </p>
        <p className="mt-1 text-sm text-stone-500">
          <a
            href="/OMR/Projet_d_OMR.pdf"
            className="underline decoration-stone-300 underline-offset-4 hover:text-stone-900 hover:decoration-stone-500"
          >
            Report (PDF)
          </a>
        </p>
      </header>

      <Section title="Overview">
        <p>
          Optical Music Recognition (OMR) is the problem of teaching a
          computer to <em>read sheet music</em> — recovering not just the
          symbols on the page but their musical meaning, so the score can be
          played back or edited. It is substantially harder than OCR:
          music notation is a two-dimensional language where a symbol&apos;s
          meaning depends on its spatial context (a notehead&apos;s pitch is
          defined by its position relative to staff lines and the active
          clef), symbols range from tiny augmentation dots to page-high
          braces, and multiple voices can share the same horizontal
          position. Handwritten scores add a further layer of variability.
        </p>
        <p>
          Building on the system of Yang et al. (2024), we first reproduced
          their detector-plus-linker approach, then extended it into a
          complete end-to-end pipeline that outputs{" "}
          <strong>ready-to-use MusicXML</strong> — files that open and play
          in MuseScore. Our relation-prediction module reaches a{" "}
          <strong>Match+AUC of 0.86</strong> on the MUSCIMA++ handwritten
          benchmark, and the rule-based assembly stage we added handles
          multi-staff grouping, polyphonic voice alignment, and tuplet
          detection.
        </p>
        <Figure
          src="/OMR/pipeline.png"
          alt="Data-flow diagram: MUSCIMA++ input images pass through U-Net destaffing preprocessing, then YOLOv12 detection; detections feed both an MLP linker for relation prediction, evaluated at 0.86 Match+AUC, and an assembler performing semantic assembly that outputs MusicXML."
          width={1358}
          height={458}
          caption="System data flow: U-Net preprocessing → YOLOv12 detection → MLP relation linking → rule-based semantic assembly → MusicXML."
        />
        <Remark>
          The architecture splits the problem into{" "}
          <em>perception</em> (what symbols are where — learned by neural
          networks) and <em>semantics</em> (what they mean together —
          reconstructed by explicit musical rules). That division of labour
          is deliberate: detection and linking are pattern-recognition
          problems with abundant training signal, while music&apos;s
          grammar — how stems, beams and noteheads combine into timed,
          pitched notes — is known a priori and better encoded as rules
          than relearned from 140 pages of data.
        </Remark>
      </Section>

      <Section title="Dataset & preprocessing">
        <p>
          We work with <strong>MUSCIMA++</strong>: 140 pages of complex
          handwritten music yielding 3,487 cropped images, annotated with
          both symbol bounding boxes (117 classes — noteheads, stems,
          beams, rests, accidentals, clefs, time signatures…) and the
          ground-truth <em>notation graph</em> of relationships between
          them. Three preprocessing steps prepare the images for detection:
          a <strong>U-Net</strong> performs pixel-wise &ldquo;destaffing&rdquo;,
          erasing the staff lines that overlap nearly every symbol; full
          pages are sliced into overlapping 640×640 patches so no symbol is
          cut at a boundary; and the XML notation-graph annotations are
          converted to YOLO training format.
        </p>
      </Section>

      <Section title="Detection & relation prediction">
        <p>
          <span className="font-medium text-stone-900">
            Visual detection (YOLOv12).
          </span>{" "}
          The perception engine is the latest YOLO architecture, trained
          for 100 epochs with SGD and Mosaic augmentation at 640-pixel
          resolution. Compared to earlier versions, YOLOv12 notably
          improves small-object detection — which is exactly what a score
          demands, where an augmentation dot or accidental occupies a
          handful of pixels. The model achieves high mAP on the common
          symbol classes, giving the later stages a solid foundation.
        </p>
        <p>
          <span className="font-medium text-stone-900">
            Relation prediction (MLP linker).
          </span>{" "}
          Detected symbols are discrete boxes; music arises from their
          connections — which notehead belongs to which stem, which stem to
          which beam. We cast this as link prediction on a graph whose
          nodes are the detected symbols. For each symbol pair, an MLP (3
          hidden layers) sees geometric features (relative offsets,
          normalized coordinates, IoU overlap) concatenated with learned
          32-dimensional class embeddings for each symbol — letting it
          learn that noteheads connect to stems but never to clefs — and
          outputs the probability of a directed edge. On the test set the
          linker scores <strong>0.86 Match+AUC</strong>, the benchmark
          metric combining edge precision against the ground-truth graph
          with ranking quality of the predicted probabilities.
        </p>
      </Section>

      <Section title="Semantic assembly">
        <p>
          The notation graph is still not music. The assembly module we
          added transforms it into a hierarchical score tree through six
          rule-based phases: grouping staves into systems (via braces and
          measure separators), slicing time into measures by detecting and
          merging barlines, assembling notes from primitives (including
          creating <em>virtual stems</em> when a detection is missed),
          tracking state-persistent attributes like clefs and key
          signatures across measures, detecting tuplets with a cascade of
          four rules plus a duration sanity check, and finally determining
          pitch. Pitch comes from pure geometry — the notehead&apos;s
          vertical offset from the nearest staff line, measured in
          half-spacings:
        </p>
        <Formula math="\text{steps} = i_{\text{closest}} \times 2 + \frac{y_{\text{note}} - y_{\text{closest}}}{h}, \qquad h = \operatorname{median}(\Delta y_{\text{lines}})/2" />
        <p>
          mapped to a diatonic pitch through clef-specific reference lines
          and adjusted by any detected accidentals.
        </p>
        <Figure
          src="/OMR/stages.png"
          alt="The same three-stave handwritten excerpt shown four times: the raw scan with staff lines; after U-Net destaffing with staff lines erased and symbols intact; with YOLOv12 detections drawn as colored boxes on noteheads, stems, beams and barlines; and with the MLP linker's predicted relations drawn as magenta and yellow connections between symbols."
          width={1200}
          height={1564}
          caption="One excerpt through the pipeline: raw scan → U-Net destaffing → YOLOv12 detections → linked notation graph."
        />
        <Remark>
          Following a single excerpt down the four panels shows what each
          stage contributes and why the order matters. After destaffing
          (second panel) the symbols survive intact while the five-line
          grid disappears — without this, staff lines would corrupt nearly
          every bounding box. The detection panel shows the coverage
          problem YOLO solves: hundreds of boxes per excerpt across wildly
          different symbol sizes. And the final panel makes the
          graph-structure idea concrete — the magenta and yellow links{" "}
          <em>are</em> the notation graph, tying noteheads to stems to
          beams, which is the structure the assembler walks to emit notes
          with correct durations and voices.
        </Remark>
        <Figure
          src="/OMR/final-score.png"
          alt="Clean typeset musical notation across five systems, rendered from the MusicXML file generated by the system for the handwritten input."
          width={666}
          height={358}
          caption="The end product: the generated MusicXML rendered as typeset notation in standard software."
        />
        <Remark>
          This is the figure that certifies &ldquo;end-to-end&rdquo;: the
          messy handwritten scan from the first panel above has become a
          clean, editable, playable digital score — polyphonic voices and
          tuplets included. Getting here is precisely what separates a full
          OMR system from a symbol detector with good metrics, and it is
          the part our assembly module contributes over the reproduced
          baseline.
        </Remark>
      </Section>

      <Section title="Limitations & future work">
        <p>
          The linker&apos;s benchmark score hides a practical weakness:
          some of its errors are <em>musically illogical</em> mismatches
          that a human would never make, and the current rule-based
          reasoning cannot always repair them — a natural next step is
          small learned models assisting specific assembly sub-steps. The
          symbol vocabulary also covers only the essential classes so far.
          Longer term, we want probabilistic, interactive processing in the
          spirit of Audiveris: surfacing detection confidence to a user
          interface where recognition results can be corrected by hand —
          since this project is ongoing, that is where it is headed.
        </p>
      </Section>
    </article>
  );
}
