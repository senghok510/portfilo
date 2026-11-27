"use client";

import { useMemo, useState } from "react";
import { Counter, Figure, Panel } from "@/components/figures/figure-kit";
import { results } from "@/lib/vgae-lab/data";
import { GraphView } from "./graph-view";

export function RequestFigure() {
  const { grid, config } = results;
  const [di, setDi] = useState(2);
  const [ti, setTi] = useState(2);

  const reqD = grid.densities[di];
  const reqT = grid.triangles[ti];
  const cell = useMemo(
    () => grid.cells.find((c) => c.reqD === reqD && c.reqT === reqT)!,
    [grid.cells, reqD, reqT],
  );

  const dErr = cell.achD - cell.reqD;
  const tErr = cell.achT - cell.reqT;

  // Whether a request is reasonable is decided by the data, not by a formula:
  // look at the graphs in the dataset with a similar density and see how many
  // triangles any of them managed.
  const { maxNearby, nNearby } = useMemo(() => {
    const near = results.scatter.filter((p) => Math.abs(p.d - reqD) <= 0.025);
    return {
      maxNearby: near.length ? Math.max(...near.map((p) => p.t)) : Infinity,
      nNearby: near.length,
    };
  }, [reqD]);
  const feasible = reqT <= maxNearby;

  return (
    <Figure
      label="Figure 4 · interactive"
      title="Ask for a graph"
      note={`${config.params.toLocaleString()} weights · latent ${config.latent}`}
      caption={
        <>
          <strong className="font-medium text-stone-700">
            Figure 4. Two numbers in, a graph out.
          </strong>{" "}
          Move the sliders to ask for an edge density and a number of triangles
          per node, and the trained decoder draws a graph to order. The drawing
          is one Bernoulli sample; the achieved numbers underneath are averaged
          over 16 draws from the same request, so they show what the model
          reliably produces rather than one lucky graph. Hold the density slider
          at its lowest and push triangles to the top: that pairing does not
          occur anywhere in the dataset and cannot occur in a 24-node graph, and
          you can watch the model quietly fail to deliver it.
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <label className="block">
            <span className="flex items-baseline justify-between text-[11px] font-semibold tracking-[0.1em] text-stone-500 uppercase">
              Requested density ρ
              <span className="font-mono text-sm text-stone-900 normal-case">
                {reqD.toFixed(2)}
              </span>
            </span>
            <input
              type="range" min={0} max={grid.densities.length - 1} step={1}
              value={di} onChange={(e) => setDi(Number(e.target.value))}
              aria-valuetext={`density ${reqD}`}
              className="mt-1 h-6 w-full cursor-pointer accent-[var(--accent)]"
            />
          </label>
          <label className="mt-2 block">
            <span className="flex items-baseline justify-between text-[11px] font-semibold tracking-[0.1em] text-stone-500 uppercase">
              Requested triangles per node t
              <span className="font-mono text-sm text-stone-900 normal-case">
                {reqT.toFixed(1)}
              </span>
            </span>
            <input
              type="range" min={0} max={grid.triangles.length - 1} step={1}
              value={ti} onChange={(e) => setTi(Number(e.target.value))}
              aria-valuetext={`triangles ${reqT}`}
              className="mt-1 h-6 w-full cursor-pointer accent-[var(--accent)]"
            />
          </label>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { k: "density", req: cell.reqD, ach: cell.achD, err: dErr, dp: 3 },
              { k: "triangles / node", req: cell.reqT, ach: cell.achT, err: tErr, dp: 2 },
            ].map((r) => (
              <div key={r.k} className="rounded-lg border border-stone-200 bg-stone-50/60 p-3">
                <div className="text-[10px] font-semibold tracking-[0.1em] text-stone-500 uppercase">
                  {r.k}
                </div>
                <div className="mt-1 flex items-baseline gap-2 font-mono text-[13px]">
                  <span className="text-stone-400">{r.req.toFixed(r.dp)}</span>
                  <span className="text-stone-300">→</span>
                  <span className="font-semibold text-stone-900">{r.ach.toFixed(r.dp)}</span>
                </div>
                <div
                  className={`mt-0.5 font-mono text-[11px] ${
                    Math.abs(r.err) < (r.dp === 3 ? 0.02 : 0.35)
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}
                >
                  {r.err >= 0 ? "+" : "−"}
                  {Math.abs(r.err).toFixed(r.dp)} off
                </div>
              </div>
            ))}
          </div>

          {!feasible ? (
            <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-900">
              Nothing in the dataset looks like this. Of the {nNearby} graphs
              within 0.025 of density {reqD.toFixed(2)}, the most triangle-heavy
              managed {maxNearby.toFixed(2)} per node — and you are asking for{" "}
              {reqT.toFixed(1)}. At this density a 24-node graph does not have
              the edges to close that many triangles, so the model gets as far as
              it can and stops. No amount of training makes an impossible request
              possible.
            </p>
          ) : null}

          <p className="mt-2 text-[11px] leading-relaxed text-stone-500">
            The requested pair is standardised with the training mean and
            standard deviation, concatenated to a latent vector drawn from
            N(0, I), and pushed through the decoder to {config.nPairs} edge
            probabilities.
          </p>
        </div>

        <Panel
          title="One Bernoulli draw for this request"
          aside={`averaged over 16 draws`}
        >
          <div className="mx-auto max-w-[260px]">
            <GraphView graph={cell.sample} size={250} showTriangles />
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            <Counter label="nodes" value={config.nNodes} />
            <Counter label="edges" value={cell.sample.edges.length} />
            <Counter label="pairs decoded" value={config.nPairs} tone="accent" />
          </div>
        </Panel>
      </div>
    </Figure>
  );
}
