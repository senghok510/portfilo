// Everything the blog post's figures display comes from this file, which
// scripts/vgae-lab/run.py writes after training the model.
import raw from "./results.json";

export type GraphPayload = {
  n: number;
  /** Undirected edges as node-index pairs. */
  edges: [number, number][];
  /** networkx spring layout, normalised into the unit square. */
  pos: [number, number][];
  density: number;
  triangles: number;
  degrees: number[];
};

export type FamilyGraph = GraphPayload & { family: string };

export type HistoryPoint = {
  epoch: number; train: number; val: number;
  bce: number; kl: number; prop: number;
};

export type ConfigSummary = {
  id: string;
  beta: number;
  lam: number;
  label: string;
  kl: number;
  maeDensity: number;
  maeTriangles: number;
};

export type SweepPoint = {
  beta: number; kl: number; maeDensity: number; maeTriangles: number;
};

export type Invariance = {
  readoutMaxDiff: number;
  entriesDiffer: number;
  relabelTrials: number;
  relabelDifferent: number;
};

export type GridCell = {
  reqD: number; reqT: number; achD: number; achT: number; sample: GraphPayload;
};

export type Pair = {
  reqD: number; reqT: number; achD: number; achT: number;
  erD: number; erT: number; sample: GraphPayload;
};

export type Results = {
  config: {
    nNodes: number; nPairs: number; beta: number; epochs: number;
    latent: number; seed: number; nGraphs: number; split: number[];
    params: number; condMean: number[]; condStd: number[]; headline: string;
  };
  configs: ConfigSummary[];
  baseline: { maeDensity: number; maeTriangles: number };
  betaSweep: SweepPoint[];
  invariance: Invariance;
  families: FamilyGraph[];
  scatter: { family: string; d: number; t: number }[];
  ordering: {
    graph: GraphPayload;
    bfsOrder: number[];
    randomOrder: number[];
    adjBfs: number[][];
    adjRandom: number[][];
    adjBfsRelabelled: number[][];
  };
  history: Record<string, HistoryPoint[]>;
  grid: { densities: number[]; triangles: number[]; cells: GridCell[] };
  sampling: {
    request: { d: number; t: number };
    P: number[][];
    threshold: GraphPayload;
    bernoulli: GraphPayload[];
  };
  pairs: Pair[];
};

export const results = raw as unknown as Results;

export const FAMILY_LABEL: Record<string, string> = {
  erdos_renyi: "Erdős–Rényi",
  watts_strogatz: "Watts–Strogatz",
  stochastic_block: "Stochastic block model",
};

export const FAMILY_COLOR: Record<string, string> = {
  erdos_renyi: "#2563eb",
  watts_strogatz: "#d97706",
  stochastic_block: "#0f766e",
};

/** Neighbour lists, for highlighting on hover. */
export function adjacencyList(g: GraphPayload): number[][] {
  const adj: number[][] = Array.from({ length: g.n }, () => []);
  for (const [u, v] of g.edges) {
    adj[u].push(v);
    adj[v].push(u);
  }
  return adj;
}

/** Triangles through each node, for the triangle highlight. */
export function triangleCount(g: GraphPayload): number[] {
  const set = new Set(g.edges.map(([u, v]) => (u < v ? `${u},${v}` : `${v},${u}`)));
  const has = (a: number, b: number) =>
    set.has(a < b ? `${a},${b}` : `${b},${a}`);
  const adj = adjacencyList(g);
  return adj.map((nbrs) => {
    let c = 0;
    for (let i = 0; i < nbrs.length; i += 1) {
      for (let j = i + 1; j < nbrs.length; j += 1) {
        if (has(nbrs[i], nbrs[j])) c += 1;
      }
    }
    return c;
  });
}

/**
 * Statistics quoted in the post, derived from the exported scatter rather than
 * written down by hand, so the prose cannot drift away from the data.
 */
export const datasetStats = (() => {
  const pts = results.scatter;
  const n = pts.length;
  const mx = pts.reduce((a, p) => a + p.d, 0) / n;
  const my = pts.reduce((a, p) => a + p.t, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const p of pts) {
    sxy += (p.d - mx) * (p.t - my);
    sxx += (p.d - mx) ** 2;
    syy += (p.t - my) ** 2;
  }
  const corr = sxy / Math.sqrt(sxx * syy);

  // Mean triangles per node for each family inside one narrow density band,
  // which is the only fair way to compare families that differ in density.
  const BAND: [number, number] = [0.2, 0.24];
  const band = pts.filter((p) => p.d >= BAND[0] && p.d < BAND[1]);
  const meanT = (family: string) => {
    const sel = band.filter((p) => p.family === family);
    return sel.length ? sel.reduce((a, p) => a + p.t, 0) / sel.length : NaN;
  };

  // How many distinct densities each family produces (Watts–Strogatz has two).
  const distinctDensities = (family: string) =>
    new Set(pts.filter((p) => p.family === family).map((p) => p.d.toFixed(4))).size;

  return {
    corr,
    band: BAND,
    bandMid: (BAND[0] + BAND[1]) / 2,
    meanTErdos: meanT("erdos_renyi"),
    meanTBlock: meanT("stochastic_block"),
    wsDensities: distinctDensities("watts_strogatz"),
  };
})();
