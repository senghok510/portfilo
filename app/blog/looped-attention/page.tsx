import type { Metadata } from "next";
import Link from "next/link";
import { Formula } from "@/components/formula";
import { formatDate, posts } from "@/lib/posts";

const post = posts.find((p) => p.slug === "looped-attention")!;

export const metadata: Metadata = {
  title: post.title,
  description: post.summary,
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

function Remark({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border-l-4 border-accent bg-accent-soft px-4 py-3">
      <span className="font-medium text-stone-900">Remark.</span> {children}
    </p>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-stone-200 bg-stone-50 p-4 font-mono text-[13px] leading-relaxed text-stone-800">
      <code>{children}</code>
    </pre>
  );
}

function Ref({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline decoration-stone-300 underline-offset-4 hover:decoration-stone-500"
    >
      {children}
    </a>
  );
}

function ArchitectureFigure() {
  const box = "fill-stone-50 stroke-stone-300";
  const text = "fill-stone-700 text-[13px]";
  const blocks = ["θ₁", "θ₂", "θ₃", "θ₄"];
  return (
    <svg
      viewBox="0 0 680 262"
      role="img"
      aria-label="Two diagrams. Top: a stacked transformer passes the input x through four blocks with different weights theta 1 to theta 4, then outputs y. Bottom: a looped transformer embeds x, adds the embedding to the hidden state, passes it through one shared block theta, and feeds the result back T times before outputting y."
      className="h-auto w-full"
    >
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="fill-stone-500" />
        </marker>
        <marker id="arrow-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
        </marker>
      </defs>

      {/* Stacked */}
      <text x="0" y="18" className="fill-stone-400 text-[11px] font-semibold tracking-[0.12em]">STACKED · 4 BLOCKS, 4 WEIGHT SETS</text>
      <text x="14" y="69" className={text}>x</text>
      {blocks.map((b, i) => (
        <g key={b}>
          <line x1={i === 0 ? 30 : 90 + (i - 1) * 120 + 70} y1="64" x2={90 + i * 120 - 4} y2="64" className="stroke-stone-500" markerEnd="url(#arrow)" />
          <rect x={90 + i * 120} y="44" width="70" height="40" rx="6" className={box} />
          <text x={125 + i * 120} y="69" textAnchor="middle" className={text}>{b}</text>
        </g>
      ))}
      <line x1="520" y1="64" x2="586" y2="64" className="stroke-stone-500" markerEnd="url(#arrow)" />
      <text x="596" y="69" className={text}>y</text>

      {/* Looped */}
      <text x="0" y="128" className="fill-stone-400 text-[11px] font-semibold tracking-[0.12em]">LOOPED · 1 BLOCK, 1 WEIGHT SET, T LOOPS</text>
      <text x="14" y="219" className={text}>x</text>
      <line x1="30" y1="214" x2="86" y2="214" className="stroke-stone-500" markerEnd="url(#arrow)" />
      <rect x="90" y="194" width="70" height="40" rx="6" className={box} />
      <text x="125" y="219" textAnchor="middle" className={text}>e(x)</text>
      <line x1="160" y1="214" x2="226" y2="214" className="stroke-stone-500" markerEnd="url(#arrow)" />
      <circle cx="245" cy="214" r="16" className={box} />
      <text x="245" y="219" textAnchor="middle" className={text}>+</text>
      <line x1="261" y1="214" x2="326" y2="214" className="stroke-stone-500" markerEnd="url(#arrow)" />
      <rect x="330" y="194" width="110" height="40" rx="6" fill="var(--accent-soft)" stroke="var(--accent)" />
      <text x="385" y="219" textAnchor="middle" className="text-[13px] font-medium" fill="var(--accent)">shared block θ</text>
      <path d="M385,194 C385,150 245,150 245,196" fill="none" stroke="var(--accent)" strokeDasharray="4 3" markerEnd="url(#arrow-accent)" />
      <text x="315" y="152" textAnchor="middle" className="text-[12px]" fill="var(--accent)">h⁽ᵗ⁺¹⁾ · repeat T times</text>
      <text x="200" y="252" textAnchor="middle" className="fill-stone-500 text-[11px]">input injection: e(x) re-added every loop</text>
      <line x1="440" y1="214" x2="586" y2="214" className="stroke-stone-500" markerEnd="url(#arrow)" />
      <text x="513" y="206" textAnchor="middle" className="fill-stone-500 text-[11px]">after loop T</text>
      <text x="596" y="219" className={text}>y</text>
    </svg>
  );
}

const loopedCode = `import torch
import torch.nn as nn

class LoopedTransformer(nn.Module):
    def __init__(self, d_model=256, n_heads=4, n_layers=2):
        super().__init__()
        # The "block" can itself be a few layers; their weights are reused every loop.
        layer = nn.TransformerEncoderLayer(d_model, n_heads, 4 * d_model,
                                           batch_first=True, norm_first=True)
        self.block = nn.TransformerEncoder(layer, n_layers)

    def forward(self, e, n_loops=8):
        # e: embedded input, shape (batch, seq_len, d_model)
        h = torch.zeros_like(e)
        for _ in range(n_loops):
            h = self.block(h + e)      # input injection: re-add e at every loop
        return h

model = LoopedTransformer()
x = torch.randn(2, 32, 256)
easy = model(x, n_loops=4)       # same weights...
hard = model(x, n_loops=64)      # ...more thinking for a harder input`;

export default function LoopedAttentionPost() {
  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link
        href="/blog"
        className="text-sm text-stone-500 transition-colors hover:text-stone-900"
      >
        ← Blog
      </Link>

      <header className="mt-6">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          {post.title}
        </h1>
        <p className="mt-3 text-stone-500">
          {formatDate(post.date)} · {post.readingTime}
        </p>
      </header>

      <Section title="The idea in one sentence">
        <p>
          A standard transformer gets deeper by stacking more layers, each with
          its own weights. A <em>looped</em> transformer gets deeper by
          running the <em>same</em> block again and again, feeding its output
          back in as its next input. Depth stops being something you buy with
          parameters and becomes something you spend at inference time.
        </p>
        <p>
          That small change has big consequences. A looped model can use more
          loops on harder inputs, it can carry out step-by-step algorithms whose
          number of steps grows with the problem size, and it often
          generalises to inputs much larger than anything it saw in training.
          This post walks through how it works and why.
        </p>
      </Section>

      <Section title="1 · From stacked layers to a loop">
        <p>
          Write the hidden states of a sequence after layer <em>l</em> as{" "}
          <em>h</em>
          <sup>(l)</sup>. A normal transformer with <em>L</em> layers applies a
          different function at every step:
        </p>
        <Formula math={String.raw`h^{(l+1)} = f_{\theta_l}\big(h^{(l)}\big), \qquad l = 0, \dots, L-1`} />
        <p>
          Each <em>f</em> is the usual block: multi-head self-attention
          followed by an MLP, with residual connections and normalisation. A
          looped transformer ties all the weights together and lets the number
          of iterations <em>T</em> be chosen freely:
        </p>
        <Formula math={String.raw`h^{(t+1)} = f_{\theta}\big(h^{(t)} + e(x)\big), \qquad t = 0, \dots, T-1`} />
        <p>
          Two things changed. There is a single parameter set θ, and the
          embedded input <em>e</em>(<em>x</em>) is added back at every
          iteration. The second change, called <strong>input injection</strong>,
          turns out to matter a lot. I come back to it below.
        </p>
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white p-5">
          <ArchitectureFigure />
        </div>
        <p className="text-sm text-stone-500">
          Stacked depth (top) versus looped depth (bottom). The looped model
          has the parameter count of one block but the compute of T blocks.
        </p>
        <Remark>
          Weight sharing across depth is not new. The Universal Transformer
          (Dehghani et al., 2018) already applied one block recurrently, and
          ALBERT (Lan et al., 2019) shared weights across layers to shrink
          BERT. What is newer is the focus on <em>many</em> loops, and on
          choosing the number of loops at test time to solve harder problems.
        </Remark>
      </Section>

      <Section title="2 · Why attention is a natural fit for looping">
        <p>
          It helps to think of one loop as one step of an algorithm running in
          parallel over every token. Self-attention is the communication step:
          every position reads from the positions it attends to. The MLP is the
          local computation step: every position updates its own state from
          what it just read.
        </p>
        <p>
          Many classic algorithms have exactly that shape. In a breadth-first
          search on a grid, every cell looks at its neighbours and updates its
          distance. In graph algorithms, every node aggregates messages from
          its neighbours. In iterative solvers, every variable is refined from
          the others. One loop of a looped transformer can implement one round
          of such an algorithm. Running it <em>T</em> times runs <em>T</em>{" "}
          rounds, with no new weights.
        </p>
        <p>
          Giannou et al. (2023) pushed this view to its limit. They showed
          that a fixed, small transformer, placed in a loop, can be wired by
          hand to emulate a general-purpose computer, executing programs one
          instruction per loop. The weights are the CPU; the token sequence is
          the memory.
        </p>
      </Section>

      <Section title="3 · Making it train: input injection and loop counts">
        <p>
          Training a deep loop with gradient descent is harder than training a
          stack. A few tricks show up again and again.
        </p>
        <p>
          <strong>Input injection.</strong> Without it, the only route from the
          input to the output is through the hidden state, so after many loops
          the model can &ldquo;forget&rdquo; the question it was asked. Adding{" "}
          <em>e</em>(<em>x</em>) at every loop keeps the problem permanently
          in view. Yang et al. (2023) found it was important for looped
          transformers to learn algorithms in-context and to stay stable when
          run for more loops than in training.
        </p>
        <p>
          <strong>Deciding how many loops.</strong> There are three common
          options. The simplest is a fixed <em>T</em>. The Universal
          Transformer instead learned to stop, using Adaptive Computation Time,
          so that each token gets its own halting point. A third option is to
          sample <em>T</em> at random during training, so the model learns a
          state that keeps improving, or at least stays stable, as the loop
          runs longer. Geiping et al. (2025) train a 3.5B-parameter
          recurrent-depth language model this way, and at test time simply
          run more loops on harder questions.
        </p>
        <p>
          <strong>Cheaper gradients.</strong> Backpropagating through hundreds
          of loops is expensive in memory and prone to exploding or vanishing
          gradients. A common fix is truncated backpropagation: run many loops
          without gradients, then backpropagate only through the last few.
          The Hierarchical Reasoning Model (Wang et al., 2025) and the Tiny
          Recursive Model (Jolicoeur-Martineau, 2025) both rely on variants of
          this idea.
        </p>
        <p>Here is the whole idea in a few lines of PyTorch:</p>
        <Code>{loopedCode}</Code>
      </Section>

      <Section title="4 · What loops buy you">
        <p>
          <strong>Reasoning per parameter.</strong> Saunshi et al. (2025)
          found that a <em>k</em>-layer transformer looped <em>L</em> times
          nearly matches a <em>kL</em>-layer non-looped transformer on
          reasoning tasks, with <em>L</em> times fewer parameters. Their
          explanation: reasoning needs depth more than it needs parameters,
          while memorising facts needs parameters. So looped models shine on
          the former and lag on the latter.
        </p>
        <p>
          <strong>Length generalisation.</strong> A stack of <em>L</em> layers
          has a hard limit: it can only perform about <em>L</em> sequential
          steps. If a test problem needs more steps than any training problem,
          the model has no room to do them. A loop has no such ceiling. If
          each loop implements one step of the right algorithm, a bigger
          problem just needs more loops.
        </p>
        <p>
          <strong>Hard puzzles with tiny models.</strong> Small recurrent
          models such as HRM and TRM, with a few million parameters, reach
          strong scores on Sudoku-Extreme, 30×30 Maze-Hard and ARC-AGI,
          puzzles where large language models answering directly struggle.
        </p>
        <p>
          A striking recent example is{" "}
          <Ref href="https://mbzuai-oryx.github.io/LoopedWSP/">
            Looped Weight-Space Programming
          </Ref>{" "}
          (MBZUAI, 2026). Asked to solve hard 30×30 mazes directly, Claude
          Opus 5.5 got 26% right. Asked instead to write the weights of a
          small looped transformer by hand, it produced one with 19,936
          weights that solves 100% of the test mazes. Each loop pushes a
          breadth-first search one cell further. Because of that, the same
          weights also solve 60×60 and 100×100 mazes: they just loop longer.
          Tellingly, when the authors reset that architecture to random
          weights and trained it with gradient descent, it solved 0%. The
          loop gives the model the <em>capacity</em> to run the algorithm;
          finding the weights that do it is a separate, hard problem.
        </p>
      </Section>

      <Section title="5 · The costs">
        <p>
          Looping is not free lunch. Sharing weights saves memory, not compute:
          a block looped 32 times costs the same FLOPs as a 32-layer stack, and
          because the loops are sequential, latency grows with <em>T</em>. With
          an adaptive number of loops, it also becomes harder to batch inputs
          that want different depths, and to reuse the key–value cache cleanly
          in autoregressive generation.
        </p>
        <p>
          Training is also more delicate. The model has to learn a state
          update that stays stable over many more iterations than a normal
          network has layers, and the training tricks above (input injection,
          random loop counts, truncated gradients) exist precisely because a
          naive loop tends to diverge or collapse. Finally, as Saunshi et
          al. note, a looped model with few parameters has less room to store
          knowledge, so it is not a drop-in replacement for a large language
          model.
        </p>
      </Section>

      <Section title="Takeaways">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            A looped transformer reuses one block for many iterations, so
            depth becomes a test-time choice rather than a fixed architectural
            one.
          </li>
          <li>
            One loop maps naturally onto one round of a parallel algorithm:
            attention communicates, the MLP computes.
          </li>
          <li>
            Input injection, random loop counts and truncated backpropagation
            are the main ingredients that make loops trainable.
          </li>
          <li>
            Loops are excellent for reasoning and length generalisation per
            parameter, but they cost sequential compute and are weaker at
            memorising knowledge.
          </li>
        </ul>
      </Section>

      <Section title="References">
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          <li>
            Dehghani et al.,{" "}
            <Ref href="https://arxiv.org/abs/1807.03819">Universal Transformers</Ref>
            , 2018.
          </li>
          <li>
            Lan et al.,{" "}
            <Ref href="https://arxiv.org/abs/1909.11942">
              ALBERT: A Lite BERT for Self-supervised Learning of Language
              Representations
            </Ref>
            , 2019.
          </li>
          <li>
            Giannou et al.,{" "}
            <Ref href="https://arxiv.org/abs/2301.13196">
              Looped Transformers as Programmable Computers
            </Ref>
            , 2023.
          </li>
          <li>
            Yang et al.,{" "}
            <Ref href="https://arxiv.org/abs/2311.12424">
              Looped Transformers are Better at Learning Learning Algorithms
            </Ref>
            , 2023.
          </li>
          <li>
            Saunshi et al.,{" "}
            <Ref href="https://arxiv.org/abs/2502.17416">
              Reasoning with Latent Thoughts: On the Power of Looped
              Transformers
            </Ref>
            , 2025.
          </li>
          <li>
            Geiping et al.,{" "}
            <Ref href="https://arxiv.org/abs/2502.05171">
              Scaling up Test-Time Compute with Latent Reasoning: A Recurrent
              Depth Approach
            </Ref>
            , 2025.
          </li>
          <li>
            Wang et al.,{" "}
            <Ref href="https://arxiv.org/abs/2506.21734">
              Hierarchical Reasoning Model
            </Ref>
            , 2025.
          </li>
          <li>
            Jolicoeur-Martineau,{" "}
            <Ref href="https://arxiv.org/abs/2510.04871">
              Less is More: Recursive Reasoning with Tiny Networks
            </Ref>
            , 2025.
          </li>
          <li>
            Elsayed, Heakl et al.,{" "}
            <Ref href="https://mbzuai-oryx.github.io/LoopedWSP/">
              Looped Weight-Space Programming: LLM-Written Transformers for
              Long Algorithmic Reasoning
            </Ref>
            , 2026.
          </li>
        </ol>
      </Section>
    </article>
  );
}
