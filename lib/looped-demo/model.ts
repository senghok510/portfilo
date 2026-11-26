// Forward pass of the article's weight-tied looped transformer.
//
// The weights in weights.json were trained by scripts/looped-demo/train.py and
// are loaded here as int16-quantised tensors. This file mirrors that script's
// numpy reference forward exactly, so every number the figures display comes
// from a real forward pass of a real (if very small) causal language model.
//
// Shape of the computation:
//   e = tok_emb[ids] + pos_emb          <- the injected input
//   h = 0
//   repeat T times:  h = block(h + e)   <- one shared parameter set
//   logits = lm_head(final_norm(h))
import raw from "./weights.json";

export type ModelConfig = {
  dModel: number;
  nHeads: number;
  dFF: number;
  maxLen: number;
  lnEps: number;
  gelu: string;
  vocabSize: number;
  paramCount: number;
  loopsTrained: number[];
  defaultLoops: number;
  maxLoops: number;
  displayScale: number;
  padId: number;
  unkId: number;
  heldOutAccuracy: number;
  seed: number;
};

type QuantTensor = { shape: number[]; scale: number; data: string };

export const config: ModelConfig = raw.config as ModelConfig;
export const vocab: string[] = raw.vocab as string[];

function decodeBase64(b64: string): Uint8Array {
  if (typeof atob === "function") {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
    return out;
  }
  // Node (used by the parity test in scripts/looped-demo/parity.mjs).
  return new Uint8Array(Buffer.from(b64, "base64"));
}

function dequantize(t: QuantTensor): Float64Array {
  const bytes = decodeBase64(t.data);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const n = bytes.byteLength / 2;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i += 1) out[i] = view.getInt16(i * 2, true) * t.scale;
  return out;
}

const T = raw.tensors as unknown as Record<string, QuantTensor>;
const W: Record<string, Float64Array> = {};
for (const key of Object.keys(T)) W[key] = dequantize(T[key]);

const { dModel: D, nHeads: H, dFF: F, lnEps: EPS } = config;
const HD = D / H;
const SQRT_HD = Math.sqrt(HD);
const GELU_C = Math.sqrt(2 / Math.PI);

/** One attention head's view at one loop: rows are queries, columns are keys. */
export type HeadAttention = number[][];

/** Everything the figures need from a single application of the block. */
export type LoopTrace = {
  /** Loop index, 1-based. */
  loop: number;
  /** h + e, the block's input at this loop. */
  input: Float64Array;
  /** Per-head causal attention weights. */
  attention: HeadAttention[];
  /** The attention sub-layer's contribution, before the residual add. */
  attnDelta: Float64Array;
  /** State after the attention residual. */
  afterAttn: Float64Array;
  /** The feed-forward contribution, before the residual add. */
  ffDelta: Float64Array;
  /** h after this loop. */
  hidden: Float64Array;
};

export type Forward = {
  ids: number[];
  length: number;
  /** The injected input e, re-added at every loop. */
  embedding: Float64Array;
  loops: LoopTrace[];
  /** Logits at every position after the final norm. */
  logits: Float64Array;
};

function layerNorm(
  x: Float64Array, L: number, g: Float64Array, b: Float64Array,
): Float64Array {
  const out = new Float64Array(L * D);
  for (let i = 0; i < L; i += 1) {
    const o = i * D;
    let mean = 0;
    for (let j = 0; j < D; j += 1) mean += x[o + j];
    mean /= D;
    let varr = 0;
    for (let j = 0; j < D; j += 1) {
      const d = x[o + j] - mean;
      varr += d * d;
    }
    varr /= D;
    const inv = 1 / Math.sqrt(varr + EPS);
    for (let j = 0; j < D; j += 1) out[o + j] = (x[o + j] - mean) * inv * g[j] + b[j];
  }
  return out;
}

/** rows x inner  @  inner x cols  (+ bias), row-major. */
function matmul(
  a: Float64Array, rows: number, inner: number,
  b: Float64Array, cols: number, bias?: Float64Array,
): Float64Array {
  const out = new Float64Array(rows * cols);
  for (let i = 0; i < rows; i += 1) {
    const ao = i * inner;
    const oo = i * cols;
    for (let k = 0; k < inner; k += 1) {
      const av = a[ao + k];
      if (av === 0) continue;
      const bo = k * cols;
      for (let j = 0; j < cols; j += 1) out[oo + j] += av * b[bo + j];
    }
    if (bias) for (let j = 0; j < cols; j += 1) out[oo + j] += bias[j];
  }
  return out;
}

function gelu(x: number): number {
  return 0.5 * x * (1 + Math.tanh(GELU_C * (x + 0.044715 * x * x * x)));
}

function applyBlock(x: Float64Array, L: number, loop: number): LoopTrace {
  const n1 = layerNorm(x, L, W.ln1_g, W.ln1_b);
  const q = matmul(n1, L, D, W.Wq, D, W.bq);
  const k = matmul(n1, L, D, W.Wk, D, W.bk);
  const v = matmul(n1, L, D, W.Wv, D, W.bv);

  const attention: HeadAttention[] = [];
  const ctx = new Float64Array(L * D);
  for (let h = 0; h < H; h += 1) {
    const head: HeadAttention = [];
    const base = h * HD;
    for (let i = 0; i < L; i += 1) {
      // Causal: position i may only read positions 0..i.
      const scores = new Float64Array(i + 1);
      let max = -Infinity;
      for (let j = 0; j <= i; j += 1) {
        let s = 0;
        for (let d = 0; d < HD; d += 1) {
          s += q[i * D + base + d] * k[j * D + base + d];
        }
        s /= SQRT_HD;
        scores[j] = s;
        if (s > max) max = s;
      }
      let sum = 0;
      for (let j = 0; j <= i; j += 1) {
        scores[j] = Math.exp(scores[j] - max);
        sum += scores[j];
      }
      const row = new Array<number>(L).fill(0);
      for (let j = 0; j <= i; j += 1) {
        const w = scores[j] / sum;
        row[j] = w;
        for (let d = 0; d < HD; d += 1) {
          ctx[i * D + base + d] += w * v[j * D + base + d];
        }
      }
      head.push(row);
    }
    attention.push(head);
  }

  const attnDelta = matmul(ctx, L, D, W.Wo, D, W.bo);
  const afterAttn = new Float64Array(L * D);
  for (let i = 0; i < L * D; i += 1) afterAttn[i] = x[i] + attnDelta[i];

  const n2 = layerNorm(afterAttn, L, W.ln2_g, W.ln2_b);
  const hid = matmul(n2, L, D, W.W1, F, W.b1);
  for (let i = 0; i < hid.length; i += 1) hid[i] = gelu(hid[i]);
  const ffDelta = matmul(hid, L, F, W.W2, D, W.b2);

  const hidden = new Float64Array(L * D);
  for (let i = 0; i < L * D; i += 1) hidden[i] = afterAttn[i] + ffDelta[i];

  return { loop, input: x, attention, attnDelta, afterAttn, ffDelta, hidden };
}

/** Run the looped model over `ids`, keeping every intermediate the figures show. */
export function forward(ids: number[], loops: number): Forward {
  const L = Math.min(ids.length, config.maxLen);
  const use = ids.slice(0, L);
  const embedding = new Float64Array(L * D);
  for (let i = 0; i < L; i += 1) {
    const tok = use[i] * D;
    const pos = i * D;
    for (let j = 0; j < D; j += 1) {
      embedding[pos + j] = W.tok_emb[tok + j] + W.pos_emb[pos + j];
    }
  }
  let h: Float64Array = new Float64Array(L * D);
  const traces: LoopTrace[] = [];
  for (let t = 0; t < loops; t += 1) {
    const x = new Float64Array(L * D);
    for (let i = 0; i < L * D; i += 1) x[i] = h[i] + embedding[i]; // input injection
    const tr = applyBlock(x, L, t + 1);
    traces.push(tr);
    h = tr.hidden;
  }
  const normed = layerNorm(h, L, W.lnf_g, W.lnf_b);
  const logits = matmul(normed, L, D, W.Wout, config.vocabSize, W.bout);
  return { ids: use, length: L, embedding, loops: traces, logits };
}

/** Copy out one position's row. Copying keeps the array type simple and the
 *  cost is 32 doubles. */
export function rowOf(flat: Float64Array, position: number): Float64Array {
  const out = new Float64Array(D);
  const o = position * D;
  for (let i = 0; i < D; i += 1) out[i] = flat[o + i];
  return out;
}

export type Prediction = { id: number; token: string; p: number };

/** Top-`k` next-token probabilities read off one position's logits. */
export function topK(
  logits: Float64Array, position: number, k = 5,
): Prediction[] {
  const o = position * config.vocabSize;
  let max = -Infinity;
  for (let i = 0; i < config.vocabSize; i += 1) {
    if (logits[o + i] > max) max = logits[o + i];
  }
  let sum = 0;
  const probs = new Float64Array(config.vocabSize);
  for (let i = 0; i < config.vocabSize; i += 1) {
    probs[i] = Math.exp(logits[o + i] - max);
    sum += probs[i];
  }
  const order = Array.from({ length: config.vocabSize }, (_, i) => i)
    .sort((a, b) => probs[b] - probs[a])
    .slice(0, k);
  return order.map((id) => ({ id, token: vocab[id], p: probs[id] / sum }));
}

/** Weights in the one shared block (everything the loop reuses). */
export function blockParamCount(): number {
  const d = config.dModel;
  const f = config.dFF;
  return (
    2 * d + // pre-attention norm
    4 * d * d + 4 * d + // Q, K, V, O
    2 * d + // pre-feed-forward norm
    d * f + f + f * d + d // the two feed-forward layers
  );
}

/** Weights outside the block: embeddings, final norm, output head. */
export function sharedParamCount(): number {
  return config.paramCount - blockParamCount();
}
