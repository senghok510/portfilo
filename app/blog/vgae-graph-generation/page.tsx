import type { Metadata } from "next";
import Link from "next/link";
import { Formula } from "@/components/formula";
import { FamiliesFigure } from "@/components/vgae/families-figure";
import { OrderingFigure } from "@/components/vgae/ordering-figure";
import { RequestFigure } from "@/components/vgae/request-figure";
import { ResultsFigure } from "@/components/vgae/results-figure";
import { SamplingFigure } from "@/components/vgae/sampling-figure";
import { datasetStats, results } from "@/lib/vgae-lab/data";
import { formatDate, posts } from "@/lib/posts";

const post = posts.find((p) => p.slug === "vgae-graph-generation")!;
const { config, configs, baseline, invariance } = results;
const handout = configs[0];
const handoutProp = configs[1];
const fixed = configs.find((c) => c.id === config.headline)!;

export const metadata: Metadata = {
  title: post.title,
  description: post.summary,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-xs font-semibold tracking-[0.15em] text-stone-400 uppercase">
        {title}
      </h2>
      <div className="mt-4 space-y-4 leading-relaxed text-stone-700">{children}</div>
    </section>
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
    <a href={href} target="_blank" rel="noopener noreferrer"
       className="underline decoration-stone-300 underline-offset-4 hover:decoration-stone-500">
      {children}
    </a>
  );
}

function Note({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-relaxed text-stone-600">
      <span className="font-medium text-stone-900">{title}</span> {children}
    </div>
  );
}

/** An exercise from the handout: try it first, then open the solution. */
function Task({
  n, title, children, solution,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
  solution: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-accent/30 bg-accent-soft/50 p-4">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="rounded border border-accent/40 bg-white px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.1em] text-accent uppercase">
          Task {n}
        </span>
        <span className="text-sm font-medium text-stone-900">{title}</span>
      </div>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-stone-700">
        {children}
      </div>
      <details className="group mt-3">
        <summary className="cursor-pointer list-none text-sm font-medium text-accent marker:hidden [&::-webkit-details-marker]:hidden">
          <span className="underline decoration-accent/40 underline-offset-4 group-open:hidden">
            Show how I did it ↓
          </span>
          <span className="hidden underline decoration-accent/40 underline-offset-4 group-open:inline">
            Hide it again ↑
          </span>
        </summary>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-stone-700">
          {solution}
        </div>
      </details>
    </div>
  );
}

/** A question from the handout, with the answer I settled on. */
function Question({
  n, children, answer,
}: {
  n: string;
  children: React.ReactNode;
  answer: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border-l-4 border-stone-300 bg-stone-50 px-4 py-3">
      <div className="text-[10px] font-semibold tracking-[0.1em] text-stone-500 uppercase">
        Question {n}
      </div>
      <p className="mt-1 text-sm leading-relaxed font-medium text-stone-900">
        {children}
      </p>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-stone-700">
        {answer}
      </div>
    </div>
  );
}

const propsCode = `def graph_properties(G):
    """Edge density and number of triangles per node."""
    n = G.number_of_nodes()
    m = G.number_of_edges()
    density = 2.0 * m / (n * (n - 1)) if n > 1 else 0.0
    # nx.triangles counts, for each node, the triangles through it; every
    # triangle is therefore counted three times.
    triangles = sum(nx.triangles(G).values()) / 3.0
    return density, triangles / n`;

const bfsCode = `def degree_guided_bfs_order(G):
    deg = dict(G.degree())
    # Ties are broken by node id, which makes this deterministic for a
    # *given* labelling — but not invariant to relabelling.
    remaining = sorted(G.nodes(), key=lambda v: (-deg[v], v))
    seen, order = set(), []
    for root in remaining:
        if root in seen:
            continue
        seen.add(root)
        queue = [root]
        while queue:
            v = queue.pop(0)
            order.append(v)
            for u in sorted((u for u in G.neighbors(v) if u not in seen),
                            key=lambda u: (-deg[u], u)):
                seen.add(u)
                queue.append(u)
    return order`;

const encoderCode = `def encode(self, A, X, c_std):
    A_hat = normalize_adj(A)              # D^-1/2 (A + I) D^-1/2
    H1 = self.mlp1(A_hat @ X)
    H2 = self.mlp2(A_hat @ H1)
    h_G = H2.mean(dim=1)                  # mean readout over the 24 nodes
    h = torch.cat([h_G, c_std], dim=-1)   # graph summary ‖ requested properties
    return self.fc_mu(h), self.fc_logvar(h)

@staticmethod
def reparameterize(mu, logvar):
    std = torch.exp(0.5 * logvar)
    return mu + std * torch.randn_like(std)   # gradients flow through mu, std`;

const decoderCode = `def decode(self, z, c_std):
    # one logit per unordered pair i < j: 24 * 23 / 2 = 276 of them
    return self.decoder(torch.cat([z, c_std], dim=-1))

def logits_to_prob_matrix(logits):
    P = torch.zeros(logits.shape[0], N_NODES, N_NODES)
    P[:, TRIU[0], TRIU[1]] = torch.sigmoid(logits)
    return P + P.transpose(1, 2)   # symmetric, and the diagonal stays 0`;

const lossCode = `def loss_function(logits, A_target, mu, logvar, c_true, prop_std, beta, lam):
    # 1. reconstruction, over the upper triangle only
    target = upper_triangle(A_target)
    bce = F.binary_cross_entropy_with_logits(
        logits, target, reduction="none").sum(-1).mean()

    # 2. pull the posterior towards N(0, I)
    kl = -0.5 * torch.sum(1 + logvar - mu.pow(2) - logvar.exp(), dim=-1).mean()

    # 3. optional: make the EXPECTED properties of P match the request
    if lam > 0:
        P = logits_to_prob_matrix(logits)
        rho_hat = upper_triangle(P).sum(-1) * 2 / (N_NODES * (N_NODES - 1))
        t_hat = (P @ P @ P).diagonal(dim1=-2, dim2=-1).sum(-1) / (6 * N_NODES)
        prop = 0.5 * (((rho_hat - c_true[:, 0]) / prop_std[0]).pow(2)
                      + ((t_hat - c_true[:, 1]) / prop_std[1]).pow(2)).mean()
    else:
        prop = torch.zeros(())

    return bce + beta * kl + lam * prop`;

const genCode = `z = torch.randn(1, model.latent)              # from the PRIOR, not the encoder
c_in = (torch.tensor([[rho, t]]) - c_mean) / c_std
P = logits_to_prob_matrix(model.decode(z, c_in))

U = torch.rand(P.shape)
A = (U < P).float()                           # one Bernoulli draw per pair
A = torch.triu(A, diagonal=1)
A = A + A.transpose(1, 2)                     # reflect across the diagonal`;

export default function VgaePost() {
  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link href="/blog" className="text-sm text-stone-500 transition-colors hover:text-stone-900">
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
          An autoencoder squeezes an object into a vector and puts it back
          together. A <em>variational</em> autoencoder squeezes it into a{" "}
          <em>distribution</em> instead, so that afterwards you can draw a fresh
          vector out of thin air and decode it into something new. Do that to
          graphs, hand the decoder a short list of the properties you want, and
          you get a model you can ask for a graph: two numbers in, a graph out.
        </p>
        <p>
          This post is me working through the second half of{" "}
          <em>Advanced Learning for Text and Graph Data</em> lab 6 — a
          conditional variational graph autoencoder over small random graphs —
          and writing down what I learned by actually running it. The tasks and
          questions below are the handout&rsquo;s. Every figure runs on the model
          I trained for it, and every number comes from that run rather than
          from the handout.
        </p>
        <p>
          The short version of what I found: the architecture is the easy part.
          Built exactly as prescribed, the generator{" "}
          <strong>loses to a coin flip</strong> — an Erdős–Rényi graph drawn at
          the requested density beats it on both properties. One hyperparameter
          is responsible, and it is not the one the handout asks you to compare.
        </p>
      </Section>

      <Section title="1 · The dataset: three recipes, one condition vector">
        <p>
          The dataset is {config.nGraphs} undirected graphs with {config.nNodes}{" "}
          nodes each, {config.nGraphs / 3} from each of three classic random
          graph models: Erdős–Rényi, Watts–Strogatz and a two-block stochastic
          block model. They are built with{" "}
          <Ref href="https://networkx.org/">NetworkX</Ref>, which also produces
          every layout you see below.
        </p>
        <p>
          The generator is conditioned on two numbers, and the family label is
          deliberately <em>not</em> one of them — it is used only to keep the
          train, validation and test splits balanced. What the model gets is
        </p>
        <Formula math={String.raw`c(G) = \big[\rho(G),\, t(G)\big], \qquad \rho(G) = \frac{2|E|}{n(n-1)}, \qquad t(G) = \frac{T(G)}{n}`} />
        <p>
          edge density and triangles per node. Every graph has the same number
          of nodes, so density and edge count say the same thing; the triangle
          count is what carries any information about local structure.
        </p>

        <Task
          n="8"
          title="Compute the properties, build the families, split the data"
          solution={
            <>
              <p>
                The one trap is the factor of three. <code>nx.triangles</code>{" "}
                returns, for each node, the number of triangles{" "}
                <em>through that node</em>, so every triangle is counted once
                per corner:
              </p>
              <Code>{propsCode}</Code>
              <p>
                For the split, I sampled each family separately and took 70 / 15
                / 15 within each, which keeps the three families balanced in all
                three sets. The standardisation of <em>c</em> uses the training
                mean and standard deviation only — here{" "}
                <span className="font-mono">
                  μ = [{config.condMean.map((v) => v.toFixed(3)).join(", ")}]
                </span>
                ,{" "}
                <span className="font-mono">
                  σ = [{config.condStd.map((v) => v.toFixed(3)).join(", ")}]
                </span>{" "}
                — because using the whole dataset would leak test statistics
                into training.
              </p>
            </>
          }
        >
          <p>
            Fill in <code>graph_properties()</code>, generate the three
            families, and split the data 70 / 15 / 15, stratified by family.
          </p>
        </Task>

        <FamiliesFigure />

        <p>
          That scatter is worth sitting with, because it sets the difficulty of
          everything that follows. The two conditions are not independent: more
          edges means more triangles, and across the whole dataset they
          correlate at r = {datasetStats.corr.toFixed(3)}. So a request is
          mostly a request for a density, with a smaller, second-order ask about
          how those edges are arranged. The families separate only once density
          is held fixed — between ρ {datasetStats.band[0]} and{" "}
          {datasetStats.band[1]} the block model averages{" "}
          {datasetStats.meanTBlock.toFixed(2)} triangles per node against
          Erdős–Rényi&rsquo;s {datasetStats.meanTErdos.toFixed(2)}, because
          putting edges inside two blocks closes more triangles than scattering
          them.
        </p>
        <p>
          This is also, quietly, why the baseline in section 7 is so hard to
          beat. If triangles follow density that closely, then simply getting
          the density right gets you most of the triangle count for free, and a
          model only earns its place by capturing the part that is left over.
        </p>
      </Section>

      <Section title="2 · The one place permutation invariance breaks">
        <p>
          A graph does not come with an order on its nodes. Any model that reads
          a graph should give the same answer however the nodes are numbered,
          and the encoder here does: it ends in a mean over node
          representations, and a mean cannot tell what order it was handed.
        </p>
        <p>
          The decoder is a different story. It emits one number per node pair{" "}
          <em>(i, j)</em>, and the loss compares that number to the entry at{" "}
          <em>(i, j)</em> of an adjacency matrix. The matrix only exists once you
          have chosen an order. So the target depends on a choice the graph
          itself does not make, and the handout&rsquo;s remedy is to make that
          choice deterministically: a breadth-first search that visits
          high-degree nodes first.
        </p>

        <p>
          The ordering itself is a plain BFS with the queue seeded, and every
          neighbour list sorted, by descending degree:
        </p>
        <Code>{bfsCode}</Code>

        <OrderingFigure />

        <Question
          n="4"
          answer={
            <>
              <p>
                <strong>Why the encoder is invariant.</strong> Relabelling the
                nodes permutes the rows of <strong>X</strong> and both the rows
                and columns of <strong>A</strong>. Every step of the encoder
                commutes with that permutation — the normalised adjacency is
                permuted the same way, the MLPs act on each row independently —
                so <strong>H</strong><sup>(2)</sup> comes out permuted too. The
                mean readout then sums over exactly the same set of rows in a
                different order, and addition does not care. Measured on the
                trained model, two orderings of one graph give readouts that
                differ by{" "}
                <span className="font-mono">
                  {invariance.readoutMaxDiff.toExponential(0)}
                </span>
                , which is float32 rounding, not a real difference.
              </p>
              <p>
                <strong>Why the loss is not.</strong> The reconstruction term is
                a sum over cells of a matrix, and reordering moves edges between
                cells: in the figure above,{" "}
                <span className="font-mono">{invariance.entriesDiffer}</span>{" "}
                node pairs land somewhere else. Two orderings of the same graph
                therefore give two different targets and two different losses.
                The model is being asked to reproduce not just a graph but a
                particular drawing of its adjacency matrix.
              </p>
              <p>
                <strong>Is degree-guided BFS canonical? No.</strong> A canonical
                ordering would depend only on the graph, not on the labels it
                arrived with. This one breaks ties by node id, so it depends on
                the labels whenever two nodes have the same degree — which, in a
                24-node graph with degrees in the single digits, is constantly. I
                relabelled one graph {invariance.relabelTrials} times at random
                and re-ran the ordering:{" "}
                <strong>
                  {invariance.relabelDifferent} of {invariance.relabelTrials}
                </strong>{" "}
                produced a different adjacency matrix. It is a useful heuristic —
                it concentrates the edges near the diagonal and makes the targets
                more consistent than random order would — but it does not remove
                the problem, it reduces it. A genuine canonical form means graph
                isomorphism, which is exactly the thing nobody wants to put
                inside a training loop.
              </p>
            </>
          }
        >
          Why is the encoder&rsquo;s graph-level output invariant to permutations
          of the input nodes, while the adjacency reconstruction loss is not?
          Does degree-guided BFS define a true canonical node ordering?
        </Question>
      </Section>

      <Section title="3 · The model">
        <p>
          The encoder is a two-layer message-passing network. Self-loops are
          added so a node keeps its own features, and the adjacency is normalised
          symmetrically so that high-degree nodes do not dominate the sums:
        </p>
        <Formula math={String.raw`\tilde{A} = A + I, \qquad \hat{A} = \tilde{D}^{-1/2}\tilde{A}\tilde{D}^{-1/2}, \qquad H^{(1)} = \mathrm{MLP}_1(\hat{A}X), \quad H^{(2)} = \mathrm{MLP}_2(\hat{A}H^{(1)})`} />
        <p>
          The two node features are the normalised degree and the normalised mean
          degree of a node&rsquo;s neighbours — both computable from the graph
          alone, since these graphs carry no attributes. A mean readout turns the
          node representations into one vector for the whole graph, which is
          concatenated with the standardised request and mapped to the parameters
          of a Gaussian:
        </p>
        <Formula math={String.raw`h_G = \frac{1}{n}\sum_{i=1}^{n} H^{(2)}_{i,:}, \qquad \mu = W_\mu[h_G \,\|\, c_{\mathrm{std}}] + b_\mu, \qquad \log\sigma^2 = W_\sigma[h_G \,\|\, c_{\mathrm{std}}] + b_\sigma`} />

        <Task
          n="9"
          title="The conditional encoder"
          solution={<Code>{encoderCode}</Code>}
        >
          <p>
            Normalise the adjacency, run two message-passing layers, pool with a
            mean readout, concatenate the condition vector, predict μ and log σ²,
            and sample with the reparameterisation trick.
          </p>
        </Task>

        <p>
          Sampling <em>z</em> directly would block gradients, so the
          reparameterisation trick moves the randomness out of the way:{" "}
          <em>z</em> = μ + σ ⊙ ε with ε ~ N(0, I). The noise is now an input, not
          an operation, and gradients reach μ and σ as usual.
        </p>
        <p>
          The decoder is one shot: no sequence of steps, just a multi-layer
          perceptron that emits every edge at once. For {config.nNodes} nodes
          there are {config.nPairs} unordered pairs, so it outputs{" "}
          {config.nPairs} logits — one per pair with <em>i</em> &lt; <em>j</em>.
        </p>
        <Formula math={String.raw`\ell = \mathrm{MLP}([z \,\|\, c_{\mathrm{std}}]) \in \mathbb{R}^{n(n-1)/2}, \qquad P_{ij} = \sigma(\ell_{ij}) \;\; (i<j), \qquad P_{ji} = P_{ij}, \quad P_{ii} = 0`} />

        <Task
          n="10"
          title="The conditional decoder"
          solution={
            <>
              <Code>{decoderCode}</Code>
              <p>
                Predicting only the {config.nPairs} pairs with <em>i</em> &lt;{" "}
                <em>j</em>, rather than all {config.nNodes}
                <sup>2</sup> = {config.nNodes * config.nNodes} entries, is what
                makes self-loops and contradictions impossible rather than merely
                unlikely. The diagonal is never predicted, so it cannot be
                non-zero; each undirected edge has exactly one parameter, so the
                model cannot output <em>P</em><sub>ij</sub> = 0.9 and{" "}
                <em>P</em><sub>ji</sub> = 0.1 and have to be reconciled. The
                symmetry is a property of the construction, not something the
                model has to learn.
              </p>
            </>
          }
        >
          <p>
            Concatenate <em>z</em> with the condition vector, push it through an
            MLP, predict only the {config.nPairs} logits for pairs{" "}
            <em>i</em> &lt; <em>j</em>, and build the symmetric probability
            matrix. Explain why this avoids self-loops and duplicate predictions.
          </p>
        </Task>
      </Section>

      <Section title="4 · The loss">
        <p>Three terms:</p>
        <Formula math={String.raw`\mathcal{L} = \mathcal{L}_{\mathrm{BCE}} + \beta\, D_{\mathrm{KL}}\!\left(q_\phi(z \mid G, c)\,\|\,\mathcal{N}(0, I)\right) + \lambda\, \mathcal{L}_{\mathrm{prop}}`} />
        <p>
          The first reconstructs the adjacency matrix. The second pulls the
          encoder&rsquo;s distribution towards the standard normal we will sample
          from later — remember that, it turns out to be the whole story. The
          third is optional and is the interesting one: it asks the{" "}
          <em>expected</em> properties of the probability matrix to match the
          request, without ever sampling a graph.
        </p>
        <Formula math={String.raw`\widehat{\rho}(P) = \frac{2}{n(n-1)}\sum_{i<j} P_{ij}, \qquad \widehat{t}(P) = \frac{\mathrm{tr}(P^3)}{6n}`} />
        <p>
          Both are differentiable in <em>P</em>. The second is the neat one: if
          every edge is an independent coin flip with probability{" "}
          <em>P</em><sub>ij</sub>, the expected number of triangles is the sum
          over triples of <em>P</em><sub>ij</sub><em>P</em><sub>jk</sub>
          <em>P</em><sub>ki</sub>, and that sum is exactly tr(<em>P</em>³) up to
          the factor of six that counts each triangle once per ordering of its
          corners.
        </p>

        <Task
          n="11"
          title="The three-term loss"
          solution={
            <>
              <Code>{lossCode}</Code>
              <p>
                Two details matter. The BCE is <em>summed</em> over the{" "}
                {config.nPairs} pairs and then averaged over the batch, so it
                arrives at a scale of roughly 110 — which is why β and λ have to
                be read relative to that number, not to 1. And the property loss
                is computed on <em>P</em>, the probability matrix, not on a
                sampled graph: it constrains what the model expects to produce,
                not what it actually produced.
              </p>
            </>
          }
        >
          <p>
            Implement the upper-triangle reconstruction loss, the KL term and the
            optional property loss. Use β = 0.005 and compare λ = 0 against
            λ = 0.02.
          </p>
        </Task>
      </Section>

      <Section title="5 · From probabilities to a graph">
        <p>
          The decoder never produces a graph. It produces {config.nPairs}{" "}
          probabilities, and turning those into edges is a separate decision —
          one with more consequences than it looks.
        </p>

        <SamplingFigure />

        <Question
          n="5"
          answer={
            <>
              <p>
                <strong>Density.</strong> Sampling is unbiased: the expected
                number of edges under Bernoulli draws is exactly Σ{" "}
                <em>P</em><sub>ij</sub>, which is the density the model intended.
                Thresholding keeps a pair only when <em>P</em><sub>ij</sub> &gt;
                0.5, so the resulting density is the <em>fraction of pairs the
                model is individually confident about</em>, which is a completely
                different quantity. When the target density is around 0.22, a
                well-calibrated model should put most probabilities near 0.22 —
                and then thresholding at 0.5 deletes nearly every edge. That is
                what happens in the figure above.
              </p>
              <p>
                <strong>Diversity.</strong> Thresholding is deterministic. Given{" "}
                <em>z</em> and <em>c</em> it returns one graph, always, so all the
                variety has to come from <em>z</em>. Sampling adds a second,
                much larger source of variety: {config.nPairs} independent coin
                flips. In this model that matters more than it should, because —
                as the next section shows — the latent ends up carrying almost
                nothing, and the Bernoulli draw is doing nearly all the work of
                making two generated graphs different.
              </p>
              <p>
                <strong>The trade.</strong> Thresholding gives you the
                model&rsquo;s single most probable guess for each edge, which is
                the right thing if you want its best reconstruction of one known
                graph. Sampling gives you a draw from the distribution it
                actually represents, which is the right thing if you want a
                generator. They answer different questions, and only the second
                is generation.
              </p>
            </>
          }
        >
          What is the difference between thresholding an edge probability matrix
          at 0.5 and sampling its entries from Bernoulli distributions? Discuss
          the effects on graph diversity and density.
        </Question>
      </Section>

      <Section title="6 · Asking for a graph">
        <p>
          Generation drops the encoder entirely. Draw <em>z</em> from the prior,
          standardise the properties you want, concatenate, decode, sample:
        </p>
        <Code>{genCode}</Code>

        <RequestFigure />
      </Section>

      <Section title="7 · Does it actually work?">
        <p>
          Task 12 asks for 100 held-out requests, the mean absolute error between
          what was asked and what came out, and a comparison against an
          Erdős–Rényi graph generated at the requested density. That baseline is
          a low bar in one sense — it has no way to control triangles at all —
          and a surprisingly high one in another, because for these graphs,
          getting the density right gets you most of the way to the right
          triangle count for free.
        </p>

        <Task
          n="12"
          title="Generate, measure, and compare against the baseline"
          solution={
            <>
              <p>
                For each held-out condition I draw a latent vector from the
                prior, decode, sample the upper triangle, reflect it, and
                measure the graph that comes out with the same{" "}
                <code>graph_properties()</code> used to build the dataset. The
                baseline is <code>nx.erdos_renyi_graph(24, rho)</code> at the
                requested density — it matches density by construction and has
                no mechanism at all for triangles.
              </p>
              <p>
                Reporting the mean absolute error separately per property
                matters: a single combined number would have hidden the fact
                that the prescribed model loses on density and triangles for two
                different reasons.
              </p>
            </>
          }
        >
          <p>
            Train the model, generate graphs for 100 held-out requests, compute
            the MAE for density and triangles per node, and compare against the
            density-matched Erdős–Rényi baseline. Show at least five pairs of
            requested and achieved properties.
          </p>
        </Task>

        <ResultsFigure />

        <p>
          Built as prescribed, the model loses. With β = 0.005 and λ = 0 it is
          off by {handout.maeDensity.toFixed(4)} on density and{" "}
          {handout.maeTriangles.toFixed(3)} on triangles, against{" "}
          {baseline.maeDensity.toFixed(4)} and{" "}
          {baseline.maeTriangles.toFixed(3)} for a graph generated by flipping
          coins. Turning the property loss on makes it slightly worse
          ({handoutProp.maeTriangles.toFixed(3)}), which is not what you would
          expect from a term whose entire job is to make the properties match.
        </p>
        <p>
          The diagnosis is in the KL column. At β = 0.005 the posterior sits{" "}
          {handout.kl.toFixed(0)} nats away from N(0, I). The decoder is trained
          on latent vectors drawn from that posterior, and then at generation
          time we hand it vectors drawn from N(0, I) instead — a region it has
          effectively never seen. It is not that the model failed to learn the
          conditioning; it is that we evaluate it off the end of its own training
          distribution. The property loss cannot help, because it is also
          computed on posterior samples during training.
        </p>
        <p>
          Raising β to 0.1 closes the gap: the KL falls to{" "}
          {fixed.kl.toFixed(2)}, prior samples become samples the decoder
          recognises, and the same architecture now beats the baseline on both
          properties — {fixed.maeDensity.toFixed(4)} and{" "}
          {fixed.maeTriangles.toFixed(3)}. Nothing else changed.
        </p>

        <Note title="The honest caveat.">
          Push β further and the KL goes to zero, which means the latent has
          collapsed completely: <em>z</em> carries no information and the decoder
          is a function of the requested properties alone. The property errors
          keep improving slightly as that happens. So on this task the
          &ldquo;variational&rdquo; part is not earning its keep — the conditions
          plus {config.nPairs} Bernoulli draws supply all the structure and all
          the diversity. With 24-node graphs and a two-number condition there is
          very little left for a latent to encode. I would expect that to change
          with larger graphs, richer conditions, or a reconstruction target that
          is not hostage to node ordering.
        </Note>
      </Section>

      <Section title="What I took away">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            A conditional graph VAE is three ideas stacked: pool a graph into one
            permutation-invariant vector, make that vector a distribution, and
            give the decoder the properties you want alongside it.
          </li>
          <li>
            Permutation invariance holds right up until the loss. The decoder is
            scored against an <em>ordered</em> adjacency matrix, and no ordering
            heuristic fixes that — degree-guided BFS gave a different matrix on{" "}
            {invariance.relabelDifferent} of {invariance.relabelTrials}{" "}
            relabellings of one graph.
          </li>
          <li>
            Thresholding a probability matrix is not generation. It throws away
            both the intended density and all the diversity.
          </li>
          <li>
            In a VAE you train the decoder on the posterior and sample it from
            the prior. If the KL term is too weak to bring those together, the
            model can reconstruct well and still generate badly — which is
            exactly what the prescribed β does here.
          </li>
          <li>
            Always build the dumb baseline. Without the Erdős–Rényi comparison
            this model&rsquo;s errors look perfectly respectable.
          </li>
        </ul>
      </Section>

      <Section title="Running it yourself">
        <p>
          The code is in{" "}
          <Ref href="https://github.com/senghok510/portfilo/tree/main/scripts/vgae-lab">
            scripts/vgae-lab
          </Ref>
          : <code>dataset.py</code> (Task 8), <code>model.py</code> (Tasks 9–11)
          and <code>run.py</code>, which trains all three configurations,
          evaluates them and writes the file every figure on this page reads.
          It needs PyTorch and NetworkX and takes a few minutes on a laptop CPU:
        </p>
        <Code>{`python3 scripts/vgae-lab/run.py`}</Code>
        <p>
          Everything is seeded, so it reproduces the numbers quoted above:{" "}
          {config.nGraphs} graphs, a {config.split.join(" / ")} split,{" "}
          {config.epochs} epochs, {config.params.toLocaleString("en-GB")}{" "}
          parameters, latent dimension {config.latent}.
        </p>
      </Section>

      <Section title="References">
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          <li>
            Kipf and Welling,{" "}
            <Ref href="https://arxiv.org/abs/1611.07308">
              Variational Graph Auto-Encoders
            </Ref>
            , 2016.
          </li>
          <li>
            Kingma and Welling,{" "}
            <Ref href="https://arxiv.org/abs/1312.6114">
              Auto-Encoding Variational Bayes
            </Ref>
            , 2013. The reparameterisation trick.
          </li>
          <li>
            Simonovsky and Komodakis,{" "}
            <Ref href="https://arxiv.org/abs/1802.03480">
              GraphVAE: Towards Generation of Small Graphs Using Variational
              Autoencoders
            </Ref>
            , 2018. The one-shot decoder this lab follows.
          </li>
          <li>
            You et al.,{" "}
            <Ref href="https://arxiv.org/abs/1802.08773">
              GraphRNN: Generating Realistic Graphs with Deep Auto-regressive
              Models
            </Ref>
            , 2018. The sequential alternative, and where BFS orderings come
            from.
          </li>
          <li>
            Higgins et al.,{" "}
            <Ref href="https://openreview.net/forum?id=Sy2fzU9gl">
              β-VAE: Learning Basic Visual Concepts with a Constrained
              Variational Framework
            </Ref>
            , 2017. Why the KL weight is a knob worth turning.
          </li>
          <li>
            Kipf and Welling,{" "}
            <Ref href="https://arxiv.org/abs/1609.02907">
              Semi-Supervised Classification with Graph Convolutional Networks
            </Ref>
            , 2016. The symmetric normalisation used in the encoder.
          </li>
          <li>
            Hagberg, Schult and Swart,{" "}
            <Ref href="https://networkx.org/">NetworkX</Ref>. Graph generation,
            triangle counting and every layout in this post.
          </li>
          <li>
            Vazirgiannis, Tsimichodimos and Evdaimon,{" "}
            <em>
              Advanced Learning for Text and Graph Data, lab 6: Learning on Sets
              and Graph Generative Models
            </em>
            , École Polytechnique, 2026. The handout these tasks come from.
          </li>
        </ol>
      </Section>
    </article>
  );
}
