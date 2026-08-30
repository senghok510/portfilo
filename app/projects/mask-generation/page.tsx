import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Formula } from "@/components/formula";

export const metadata: Metadata = {
  title: "Face-Mask Generation with Stable Diffusion",
  description:
    "Project write-up: synthesising realistic masked faces from clean portraits with a U-Net mask predictor and diffusion models — DDPM from scratch and LoRA-fine-tuned Stable Diffusion inpainting vs a CycleGAN baseline.",
};

const fidTable = [
  { method: "CycleGAN (baseline)", epochs: "30", train: "28.43", test: "28.48" },
  { method: "DDPM (from scratch)", epochs: "50", train: "47.09", test: "48.93" },
  { method: "Stable Diffusion + LoRA", epochs: "30", train: "—", test: "17.69" },
];

const sdMetrics = [
  { metric: "FID (lower is better)", value: "17.69" },
  { metric: "LPIPS (lower is better)", value: "0.073" },
  { metric: "PSNR (higher is better)", value: "23.56 dB" },
  { metric: "MAE — whole image", value: "0.0362" },
  { metric: "MAE — mask region", value: "0.0802" },
  { metric: "MAE — background", value: "0.0268" },
];

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

export default function MaskGenerationPage() {
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
          Face-Mask Generation with Stable Diffusion Inpainting
        </h1>
        <p className="mt-3 text-stone-500">
          Generative modelling course, École Polytechnique · 2026 · with
          Mohamed Amine Amrani
        </p>
        <p className="mt-1 flex gap-4 text-sm text-stone-500">
          <a
            href="/mask_generator/Seng_Amrani.pdf"
            className="underline decoration-stone-300 underline-offset-4 hover:text-stone-900 hover:decoration-stone-500"
          >
            Report (PDF)
          </a>
          <a
            href="/mask_generator/Poster_Amrani_Seng_2026.pdf"
            className="underline decoration-stone-300 underline-offset-4 hover:text-stone-900 hover:decoration-stone-500"
          >
            Poster (PDF)
          </a>
        </p>
      </header>

      <Section title="Overview">
        <p>
          Face-recognition systems trained on unmasked faces often fail on
          masked ones — the occlusion removes half the facial features — yet
          public masked-face datasets remain scarce, lack diversity, and
          rarely annotate correct vs incorrect mask wearing. Collecting more
          real face data is costly and privacy-sensitive, so we asked the
          generative question instead:{" "}
          <em>
            given a clean portrait, can we synthesise a photo-realistic
            masked version of the same person?
          </em>
        </p>
        <p>
          We built a two-stage pipeline — a U-Net that predicts{" "}
          <em>where</em> the mask should go, then a diffusion model that
          generates it — and compared two diffusion approaches against the
          strongest GAN baseline (CycleGAN): a denoising diffusion
          probabilistic model (DDPM) trained from scratch, and a pretrained
          Stable Diffusion inpainting model fine-tuned with LoRA. The
          LoRA-adapted Stable Diffusion won clearly, reaching{" "}
          <strong>FID 17.69</strong> against 28.48 for CycleGAN. Training
          data combined 70k clean faces from FFHQ with the 133k synthetic
          masked faces of MaskedFace-Net.
        </p>
        <Figure
          src="/mask_generator/DDPM_diagram.png"
          alt="Pipeline diagram: a clean face goes through a U-Net that outputs a predicted mask region; the mask is combined with the clean face to define the editable area; a diffusion model iteratively denoises this input to produce the generated masked face."
          width={670}
          height={480}
          caption="The two-stage pipeline: the U-Net localises the mask region, the diffusion model synthesises the mask inside it."
        />
        <Remark>
          The decoupling in this diagram is the design decision that matters.
          Because generation is conditioned on an explicit binary mask, the
          diffusion model only ever edits the nose-and-mouth region — the
          rest of the portrait passes through untouched, which is what
          preserves identity. It also makes the system controllable at
          inference: hand it a different mask region and it will follow,
          which lets it generalise to off-distribution photos where an
          end-to-end image-to-image translator like CycleGAN degrades.
        </Remark>
      </Section>

      <Section title="Stage 1 · U-Net mask predictor">
        <p>
          The first stage learns to segment the facial region a mask should
          cover, from 2,000 training pairs of clean faces and binary mask
          annotations at 128×128 resolution (1,000 validation, 1,000 test).
          The U-Net is trained for 30 epochs with AdamW, mixed precision on
          a single T4 GPU, and a composite loss balancing binary
          cross-entropy with a soft-Dice term that fights the class
          imbalance (the mask occupies a small fraction of the pixels):
        </p>
        <Formula math="\mathcal{L}_{\text{mask}} = 0.5\,\mathcal{L}_{\text{BCE}} + 0.5\,\mathcal{L}_{\text{Dice}}" />
        <Figure
          src="/mask_generator/result_unet.png"
          alt="Six test faces of diverse ages and ethnicities on the top row, each with its predicted binary mask below: green mask-shaped regions covering nose, mouth and chin, with IoU scores between 0.92 and 0.95."
          width={665}
          height={258}
          caption="Predicted mask regions on test faces (green), with per-image IoU scores of 0.92–0.95."
        />
        <Figure
          src="/mask_generator/iou-dice.png"
          alt="Two histograms over the test set: IoU scores concentrated near 0.93 with mean 0.927 and median 0.942, and Dice scores concentrated near 0.96 with mean 0.962 and median 0.970."
          width={815}
          height={310}
          caption="Distribution of IoU (mean 0.927) and Dice (mean 0.962) over the 1,000-image test set."
        />
        <Remark>
          The predictor is reliable and consistent, not just good on
          average. The qualitative panel shows it locking onto the
          nose-to-chin region across ages, skin tones, glasses, and slight
          head turns. The histograms add the statistical version of that
          statement: both distributions are tight and left-skewed, with
          medians (0.942 IoU, 0.970 Dice) above the means — meaning most
          predictions are excellent and errors come from a thin tail of hard
          cases rather than broad mediocrity. That matters downstream:
          the diffusion stage edits exactly the region this network
          predicts, so localisation errors would become visible artifacts in
          the generated faces.
        </Remark>
      </Section>

      <Section title="Stage 2 · Two diffusion generators">
        <p>
          <span className="font-medium text-stone-900">
            DDPM from scratch.
          </span>{" "}
          A conditional diffusion model (U-Net backbone with sinusoidal time
          embeddings) is trained to reconstruct the masked face given the
          clean image with the mask region blanked out, plus the binary mask
          itself, concatenated as conditioning channels. It uses a cosine
          noise schedule over 250 timesteps and DDIM sampling with 100 steps
          at inference to cut runtime. Trained on the same 2,000 images as
          the mask predictor.
        </p>
        <p>
          <span className="font-medium text-stone-900">
            Stable Diffusion inpainting + LoRA.
          </span>{" "}
          The second branch adapts the pretrained{" "}
          <code>runwayml/stable-diffusion-inpainting</code> model. The
          tokenizer, CLIP text encoder, VAE, and original U-Net weights all
          stay frozen; adaptation happens through rank-16 LoRA modules
          inserted broadly into the U-Net (attention projections plus
          additional projection and convolution layers). Training ran 30
          epochs at 256×256 on aligned FFHQ–MaskedFace-Net pairs with the
          fixed prompt{" "}
          <em>
            &ldquo;a high quality portrait photo of a person wearing a
            protective face mask&rdquo;
          </em>
          ; inference uses 30 denoising steps with classifier-free guidance
          7.5.
        </p>
        <Figure
          src="/mask_generator/SD_diagram.png"
          alt="Diagram of the Stable Diffusion branch: a clean face and its mask region feed into the Stable Diffusion inpainting model; LoRA adapters, shown as a small side module, inject trainable low-rank updates into the frozen inpainting U-Net, which outputs the generated masked face."
          width={1200}
          height={1120}
          caption="The Stable Diffusion branch: the pretrained inpainting model stays frozen; only the small LoRA adapters (green) are trained."
        />
        <Remark>
          The visual proportions of this diagram are honest about where the
          knowledge lives: the big frozen inpainting stack carries the
          pretrained image prior, while the LoRA adapters — the small
          yellow module on the side — are the only part that learns the
          mask-generation task. That asymmetry is the whole economics of
          the approach: adapting a large model on a single GPU by training
          a tiny fraction of its parameters, while the mask region still
          tells the model exactly which pixels it is allowed to change.
        </Remark>
        <Figure
          src="/mask_generator/denoising_process.png"
          alt="Seven panels showing the denoising trajectory: the clean input face, then pure noise at step 1, gradually resolving through steps 5, 10, 15 and 19 into the final generated image of the same man wearing a blue surgical mask."
          width={1055}
          height={300}
          caption="The reverse diffusion trajectory of the Stable Diffusion branch over 20 steps: from noise to a masked portrait."
        />
        <Remark>
          Reading the strip left to right shows diffusion&apos;s
          coarse-to-fine character: at step 10 the global structure is
          already decided — head pose, skin tone, the blue mask&apos;s
          placement — while the last steps only sharpen texture like the
          mask&apos;s pleats. Notice also how strongly the final image
          resembles the input face in hair, ears, and background: the
          pretrained latent prior reconstructs the unedited regions almost
          exactly, which is precisely the identity-preservation behaviour
          the metrics later confirm (background MAE three times lower than
          mask-region MAE).
        </Remark>
      </Section>

      <Section title="Results">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-300 text-left">
                <th className="py-2 pr-4 font-medium">Method</th>
                <th className="py-2 pr-4 font-medium">Epochs</th>
                <th className="py-2 pr-4 font-medium">Train FID ↓</th>
                <th className="py-2 font-medium">Test FID ↓</th>
              </tr>
            </thead>
            <tbody>
              {fidTable.map((row) => (
                <tr key={row.method} className="border-b border-stone-100">
                  <td className="py-2 pr-4 text-stone-600">{row.method}</td>
                  <td className="py-2 pr-4 text-stone-600">{row.epochs}</td>
                  <td className="py-2 pr-4 font-mono text-[0.8rem]">
                    {row.train}
                  </td>
                  <td className="py-2 font-mono text-[0.8rem]">{row.test}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          The fine-tuned Stable Diffusion branch also scores well on the
          paired-image metrics against ground-truth masked faces:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {sdMetrics.map((row) => (
                <tr key={row.metric} className="border-b border-stone-100">
                  <td className="py-2 pr-4 text-stone-600">{row.metric}</td>
                  <td className="py-2 font-mono text-[0.8rem]">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Figure
          src="/mask_generator/method-comparison.png"
          alt="A grid comparing four test faces across three methods: CycleGAN masks look pasted-on and sometimes misaligned, DDPM masks are blurry and wash out surrounding detail, while the Stable Diffusion fine-tuning row shows sharp, naturally fitted masks with faces and backgrounds intact."
          width={1090}
          height={570}
          caption="The same four test faces masked by CycleGAN (top), DDPM (middle), and LoRA-fine-tuned Stable Diffusion (bottom)."
        />
        <Remark>
          The grid makes the numbers tangible. CycleGAN&apos;s masks sit on
          the face like stickers — plausible when the input resembles its
          training distribution, but the mask geometry drifts on the profile
          and sunglasses cases. The DDPM row shows what training a diffusion
          model from scratch on only 2,000 images buys: masks appear in the
          right place (the predictor works) but are blurry, and skin
          texture around them degrades — hence its FID of ~49. The Stable
          Diffusion row is the payoff of transfer learning: crisp pleats,
          correct wrapping around the chin, glasses and hair untouched.
          Interestingly, at the poster stage an 8-epoch LoRA run still
          trailed CycleGAN (FID ≈ 33 vs 28); the final 30-epoch run more
          than closed that gap — the ranking between methods was itself a
          function of training budget.
        </Remark>
      </Section>

      <Section title="Limitations & takeaways">
        <p>
          The headline result is that parameter-efficient adaptation beats
          both alternatives: with the backbone frozen and only rank-16 LoRA
          updates trained, the pretrained latent prior contributes realism
          that neither a from-scratch DDPM (too little data) nor a GAN
          (brittle off-distribution) could match. But the metrics don&apos;t
          tell the whole story: some generated faces remain visibly
          distorted even when FID, LPIPS, and PSNR look good — global
          statistics can miss local facial damage, and none of these
          metrics truly measures identity preservation. The conclusion we
          drew is to lean harder on the pipeline&apos;s own structure:
          constraining generation to the explicitly predicted mask region
          (as the DDPM branch does) is the safer path, and future work
          should combine that hard constraint with the pretrained prior of
          Stable Diffusion — plus evaluation protocols that measure
          identity directly.
        </p>
      </Section>
    </article>
  );
}
