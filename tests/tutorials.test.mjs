import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { compileMDX } from "next-mdx-remote/rsc";
import { tutorialMdxOptions } from "../lib/tutorial-mdx.ts";
import katex from "katex";
import { algorithms, tutorialSections } from "../lib/tutorials.ts";
import { sigmoid, regressionSSE, splitStats, forestVariance, fitBoosting } from "../lib/tutorial-math.ts";

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);
for (const algorithm of algorithms) {
  test(`${algorithm.slug}: chapter compiles, equations parse, sections and links resolve`, async () => {
    const source = fs.readFileSync(new URL(`../content/tutorials/${algorithm.slug}.mdx`, import.meta.url), "utf8");
    const received = { equations: 0, symbols: 0, tables: 0, figures: 0 };
    const { content } = await compileMDX({ source, options: tutorialMdxOptions, components: {
      Equation: ({ math }) => { assert.equal(typeof math, "string"); katex.renderToString(math, { throwOnError: true, strict: "error" }); received.equations++; return null; },
      Symbols: ({ rows }) => { assert.ok(Array.isArray(rows)); received.symbols++; return null; },
      ReferenceTable: ({ headers, rows }) => { assert.ok(headers.length >= 2 && rows.length > 0); received.tables++; return null; },
      AlgorithmLab: ({ kind }) => { assert.equal(kind, algorithm.slug); received.figures++; return null; },
      Insight: ({ children }) => React.createElement("aside", null, children),
    }});
    const html = renderToStaticMarkup(content);
    assert.ok(html.includes('id="references"'));
    assert.ok(received.equations >= 6 && received.symbols === 1 && received.tables >= 2 && received.figures === 1);
    const ids = [...source.matchAll(/<h2 id="([^"]+)">/g)].map(m => m[1]);
    assert.deepEqual(ids, tutorialSections.map(s => s[0]));
    const equations = [...source.matchAll(/<Equation math=\{String\.raw`([^`]+)`\}/g)];
    assert.ok(equations.length >= 6);
    for (const [, math] of equations) {
      assert.doesNotThrow(() => katex.renderToString(math, { throwOnError: true, strict: "error" }), math);
    }
    const symbols = source.match(/<Symbols rows=\{(\[.*\])\} \/>/);
    assert.ok(symbols);
    for (const [symbol] of JSON.parse(symbols[1])) {
      assert.ok(!/[\x00-\x1F]/.test(symbol), `Unexpected escape in ${symbol}`);
      katex.renderToString(symbol, { throwOnError: true, strict: "error" });
    }
    assert.ok(source.includes(`<AlgorithmLab kind="${algorithm.slug}" />`));
    for (const [, href] of source.matchAll(/\]\(([^)]+)\)/g)) {
      if (href.startsWith("/")) assert.ok(fs.existsSync(path.join(process.cwd(), "app", href, "page.tsx")), href);
      else assert.equal(new URL(href).protocol, "https:");
    }
  });
}

test("linear demo has the stated constrained optimum", () => {
  near(regressionSSE(.8), .8);
  assert.ok(regressionSSE(.75) > regressionSSE(.8));
  assert.ok(regressionSSE(.85) > regressionSSE(.8));
  // Independent three-point OLS hand calculation in the chapter.
  near([-1/6, 1/3, -1/6].reduce((sum, r) => sum + r*r, 0), 1/6);
});
test("logistic probabilities remain stable at extreme scores", () => {
  near(sigmoid(.4), .598687660112452);
  near(sigmoid(0), .5);
  near(sigmoid(1000), 1);
  near(sigmoid(-1000), 0);
  near(sigmoid(3) + sigmoid(-3), 1);
});
test("tree Gini calculation matches both optimal splits and the inferior split", () => {
  near(splitStats(2.5).gain, .25);
  near(splitStats(4.5).gain, .25);
  near(splitStats(3.5).gain, 1/18);
  near(splitStats(2.5).left, 0);
  near(splitStats(2.5).right, .75);
});
test("forest illustration respects correlation endpoints and the worked example", () => {
  near(forestVariance(1, .2), 1);
  near(forestVariance(100, 0), .01);
  near(forestVariance(100, 1), 1);
  near(9 * forestVariance(10, .2), 2.52);
  near(9 * forestVariance(100, .2), 1.872);
});
test("boosting fits the first optimal stump and improves loss over supported controls", () => {
  // Mean starts at 2.5; optimal first threshold is 1.5 (tied with 5.5).
  const first = fitBoosting(1, 1);
  assert.deepEqual(first.predictions, [1, 1, 3, 3, 3, 3, 3, 3]);
  near(first.losses[0], .5);
  for (const rate of [.05, .3, 1]) {
    const fit = fitBoosting(20, rate);
    fit.losses.forEach((loss, i) => assert.ok(Number.isFinite(loss) && loss <= (fit.losses[i-1] ?? 1.25) + 1e-12));
  }
  const gain = .5 * (4/3 + 4/3) - .1;
  near(gain, 1.2333333333333332);
  near(1 + .3 * (-2/3), .8);
});
