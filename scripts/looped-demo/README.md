# The demo model behind the looped-attention figures

`app/blog/looped-attention` runs a real weight-tied causal transformer in the
browser. These scripts are where its weights come from.

| file | what it is |
| --- | --- |
| `spec.py` | The vocabulary, the tokenizer and the synthetic training corpus. The single source of truth for tokenization. |
| `train.py` | Defines the looped model, trains it, and exports `lib/looped-demo/weights.json` plus `fixtures.json`. |
| `parity.ts` | Checks that the TypeScript forward pass reproduces the Python one. |

## The model

One pre-norm block — 4 attention heads, a 64-unit feed-forward layer, 32
dimensions wide — applied `T` times with the embedded input re-added on every
pass, then a final norm and an output head:

```
e = tok_emb[ids] + pos_emb
h = 0
repeat T times:  h = block(h + e)
logits = lm_head(final_norm(h))
```

15,807 weights in total. `T` is sampled from 1–6 during training, so one set of
weights stays usable at any depth the figure offers (1–8).

The corpus is 24,000 generated sentences about people putting coloured objects
into containers. It is a teaching model: it knows nothing else.

## Retraining

Needs Python 3.12+, `torch` and `numpy` (not listed in `pyproject.toml`, which
the site itself does not use):

```bash
uv pip install --system torch numpy
```

```bash
python3 scripts/looped-demo/train.py
```

Everything is seeded, so this reproduces the committed weights. It takes about
two minutes on a laptop CPU and rewrites:

- `lib/looped-demo/weights.json` — int16-quantised tensors, config and vocabulary
- `lib/looped-demo/fixtures.json` — golden values for the parity check

## Checking the browser code still matches

```bash
npx tsx scripts/looped-demo/parity.ts
```

This runs the TypeScript forward pass in `lib/looped-demo/model.ts` against the
fixtures and fails if any token id, attention weight, hidden value or
probability drifts. Run it after changing either implementation.
