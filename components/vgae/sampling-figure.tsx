"use client";

import { useMemo, useState } from "react";
import { Figure, Panel } from "@/components/figures/figure-kit";
import { results } from "@/lib/vgae-lab/data";
import { GraphView } from "./graph-view";

/** The decoder's edge-probability matrix, as a heat map. */
function ProbMatrix({
  P, size = 230, highlight,
}: {
  P: number[][];
  size?: number;
  highlight: "none" | "above" | "below";
}) {
  const n = P.length;
  const c = size / n;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full" role="img"
         aria-label={`${n} by ${n} matrix of edge probabilities between 0 and 1.`}>
      <rect x="0" y="0" width={size} height={size} className="fill-white stroke-stone-200" />
      {P.map((row, i) =>
        row.map((p, j) => {
          if (i === j) return null;
          const over = p > 0.5;
          const muted =
            (highlight === "above" && !over) || (highlight === "below" && over);
          return (
            <rect
              key={`${i}-${j}`}
              x={j * c} y={i * c} width={c + 0.3} height={c + 0.3}
              fill={`color-mix(in srgb, #2563eb ${Math.round(p * 100)}%, white)`}
              opacity={muted ? 0.12 : 1}
            />
          );
        }),
      )}
      <line x1="0" y1="0" x2={size} y2={size} className="stroke-stone-300" strokeWidth="0.7" />
    </svg>
  );
}

export function SamplingFigure() {
  const { sampling } = results;
  const [mode, setMode] = useState<"threshold" | "bernoulli">("bernoulli");

  const stats = useMemo(() => {
    const n = sampling.P.length;
    let sum = 0;
    let above = 0;
    let pairs = 0;
    let max = 0;
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        sum += sampling.P[i][j];
        if (sampling.P[i][j] > 0.5) above += 1;
        if (sampling.P[i][j] > max) max = sampling.P[i][j];
        pairs += 1;
      }
    }
    return {
      pairs,
      mean: sum / pairs,
      above,
      max,
      expectedDensity: sum / pairs,
      thresholdDensity: above / pairs,
    };
  }, [sampling.P]);

  const samples = sampling.bernoulli;
  const spread = useMemo(() => {
    const ds = samples.map((s) => s.density);
    const ts = samples.map((s) => s.triangles);
    return {
      dMin: Math.min(...ds), dMax: Math.max(...ds),
      tMin: Math.min(...ts), tMax: Math.max(...ts),
    };
  }, [samples]);

  return (
    <Figure
      label="Figure 3 · interactive"
      title="Thresholding against sampling"
      note="Question 5"
      caption={
        <>
          <strong className="font-medium text-stone-700">
            Figure 3. The same probabilities, turned into graphs two ways.
          </strong>{" "}
          The decoder never outputs a graph — it outputs one probability per node
          pair, shown on the left. Thresholding at 0.5 keeps only the{" "}
          {stats.above} pairs the model is more than half sure about and throws
          the rest away, which here is far too few edges and gives the same graph
          every time. Sampling each pair from its Bernoulli keeps the density the
          model intended and gives a different graph on every draw. Switch
          between them and watch both the picture and the numbers.
        </>
      }
    >
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Panel
          title="Edge probabilities P"
          aside={`requested ρ ${sampling.request.d} · t ${sampling.request.t}`}
        >
          <ProbMatrix
            P={sampling.P}
            highlight={mode === "threshold" ? "above" : "none"}
          />
          <dl className="mt-2 space-y-0.5 text-[11px] text-stone-600">
            <div className="flex justify-between gap-2">
              <dt>mean probability over the {stats.pairs} pairs</dt>
              <dd className="font-mono text-stone-900">{stats.mean.toFixed(3)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>largest single probability</dt>
              <dd className="font-mono text-stone-900">{stats.max.toFixed(3)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>pairs above 0.5</dt>
              <dd className="font-mono text-stone-900">
                {stats.above} of {stats.pairs}
              </dd>
            </div>
          </dl>
        </Panel>

        <div>
          <div className="flex flex-wrap gap-1.5">
            {([
              ["bernoulli", "Sample each pair"],
              ["threshold", "Threshold at 0.5"],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                aria-pressed={mode === id}
                className={`rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:outline-none ${
                  mode === id
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "threshold" ? (
            <div className="mt-3">
              <div className="mx-auto max-w-[230px]">
                <GraphView
                  graph={sampling.threshold}
                  label="the only graph you can get"
                  accent="#b45309"
                />
              </div>
              <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-900">
                Density {sampling.threshold.density.toFixed(3)} against the{" "}
                {sampling.request.d} that was asked for, and{" "}
                {sampling.threshold.triangles.toFixed(2)} triangles per node
                against {sampling.request.t}. Thresholding is deterministic, so
                this is the whole output distribution: one graph, no diversity,
                and a density set by how many probabilities happen to clear 0.5
                rather than by what the model predicted.
              </p>
            </div>
          ) : (
            <div className="mt-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {samples.map((s, i) => (
                  <GraphView key={i} graph={s} size={150} label={`draw ${i + 1}`} />
                ))}
              </div>
              <p className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] leading-relaxed text-emerald-900">
                Four draws from the same matrix, four different graphs. Density
                lands between {spread.dMin.toFixed(3)} and{" "}
                {spread.dMax.toFixed(3)} around the requested{" "}
                {sampling.request.d}, and triangles between{" "}
                {spread.tMin.toFixed(2)} and {spread.tMax.toFixed(2)} around{" "}
                {sampling.request.t}. The expected density of a Bernoulli draw is
                exactly the mean probability, {stats.mean.toFixed(3)}, which is
                why sampling hits the target that thresholding misses.
              </p>
            </div>
          )}
        </div>
      </div>
    </Figure>
  );
}
