// Checks that the TypeScript forward pass reproduces the numpy reference in
// train.py bit-for-bit enough to trust the numbers the article displays.
// Run with:  npx tsx scripts/looped-demo/parity.mjs
import { readFileSync } from "node:fs";
import { forward, topK, vocab, config } from "../../lib/looped-demo/model";
import { tokenize, idsOf } from "../../lib/looped-demo/tokenizer";

type Fixtures = {
  prompt: string;
  ids: number[];
  loops: number;
  topFive: { token: string; p: number }[];
  hFinalFirst8: number[];
  attnLoop1Head0LastRow: number[];
  logitsLastSum: number;
};

const fix: Fixtures = JSON.parse(
  readFileSync(new URL("../../lib/looped-demo/fixtures.json", import.meta.url), "utf8"),
) as Fixtures;

let failures = 0;
function check(name: string, got: number, want: number, tol: number) {
  const ok = Math.abs(got - want) <= tol;
  if (!ok) failures += 1;
  const mark = ok ? "ok  " : "FAIL";
  console.log(`${mark} ${name}: got ${got} want ${want} (tol ${tol})`);
}

const tokens = tokenize(fix.prompt);
const ids = idsOf(tokens);
console.log(`tokenizer: ${tokens.map((t) => t.token).join(" ")}`);
check("token count", ids.length, fix.ids.length, 0);
for (let i = 0; i < fix.ids.length; i += 1) check(`id[${i}]`, ids[i], fix.ids[i], 0);

const out = forward(ids, fix.loops);
const top = topK(out.logits, out.length - 1, 5);
console.log(`top-5: ${top.map((t) => `${t.token} ${t.p.toFixed(4)}`).join(", ")}`);
fix.topFive.forEach((want, i) => {
  check(`top[${i}].token`, top[i].token === want.token ? 1 : 0, 1, 0);
  check(`top[${i}].p`, top[i].p, want.p, 1e-9);
});

const last = out.loops[out.loops.length - 1].hidden;
const off = (out.length - 1) * config.dModel;
fix.hFinalFirst8.forEach((want, i) =>
  check(`h[${i}]`, last[off + i], want, 1e-9),
);

const row = out.loops[0].attention[0][out.length - 1];
fix.attnLoop1Head0LastRow.forEach((want, i) =>
  check(`attn[${i}]`, row[i], want, 1e-9),
);

let sum = 0;
for (let i = 0; i < config.vocabSize; i += 1) {
  sum += out.logits[(out.length - 1) * config.vocabSize + i];
}
check("logits sum", sum, fix.logitsLastSum, 1e-7);

console.log(
  failures === 0
    ? `\nPARITY OK — ${vocab.length} vocab entries, ${config.paramCount} parameters`
    : `\n${failures} CHECK(S) FAILED`,
);
process.exit(failures === 0 ? 0 : 1);
