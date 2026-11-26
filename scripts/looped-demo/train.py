"""Train the weight-tied looped transformer used by the article's figures.

One block, one parameter set, applied T times with input injection:

    e = tok_emb[ids] + pos_emb
    h = 0
    repeat T times:  h = block(h + e)
    logits = lm_head(final_norm(h))

The number of loops is sampled during training so the same weights stay usable
at any depth the reader picks in the figure. Everything is seeded, so the
exported weights are reproducible.

    python3 scripts/looped-demo/train.py          # train + export
    python3 scripts/looped-demo/train.py --check   # verify the exported file
"""

import argparse
import base64
import json
import math
import os
import sys
import time

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import spec  # noqa: E402

OUT_JSON = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "..",
    "lib", "looped-demo", "weights.json",
)

D_MODEL = 32
N_HEADS = 4
D_FF = 64
MAX_LEN = spec.MAX_LEN
LN_EPS = 1e-5
LOOPS_TRAIN = (1, 2, 3, 4, 5, 6)
SEED = 7


def layer_norm(x, g, b):
    mu = x.mean(-1, keepdim=True)
    var = x.var(-1, unbiased=False, keepdim=True)
    return (x - mu) / torch.sqrt(var + LN_EPS) * g + b


class LoopedBlock(nn.Module):
    """A single pre-norm transformer block. Its weights are the whole model."""

    def __init__(self, d=D_MODEL, h=N_HEADS, f=D_FF):
        super().__init__()
        self.d, self.h, self.hd = d, h, d // h
        self.ln1_g = nn.Parameter(torch.ones(d))
        self.ln1_b = nn.Parameter(torch.zeros(d))
        self.Wq = nn.Parameter(torch.empty(d, d))
        self.Wk = nn.Parameter(torch.empty(d, d))
        self.Wv = nn.Parameter(torch.empty(d, d))
        self.Wo = nn.Parameter(torch.empty(d, d))
        self.bq = nn.Parameter(torch.zeros(d))
        self.bk = nn.Parameter(torch.zeros(d))
        self.bv = nn.Parameter(torch.zeros(d))
        self.bo = nn.Parameter(torch.zeros(d))
        self.ln2_g = nn.Parameter(torch.ones(d))
        self.ln2_b = nn.Parameter(torch.zeros(d))
        self.W1 = nn.Parameter(torch.empty(d, f))
        self.b1 = nn.Parameter(torch.zeros(f))
        self.W2 = nn.Parameter(torch.empty(f, d))
        self.b2 = nn.Parameter(torch.zeros(d))
        for w in (self.Wq, self.Wk, self.Wv, self.Wo, self.W1, self.W2):
            nn.init.normal_(w, std=0.02)

    def forward(self, x, mask):
        B, L, D = x.shape
        n1 = layer_norm(x, self.ln1_g, self.ln1_b)
        q = (n1 @ self.Wq + self.bq).view(B, L, self.h, self.hd).transpose(1, 2)
        k = (n1 @ self.Wk + self.bk).view(B, L, self.h, self.hd).transpose(1, 2)
        v = (n1 @ self.Wv + self.bv).view(B, L, self.h, self.hd).transpose(1, 2)
        scores = (q @ k.transpose(-1, -2)) / math.sqrt(self.hd)
        scores = scores.masked_fill(mask[:, :, :L, :L], float("-inf"))
        attn = torch.softmax(scores, dim=-1)
        ctx = (attn @ v).transpose(1, 2).reshape(B, L, D)
        y = x + (ctx @ self.Wo + self.bo)
        n2 = layer_norm(y, self.ln2_g, self.ln2_b)
        ff = F.gelu(n2 @ self.W1 + self.b1, approximate="tanh") @ self.W2 + self.b2
        return y + ff


class LoopedLM(nn.Module):
    def __init__(self, vocab, d=D_MODEL):
        super().__init__()
        self.tok_emb = nn.Parameter(torch.empty(vocab, d))
        self.pos_emb = nn.Parameter(torch.empty(MAX_LEN, d))
        nn.init.normal_(self.tok_emb, std=0.02)
        nn.init.normal_(self.pos_emb, std=0.02)
        self.block = LoopedBlock(d)
        self.lnf_g = nn.Parameter(torch.ones(d))
        self.lnf_b = nn.Parameter(torch.zeros(d))
        self.Wout = nn.Parameter(torch.empty(d, vocab))
        self.bout = nn.Parameter(torch.zeros(vocab))
        nn.init.normal_(self.Wout, std=0.02)
        causal = torch.triu(torch.ones(MAX_LEN, MAX_LEN, dtype=torch.bool), 1)
        self.register_buffer("mask", causal[None, None])

    def forward(self, ids, loops):
        L = ids.shape[1]
        e = self.tok_emb[ids] + self.pos_emb[:L]
        h = torch.zeros_like(e)
        for _ in range(loops):
            h = self.block(h + e, self.mask)  # input injection: e re-added
        f = layer_norm(h, self.lnf_g, self.lnf_b)
        return f @ self.Wout + self.bout


def make_batches(seqs, batch_size, rng):
    order = rng.permutation(len(seqs))
    for i in range(0, len(order) - batch_size + 1, batch_size):
        chunk = [seqs[j] for j in order[i : i + batch_size]]
        n = max(len(s) for s in chunk)
        ids = np.full((len(chunk), n), spec.PAD, dtype=np.int64)
        for r, s in enumerate(chunk):
            ids[r, : len(s)] = s
        yield torch.from_numpy(ids)


def train():
    torch.manual_seed(SEED)
    rng = np.random.default_rng(SEED)
    vocab = spec.VOCAB
    seqs = spec.build_corpus(24000, seed=1)
    print(f"vocab {len(vocab)} · corpus {len(seqs)} sequences")

    model = LoopedLM(len(vocab))
    n_params = sum(p.numel() for p in model.parameters())
    print(f"parameters: {n_params:,}")

    opt = torch.optim.AdamW(model.parameters(), lr=3e-3, weight_decay=0.01,
                            betas=(0.9, 0.98))
    epochs = 14
    steps_total = epochs * (len(seqs) // 64)
    sched = torch.optim.lr_scheduler.OneCycleLR(
        opt, max_lr=3e-3, total_steps=steps_total, pct_start=0.15
    )
    step, t0 = 0, time.time()
    for ep in range(epochs):
        run, nb = 0.0, 0
        for ids in make_batches(seqs, 64, rng):
            loops = int(rng.choice(LOOPS_TRAIN))
            logits = model(ids[:, :-1], loops)
            tgt = ids[:, 1:]
            loss = F.cross_entropy(
                logits.reshape(-1, len(vocab)), tgt.reshape(-1),
                ignore_index=spec.PAD,
            )
            opt.zero_grad(set_to_none=True)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            opt.step()
            sched.step()
            run += loss.item()
            nb += 1
            step += 1
        print(f"  epoch {ep + 1:2d}/{epochs}  loss {run / nb:.4f}"
              f"  ({time.time() - t0:.0f}s)")
    return model, vocab, n_params


# --- evaluation ------------------------------------------------------------

def demo_report(model, vocab):
    model.eval()
    itos = vocab
    with torch.no_grad():
        for prompt in (spec.DEMO_PROMPT, spec.DEMO_PROMPT_RED):
            ids = spec.encode_ids(prompt)
            print(f"\n  {prompt!r}")
            for loops in (1, 2, 3, 4, 5, 6, 8):
                logits = model(torch.tensor([ids]), loops)[0, -1]
                p = torch.softmax(logits, -1)
                top = torch.topk(p, 3)
                shown = ", ".join(
                    f"{itos[i]} {v:.3f}" for v, i in zip(top.values, top.indices)
                )
                print(f"    T={loops}: {shown}")


def accuracy(model, vocab, loops=4, n=600):
    """Next-token accuracy on held-out sentences at the final position."""
    model.eval()
    seqs = spec.build_corpus(n, seed=999)
    ok = tot = 0
    with torch.no_grad():
        for s in seqs:
            logits = model(torch.tensor([s[:-1]]), loops)[0]
            pred = logits.argmax(-1)
            tgt = torch.tensor(s[1:])
            ok += int((pred == tgt).sum())
            tot += len(tgt)
    return ok / tot


# --- export ----------------------------------------------------------------

def quantize(t):
    a = t.detach().cpu().numpy().astype(np.float64)
    m = float(np.abs(a).max())
    scale = (m / 32767.0) if m > 0 else 1.0
    q = np.clip(np.rint(a / scale), -32767, 32767).astype("<i2")
    return {
        "shape": list(a.shape),
        "scale": scale,
        "data": base64.b64encode(q.tobytes()).decode("ascii"),
    }


def dequantize(obj):
    q = np.frombuffer(base64.b64decode(obj["data"]), dtype="<i2").astype(np.float64)
    return (q * obj["scale"]).reshape(obj["shape"])


def export(model, vocab, n_params, acc):
    tensors = {
        "tok_emb": model.tok_emb, "pos_emb": model.pos_emb,
        "ln1_g": model.block.ln1_g, "ln1_b": model.block.ln1_b,
        "Wq": model.block.Wq, "Wk": model.block.Wk, "Wv": model.block.Wv,
        "Wo": model.block.Wo, "bq": model.block.bq, "bk": model.block.bk,
        "bv": model.block.bv, "bo": model.block.bo,
        "ln2_g": model.block.ln2_g, "ln2_b": model.block.ln2_b,
        "W1": model.block.W1, "b1": model.block.b1,
        "W2": model.block.W2, "b2": model.block.b2,
        "lnf_g": model.lnf_g, "lnf_b": model.lnf_b,
        "Wout": model.Wout, "bout": model.bout,
    }
    # A single display scale keeps the vector heat-maps comparable across
    # loops, prompts and runs. 99th percentile of |h| on the demo prompts.
    vals = []
    with torch.no_grad():
        for prompt in (spec.DEMO_PROMPT, spec.DEMO_PROMPT_RED):
            ids = torch.tensor([spec.encode_ids(prompt)])
            e = model.tok_emb[ids] + model.pos_emb[: ids.shape[1]]
            h = torch.zeros_like(e)
            vals.append(e.abs().flatten())
            for _ in range(8):
                h = model.block(h + e, model.mask)
                vals.append(h.abs().flatten())
    display_scale = float(torch.quantile(torch.cat(vals), 0.99))

    payload = {
        "format": "looped-demo-v1",
        "config": {
            "dModel": D_MODEL, "nHeads": N_HEADS, "dFF": D_FF,
            "maxLen": MAX_LEN, "lnEps": LN_EPS, "gelu": "tanh",
            "vocabSize": len(vocab), "paramCount": n_params,
            "loopsTrained": list(LOOPS_TRAIN), "defaultLoops": 4,
            "maxLoops": 8, "displayScale": display_scale,
            "padId": spec.PAD, "unkId": spec.UNK,
            "heldOutAccuracy": round(acc, 4), "seed": SEED,
        },
        "vocab": vocab,
        "tensors": {k: quantize(v) for k, v in tensors.items()},
    }
    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    with open(OUT_JSON, "w") as fh:
        json.dump(payload, fh, separators=(",", ":"))
    print(f"\nwrote {OUT_JSON} ({os.path.getsize(OUT_JSON) / 1024:.0f} KB)")
    return payload


# --- numpy reference forward (the exact algorithm the TS port implements) ---

def np_forward(payload, ids, loops, trace=False):
    cfg = payload["config"]
    W = {k: dequantize(v) for k, v in payload["tensors"].items()}
    D, H = cfg["dModel"], cfg["nHeads"]
    hd = D // H
    eps = cfg["lnEps"]

    def ln(x, g, b):
        mu = x.mean(-1, keepdims=True)
        var = ((x - mu) ** 2).mean(-1, keepdims=True)
        return (x - mu) / np.sqrt(var + eps) * g + b

    def gelu(x):
        return 0.5 * x * (1 + np.tanh(math.sqrt(2 / math.pi) *
                                      (x + 0.044715 * x ** 3)))

    L = len(ids)
    e = W["tok_emb"][ids] + W["pos_emb"][:L]
    h = np.zeros_like(e)
    steps = []
    for _ in range(loops):
        x = h + e
        n1 = ln(x, W["ln1_g"], W["ln1_b"])
        q = (n1 @ W["Wq"] + W["bq"]).reshape(L, H, hd).transpose(1, 0, 2)
        k = (n1 @ W["Wk"] + W["bk"]).reshape(L, H, hd).transpose(1, 0, 2)
        v = (n1 @ W["Wv"] + W["bv"]).reshape(L, H, hd).transpose(1, 0, 2)
        sc = q @ k.transpose(0, 2, 1) / math.sqrt(hd)
        sc = np.where(np.triu(np.ones((L, L), bool), 1)[None], -np.inf, sc)
        sc = sc - sc.max(-1, keepdims=True)
        ex = np.exp(sc)
        A = ex / ex.sum(-1, keepdims=True)
        ctx = (A @ v).transpose(1, 0, 2).reshape(L, D)
        y = x + ctx @ W["Wo"] + W["bo"]
        n2 = ln(y, W["ln2_g"], W["ln2_b"])
        ff = gelu(n2 @ W["W1"] + W["b1"]) @ W["W2"] + W["b2"]
        h = y + ff
        if trace:
            steps.append({"attn": A.copy(), "h": h.copy()})
    f = ln(h, W["lnf_g"], W["lnf_b"])
    logits = f @ W["Wout"] + W["bout"]
    return (logits, steps) if trace else logits


def check():
    payload = json.load(open(OUT_JSON))
    vocab = payload["vocab"]
    ids = spec.encode_ids(spec.DEMO_PROMPT)
    logits, steps = np_forward(payload, ids, 4, trace=True)
    p = np.exp(logits[-1] - logits[-1].max())
    p /= p.sum()
    top = np.argsort(-p)[:5]
    print("numpy forward from the exported file, T=4:")
    for i in top:
        print(f"   {vocab[i]:10s} {p[i]:.4f}")
    # fixtures the TypeScript parity test asserts against
    fix = {
        "prompt": spec.DEMO_PROMPT,
        "ids": ids,
        "loops": 4,
        "topFive": [{"token": vocab[int(i)], "p": float(p[i])} for i in top],
        "hFinalFirst8": [float(v) for v in steps[-1]["h"][-1][:8]],
        "attnLoop1Head0LastRow": [float(v) for v in steps[0]["attn"][0][-1]],
        "logitsLastSum": float(logits[-1].sum()),
    }
    path = os.path.join(os.path.dirname(OUT_JSON), "fixtures.json")
    json.dump(fix, open(path, "w"), indent=2)
    print(f"wrote {path}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    if args.check:
        check()
    else:
        model, vocab, n_params = train()
        acc = accuracy(model, vocab)
        print(f"\nheld-out next-token accuracy (T=4): {acc:.3f}")
        demo_report(model, vocab)
        export(model, vocab, n_params, acc)
        check()
