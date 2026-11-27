"use client";

import { useMemo, useState } from "react";
import { Figure, Panel } from "@/components/figures/figure-kit";
import { results } from "@/lib/vgae-lab/data";
import { GraphView } from "./graph-view";

const W = 540;
const H = 290;
const PAD = { top: 18, right: 16, bottom: 34, left: 52 };
const GAP = 26;
const PANEL_H = (H - PAD.top - PAD.bottom - GAP) / 2;

/**
 * Two stacked panels sharing the beta axis: the posterior KL collapsing, and
 * the triangle error falling past the baseline. Separate panels because the
 * two quantities have nothing to do with each other's units.
 */
function SweepChart() {
  const { betaSweep, baseline } = results;
  const pw = W - PAD.left - PAD.right;
  const logs = betaSweep.map((p) => Math.log10(p.beta));
  const lo = Math.min(...logs);
  const hi = Math.max(...logs);
  const x = (b: number) => PAD.left + ((Math.log10(b) - lo) / (hi - lo)) * pw;

  // top panel: KL, log scale down to a floor so zero is drawable
  const FLOOR = 0.004;
  const klTop = PAD.top;
  const maxKl = Math.max(...betaSweep.map((p) => p.kl), 1);
  const yK = (v: number) =>
    klTop + PANEL_H -
    (Math.log10(Math.max(v, FLOOR) / FLOOR) / Math.log10(maxKl / FLOOR)) * PANEL_H;

  // bottom panel: MAE on triangles, linear
  const maeTop = PAD.top + PANEL_H + GAP;
  const maxMae = Math.max(...betaSweep.map((p) => p.maeTriangles), baseline.maeTriangles) * 1.18;
  const yM = (v: number) => maeTop + PANEL_H - (v / maxMae) * PANEL_H;

  const line = (fy: (p: (typeof betaSweep)[number]) => number) =>
    betaSweep.map((p) => `${x(p.beta)},${fy(p)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img"
         aria-label={
           "Two charts sharing a beta axis. As beta rises the posterior KL falls from " +
           "about 44 nats to near zero, and the triangle error drops below the " +
           "Erdos-Renyi baseline."
         }>
      {/* top: KL */}
      <text x={W - PAD.right} y={klTop - 6} textAnchor="end"
            className="fill-stone-500 text-[10px]">
        posterior KL (nats, log scale)
      </text>
      <line x1={PAD.left} x2={W - PAD.right} y1={klTop + PANEL_H} y2={klTop + PANEL_H}
            className="stroke-stone-300" />
      <polyline points={line((p) => yK(p.kl))} fill="none" stroke="#d97706" strokeWidth="1.8" />
      {betaSweep.map((p) => (
        <g key={`k${p.beta}`}>
          <circle cx={x(p.beta)} cy={yK(p.kl)} r="3.2" fill="#d97706" />
          <text x={x(p.beta)} y={yK(p.kl) - 7} textAnchor="middle"
                className="font-mono text-[9px]" fill="#b45309">
            {p.kl >= 10 ? p.kl.toFixed(0) : p.kl.toFixed(2)}
          </text>
        </g>
      ))}

      {/* bottom: MAE triangles */}
      <text x={W - PAD.right} y={maeTop - 6} textAnchor="end"
            className="fill-stone-500 text-[10px]">
        MAE on triangles per node
      </text>
      <line x1={PAD.left} x2={W - PAD.right} y1={maeTop + PANEL_H} y2={maeTop + PANEL_H}
            className="stroke-stone-300" />
      <line x1={PAD.left} x2={W - PAD.right}
            y1={yM(baseline.maeTriangles)} y2={yM(baseline.maeTriangles)}
            stroke="#78716c" strokeDasharray="4 3" />
      <text x={W - PAD.right} y={yM(baseline.maeTriangles) - 5} textAnchor="end"
            className="fill-stone-500 font-mono text-[9px]">
        Erdős–Rényi {baseline.maeTriangles.toFixed(3)}
      </text>
      <polyline points={line((p) => yM(p.maeTriangles))} fill="none"
                stroke="#2563eb" strokeWidth="1.8" />
      {betaSweep.map((p) => (
        <g key={`m${p.beta}`}>
          <circle cx={x(p.beta)} cy={yM(p.maeTriangles)} r="3.4"
                  fill={p.maeTriangles < baseline.maeTriangles ? "#2563eb" : "#b45309"} />
          <text x={x(p.beta)} y={yM(p.maeTriangles) + 13} textAnchor="middle"
                className="fill-stone-600 font-mono text-[9px]">
            {p.maeTriangles.toFixed(2)}
          </text>
        </g>
      ))}

      {/* shared axis */}
      {betaSweep.map((p) => (
        <text key={`x${p.beta}`} x={x(p.beta)} y={H - 14} textAnchor="middle"
              className="fill-stone-400 font-mono text-[9px]">{p.beta}</text>
      ))}
      <text x={(PAD.left + W - PAD.right) / 2} y={H - 2} textAnchor="middle"
            className="fill-stone-500 text-[10px]">KL weight β (log scale)</text>
    </svg>
  );
}

export function ResultsFigure() {
  const { configs, baseline, pairs, config } = results;
  const [shown, setShown] = useState(0);
  const headline = configs.find((c) => c.id === config.headline)!;

  const rows = useMemo(
    () => [
      ...configs.map((c) => ({
        label: c.label,
        kl: c.kl,
        d: c.maeDensity,
        t: c.maeTriangles,
        head: c.id === config.headline,
      })),
      {
        label: "Erdős–Rényi at the requested density",
        kl: null as number | null,
        d: baseline.maeDensity,
        t: baseline.maeTriangles,
        head: false,
      },
    ],
    [configs, baseline, config.headline],
  );

  const pair = pairs[shown];

  return (
    <Figure
      label="Figure 5 · interactive"
      title="Does it beat a coin flip?"
      note="100 held-out requests"
      caption={
        <>
          <strong className="font-medium text-stone-700">
            Figure 5. The KL weight decides whether the model is worth anything.
          </strong>{" "}
          With the handout&rsquo;s β = 0.005 the generator loses to an
          Erdős–Rényi graph drawn at the requested density — on both properties.
          Raising β to 0.1 collapses the posterior onto the prior we actually
          sample from, and the same architecture then wins on both. The property
          loss λ, which the handout asks you to compare, barely matters either
          way. Step through the examples to see individual requests.
        </>
      }
    >
      <Panel title="Mean absolute error against the request" aside="lower is better">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[26rem] border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-stone-200 text-left text-[10px] tracking-[0.1em] text-stone-500 uppercase">
                <th className="py-1.5 pr-2 font-semibold">Model</th>
                <th className="py-1.5 pr-2 text-right font-semibold">KL</th>
                <th className="py-1.5 pr-2 text-right font-semibold">MAE density</th>
                <th className="py-1.5 text-right font-semibold">MAE triangles</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.label}
                  className={`border-b border-stone-100 ${
                    r.head ? "bg-accent-soft/60" : ""
                  }`}
                >
                  <td className={`py-1.5 pr-2 ${r.head ? "font-medium text-accent" : "text-stone-700"}`}>
                    {r.label}
                  </td>
                  <td className="py-1.5 pr-2 text-right font-mono text-stone-500">
                    {r.kl === null ? "—" : r.kl < 1 ? r.kl.toFixed(2) : r.kl.toFixed(1)}
                  </td>
                  {[r.d, r.t].map((v, k) => {
                    const base = k === 0 ? baseline.maeDensity : baseline.maeTriangles;
                    const isBase = r.kl === null;
                    return (
                      <td
                        key={k}
                        className={`py-1.5 text-right font-mono ${k === 0 ? "pr-2" : ""} ${
                          isBase
                            ? "text-stone-500"
                            : v < base
                              ? "font-semibold text-emerald-700"
                              : "text-amber-700"
                        }`}
                      >
                        {v.toFixed(k === 0 ? 4 : 3)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-stone-500">
          Green beats the baseline, amber loses to it. The posterior KL is
          measured on the test set: at β = 0.005 it sits around{" "}
          {configs[0].kl.toFixed(0)} nats, so the latent codes the decoder was
          trained on live nowhere near the N(0, I) we draw from at generation
          time.
        </p>
      </Panel>

      <div className="mt-3">
        <Panel title="Raising β fixes it" aside="λ held at 0.02">
          <SweepChart />
        </Panel>
      </div>

      <div className="mt-3">
        <Panel
          title="Requested against achieved"
          aside={`example ${shown + 1} of ${pairs.length}`}
        >
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
            <div className="w-[120px]">
              <GraphView graph={pair.sample} size={120} interactive={false}
                         caption={<span className="text-stone-400">one draw</span>} />
            </div>
            <dl className="space-y-1 text-[12px]">
              {[
                { k: "density", req: pair.reqD, ach: pair.achD, er: pair.erD, dp: 3 },
                { k: "triangles / node", req: pair.reqT, ach: pair.achT, er: pair.erT, dp: 2 },
              ].map((r) => (
                <div key={r.k}>
                  <dt className="text-[10px] tracking-[0.08em] text-stone-500 uppercase">
                    {r.k}
                  </dt>
                  <dd className="flex flex-wrap items-baseline gap-x-3 font-mono">
                    <span className="text-stone-400">asked {r.req.toFixed(r.dp)}</span>
                    <span className="font-semibold text-stone-900">
                      got {r.ach.toFixed(r.dp)}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      ER {r.er.toFixed(r.dp)}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {pairs.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setShown(i)}
                aria-label={`Example ${i + 1}`}
                aria-pressed={shown === i}
                className={`size-6 rounded border font-mono text-[11px] transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                  shown === i
                    ? "border-accent bg-accent text-white"
                    : "border-stone-300 bg-white text-stone-600 hover:border-stone-400"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </Panel>
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-stone-500">
        Headline model: {headline.label}, posterior KL {headline.kl.toFixed(2)},
        MAE {headline.maeDensity.toFixed(4)} on density and{" "}
        {headline.maeTriangles.toFixed(3)} on triangles per node, against{" "}
        {baseline.maeDensity.toFixed(4)} and {baseline.maeTriangles.toFixed(3)}{" "}
        for the baseline.
      </p>
    </Figure>
  );
}
