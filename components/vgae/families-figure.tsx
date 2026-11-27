"use client";

import { useMemo, useState } from "react";
import { Figure, Panel } from "@/components/figures/figure-kit";
import {
  datasetStats, FAMILY_COLOR, FAMILY_LABEL, results,
} from "@/lib/vgae-lab/data";
import { GraphView } from "./graph-view";

const W = 520;
const H = 240;
const M = { top: 12, right: 14, bottom: 34, left: 46 };

export function FamiliesFigure() {
  const [active, setActive] = useState<string | null>(null);
  const { families, scatter, config } = results;

  const { x, y } = useMemo(() => {
    const ds = scatter.map((p) => p.d);
    const ts = scatter.map((p) => p.t);
    const xs: [number, number] = [0, Math.max(...ds) * 1.05];
    const ys: [number, number] = [0, Math.max(...ts) * 1.05];
    const pw = W - M.left - M.right;
    const ph = H - M.top - M.bottom;
    return {
      x: (v: number) => M.left + ((v - xs[0]) / (xs[1] - xs[0])) * pw,
      y: (v: number) => M.top + ph - ((v - ys[0]) / (ys[1] - ys[0])) * ph,
    };
  }, [scatter]);

  const xticks = [0, 0.1, 0.2, 0.3];
  const yticks = [0, 1, 2, 3, 4];

  return (
    <Figure
      label="Figure 1 · interactive"
      title="Three families, one condition vector"
      note={`${config.nGraphs} graphs · n = ${config.nNodes}`}
      caption={
        <>
          <strong className="font-medium text-stone-700">
            Figure 1. The generator never learns which family a graph came from.
          </strong>{" "}
          Hover a node to light up its neighbours; click a family in the legend
          to isolate its 300 graphs. The scatter is the honest picture of what
          the model is being asked for. Triangles climb with density for all
          three families — the two conditions correlate at r ={" "}
          {datasetStats.corr.toFixed(3)}, so they are nowhere near independent
          requests. Watts–Strogatz collapses onto {datasetStats.wsDensities}{" "}
          vertical lines, because k ∈ &#123;4, 6&#125; fixes its edge count
          exactly. The families do separate, but only once you hold density
          still: between ρ {datasetStats.band[0]} and {datasetStats.band[1]} the
          block model averages {datasetStats.meanTBlock.toFixed(2)} triangles
          per node against Erdős–Rényi&rsquo;s{" "}
          {datasetStats.meanTErdos.toFixed(2)}.
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {families.map((g) => (
          <button
            key={g.family}
            type="button"
            onClick={() => setActive(active === g.family ? null : g.family)}
            aria-pressed={active === g.family}
            className={`rounded-lg border p-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:outline-none ${
              active === g.family
                ? "border-accent bg-accent-soft"
                : "border-stone-200 bg-white hover:border-stone-400"
            }`}
          >
            <GraphView
              graph={g}
              label={FAMILY_LABEL[g.family]}
              accent={FAMILY_COLOR[g.family]}
              showTriangles
            />
          </button>
        ))}
      </div>

      <Panel
        title="Every graph in the dataset"
        aside="density across · triangles per node up"
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img"
             aria-label={
               `Scatter plot of all ${config.nGraphs} graphs. The horizontal axis is edge ` +
               `density, the vertical axis is triangles per node. The three families ` +
               `overlap in density but separate in triangles per node.`
             }>
          {yticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)}
                    className="stroke-stone-200" strokeDasharray="2 3" />
              <text x={M.left - 8} y={y(t) + 3} textAnchor="end"
                    className="fill-stone-400 font-mono text-[9px]">{t}</text>
            </g>
          ))}
          {xticks.map((t) => (
            <text key={t} x={x(t)} y={H - M.bottom + 14} textAnchor="middle"
                  className="fill-stone-400 font-mono text-[9px]">{t.toFixed(2)}</text>
          ))}
          {scatter.map((p, i) => {
            const on = active === null || active === p.family;
            return (
              <circle key={i} cx={x(p.d)} cy={y(p.t)} r={on ? 2.1 : 1.4}
                      fill={FAMILY_COLOR[p.family]}
                      opacity={on ? 0.42 : 0.05} />
            );
          })}
          <text x={(M.left + W - M.right) / 2} y={H - 4} textAnchor="middle"
                className="fill-stone-500 text-[10px]">edge density ρ(G)</text>
          <text x={12} y={M.top + 6} className="fill-stone-500 text-[10px]">
            t(G)
          </text>
        </svg>
        <div className="mt-2 flex flex-wrap gap-3">
          {Object.keys(FAMILY_LABEL).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActive(active === f ? null : f)}
              className={`inline-flex items-center gap-1.5 text-[11px] transition-opacity ${
                active === null || active === f ? "opacity-100" : "opacity-40"
              }`}
            >
              <span className="inline-block size-2.5 rounded-full"
                    style={{ background: FAMILY_COLOR[f] }} />
              {FAMILY_LABEL[f]}
            </button>
          ))}
          {active ? (
            <button type="button" onClick={() => setActive(null)}
                    className="ml-auto text-[11px] text-stone-500 underline underline-offset-2">
              show all three
            </button>
          ) : null}
        </div>
      </Panel>
    </Figure>
  );
}
