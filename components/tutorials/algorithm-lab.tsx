"use client";

import { useId, useState } from "react";
import type { AlgorithmSlug } from "@/lib/tutorials";
import { regressionPoints, treePoints, boostingPoints, sigmoid, regressionSSE, splitStats, forestVariance, fitBoosting } from "@/lib/tutorial-math";

const settings = {
  "linear-regression": { label: "Slope β₁ (intercept fixed at 1)", min: 0, max: 1.5, step: .05, value: .8, title: "Move the line. Watch the squared error." },
  "logistic-regression": { label: "Coefficient β₁ (intercept fixed at 0)", min: -3, max: 3, step: .1, value: 1, title: "From a linear score to a probability." },
  "decision-tree": { label: "Split threshold s", min: 1.5, max: 5.5, step: 1, value: 2.5, title: "One split, two class distributions." },
  "random-forest": { label: "Number of trees B", min: 1, max: 100, step: 1, value: 10, title: "Why more trees eventually stop helping." },
  xgboost: { label: "Boosting rounds M", min: 1, max: 20, step: 1, value: 1, title: "Fit the residuals, one stump at a time." },
};
export function AlgorithmLab({ kind }: { kind: AlgorithmSlug }) {
  const config = settings[kind];
  const [value, setValue] = useState(config.value);
  const [secondary, setSecondary] = useState(kind === "random-forest" ? .2 : .3);
  const id = useId();
  let points: number[][] = [];
  let curve: number[][] = [];
  let metric = "";
  let caption = "";
  let xMin = 0, xMax = 4, yMax = 6;
  if (kind === "linear-regression") {
    points = regressionPoints;
    curve = [[0, 1], [4, 1 + 4 * value]];
    yMax = 7;
    metric = `SSE = ${regressionSSE(value).toFixed(3)}`;
    caption = "Dots are fixed synthetic observations. Dashed vertical segments are residuals. Only the slope changes; this is not a refit of both coefficients. The optimal slope with intercept fixed at 1 is 0.8.";
  } else if (kind === "logistic-regression") {
    xMin = -3; xMax = 3; yMax = 1;
    curve = Array.from({ length: 101 }, (_, i) => { const x = -3 + i * .06; return [x, sigmoid(value * x)]; });
    metric = `P(Y = 1 | x = 1) = ${sigmoid(value).toFixed(3)} · odds ratio = ${Math.exp(value).toFixed(3)}`;
    caption = "A synthetic one-feature model with zero intercept. All curves cross (0, 0.5). Increasing the coefficient steepens the response, while a negative coefficient reverses it. No model is being fitted here.";
  } else if (kind === "decision-tree") {
    points = treePoints; xMax = 7; yMax = 1;
    const stats = splitStats(value);
    curve = [[0, stats.left], [value, stats.left], [value, stats.right], [7, stats.right]];
    metric = `Weighted Gini = ${stats.weighted.toFixed(3)} · gain = ${stats.gain.toFixed(3)}`;
    caption = "The six dots are binary labels at x = 1,…,6. The step is the positive-class fraction in each leaf. The parent Gini is 0.5. Thresholds 2.5 and 4.5 tie for the best immediate gain on this toy dataset.";
  } else if (kind === "random-forest") {
    xMin = 1; xMax = 100; yMax = 1;
    curve = Array.from({ length: 100 }, (_, i) => [i + 1, forestVariance(i + 1, secondary)]);
    points = [[value, forestVariance(value, secondary)]];
    metric = `Ensemble variance = ${forestVariance(value, secondary).toFixed(3)} · floor = ${secondary.toFixed(2)}`;
    caption = "An analytical illustration, not a trained forest. Each tree has prediction variance 1 and every pair has the chosen correlation ρ. The dashed line is the limiting variance ρ; the highlighted point is the selected tree count.";
  } else {
    points = boostingPoints; xMax = 7; yMax = 5;
    const fit = fitBoosting(value, secondary);
    curve = fit.predictions.flatMap((y, i) => i === 0 ? [[0, y]] : [[i - .5, fit.predictions[i - 1]], [i - .5, y], [i, y]]);
    metric = `Training MSE = ${fit.losses.at(-1)!.toFixed(4)} · initial MSE = 1.2500`;
    caption = "A real, deterministic squared-error gradient-boosting calculation on eight synthetic points. Each round exhaustively fits a regression stump to current residuals, then applies shrinkage. It illustrates boosting, not the full XGBoost optimizer; training loss is not evidence of generalization.";
  }
  const sx = (x: number) => 48 + (x - xMin) / (xMax - xMin) * 504;
  const sy = (y: number) => 240 - y / yMax * 200;
  const d = curve.map(([x, y], i) => `${i ? "L" : "M"}${sx(x)},${sy(y)}`).join(" ");
  return <figure className="algorithm-lab"><div className="lab-heading"><span className="eyebrow">INTERACTIVE / SYNTHETIC EXAMPLE</span><h3>{config.title}</h3></div><svg viewBox="0 0 600 280" role="img" aria-labelledby={`${id}-title ${id}-desc`}><title id={`${id}-title`}>{config.title}</title><desc id={`${id}-desc`}>{caption} {metric}</desc>{[0, .25, .5, .75, 1].map(t => <g key={t}><line x1="48" y1={sy(t * yMax)} x2="552" y2={sy(t * yMax)} stroke="#d8dfd0" /><text x="39" y={sy(t * yMax) + 4} textAnchor="end">{(t * yMax).toFixed(2)}</text></g>)}<path d="M48 32V240H560" fill="none" stroke="#8b9980" />{[xMin, (xMin + xMax) / 2, xMax].map(x => <text key={x} x={sx(x)} y="259" textAnchor="middle">{x}</text>)}<text x="552" y="275" textAnchor="end">{kind === "random-forest" ? "Number of trees B" : "Feature x"}</text><text x="48" y="21">{kind === "random-forest" ? "Prediction variance" : kind === "logistic-regression" || kind === "decision-tree" ? "P(Y = 1 | x) / label" : "Target / prediction"}</text>{kind === "linear-regression" && points.map(([x, y]) => <line key={x} x1={sx(x)} x2={sx(x)} y1={sy(y)} y2={sy(1 + value * x)} stroke="#b36f4d" strokeDasharray="4 3" />)}{kind === "random-forest" && <line x1="48" x2="552" y1={sy(secondary)} y2={sy(secondary)} stroke="#b36f4d" strokeDasharray="5 4" />}{kind === "decision-tree" && <line x1={sx(value)} x2={sx(value)} y1="40" y2="240" stroke="#b36f4d" strokeDasharray="4 3" />}<path d={d} fill="none" stroke="#54763d" strokeWidth="3" />{points.map(([x, y], i) => <circle key={i} cx={sx(x)} cy={sy(y)} r="5" fill="#273a29" stroke="#f5f7ef" strokeWidth="2" />)}</svg><div className="lab-controls"><label htmlFor={`${id}-primary`}>{config.label}<output>{value.toFixed(config.step < 1 ? 2 : 1)}</output></label><input id={`${id}-primary`} type="range" min={config.min} max={config.max} step={config.step} value={value} onChange={e => setValue(Number(e.target.value))} />{(kind === "random-forest" || kind === "xgboost") && <><label htmlFor={`${id}-secondary`}>{kind === "random-forest" ? "Pairwise correlation ρ" : "Learning rate η"}<output>{secondary.toFixed(2)}</output></label><input id={`${id}-secondary`} type="range" min={kind === "random-forest" ? 0 : .05} max="1" step=".05" value={secondary} onChange={e => setSecondary(Number(e.target.value))} /></>}<p className="lab-metric" aria-live="polite">{metric}</p><button type="button" onClick={() => { setValue(config.value); setSecondary(kind === "random-forest" ? .2 : .3); }}>Reset illustration ↺</button></div><figcaption>{caption}</figcaption></figure>;
}
