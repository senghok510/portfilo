"use client";

import { useMemo, useState } from "react";
import { Figure, Panel } from "@/components/figures/figure-kit";
import { results } from "@/lib/vgae-lab/data";
import { GraphView } from "./graph-view";

type Mode = "bfs" | "random" | "relabelled";

const MODES: { id: Mode; label: string; blurb: string }[] = [
  { id: "bfs", label: "Degree-guided BFS", blurb: "the ordering the lab asks for" },
  { id: "random", label: "An arbitrary order", blurb: "the same graph, nodes shuffled" },
  {
    id: "relabelled",
    label: "BFS after relabelling",
    blurb: "the same graph relabelled, then BFS-ordered again",
  },
];

function Matrix({ A, size = 220 }: { A: number[][]; size?: number }) {
  const n = A.length;
  const c = size / n;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full" role="img"
         aria-label={`${n} by ${n} adjacency matrix. Filled cells are edges.`}>
      <rect x="0" y="0" width={size} height={size} className="fill-white stroke-stone-200" />
      {A.map((row, i) =>
        row.map((v, j) =>
          v > 0 ? (
            <rect key={`${i}-${j}`} x={j * c} y={i * c} width={c + 0.3} height={c + 0.3}
                  fill={j > i ? "#2563eb" : "#bfdbfe"} />
          ) : null,
        ),
      )}
      <line x1="0" y1="0" x2={size} y2={size} className="stroke-stone-300" strokeWidth="0.7" />
    </svg>
  );
}

export function OrderingFigure() {
  const [mode, setMode] = useState<Mode>("bfs");
  const { ordering, invariance } = results;

  const A = useMemo(() => {
    if (mode === "bfs") return ordering.adjBfs;
    if (mode === "random") return ordering.adjRandom;
    return ordering.adjBfsRelabelled;
  }, [mode, ordering]);

  const order = mode === "random" ? ordering.randomOrder : ordering.bfsOrder;
  const positionOf = useMemo(() => {
    const p: number[] = new Array(ordering.graph.n).fill(0);
    order.forEach((node, i) => {
      p[node] = i;
    });
    return p;
  }, [order, ordering.graph.n]);

  const differing = useMemo(() => {
    let d = 0;
    for (let i = 0; i < A.length; i += 1) {
      for (let j = i + 1; j < A.length; j += 1) {
        if (A[i][j] !== ordering.adjBfs[i][j]) d += 1;
      }
    }
    return d;
  }, [A, ordering.adjBfs]);

  return (
    <Figure
      label="Figure 2 · interactive"
      title="Why the reconstruction loss is not permutation invariant"
      note="Question 4"
      caption={
        <>
          <strong className="font-medium text-stone-700">
            Figure 2. One graph, three orderings, three different targets.
          </strong>{" "}
          Switch between the orderings. The drawing never changes — it is the
          same graph every time — but the matrix the decoder is scored against
          rearranges completely. The encoder does not care, because a mean over
          nodes cannot tell the order; the binary cross-entropy does, because it
          compares cell by cell. The third tab is the awkward one: relabel the
          nodes, run the same degree-guided BFS again, and you get a different
          matrix, which is what it means to say the heuristic is not a canonical
          labelling.
        </>
      }
    >
      <div className="flex flex-wrap gap-1.5">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            aria-pressed={mode === m.id}
            className={`rounded-md border px-3 py-1.5 text-left text-[12px] transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:outline-none ${
              mode === m.id
                ? "border-accent bg-accent-soft text-accent"
                : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
            }`}
          >
            <span className="block font-medium">{m.label}</span>
            <span className="block text-[10.5px] text-stone-500">{m.blurb}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 grid items-start gap-4 sm:grid-cols-2">
        <Panel title="The graph" aside="labels are positions in the ordering">
          <GraphView
            graph={ordering.graph}
            size={240}
            labels={positionOf}
            caption={
              <>
                unchanged: ρ {ordering.graph.density.toFixed(3)} · t{" "}
                {ordering.graph.triangles.toFixed(2)}
              </>
            }
          />
        </Panel>
        <Panel
          title="What the decoder is scored against"
          aside={`${A.length}×${A.length}`}
        >
          <Matrix A={A} />
          <p className="mt-2 text-[11px] leading-relaxed text-stone-500">
            {mode === "bfs" ? (
              <>
                The degree-guided BFS pushes the high-degree nodes to the top
                left, so the edges cluster near the diagonal.
              </>
            ) : (
              <>
                <span className="font-mono text-stone-700">{differing}</span> of
                the {(A.length * (A.length - 1)) / 2} node pairs sit in a
                different cell than they did under BFS. Same graph, same loss
                function, different target.
              </>
            )}
          </p>
        </Panel>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {[
          {
            k: "Encoder readout",
            v: `identical to ${invariance.readoutMaxDiff.toExponential(0)}`,
            note: "h_G is a mean over nodes, so reordering cannot change it",
            good: true,
          },
          {
            k: "Reconstruction target",
            v: `${invariance.entriesDiffer} pairs move`,
            note: "BCE compares cell i,j to cell i,j — order is part of the label",
            good: false,
          },
          {
            k: "Is BFS canonical?",
            v: `${invariance.relabelDifferent} / ${invariance.relabelTrials} differ`,
            note: "relabel the same graph and BFS lands somewhere else: no",
            good: false,
          },
        ].map((c) => (
          <div
            key={c.k}
            className={`rounded-lg border p-3 ${
              c.good ? "border-emerald-200 bg-emerald-50/50" : "border-amber-200 bg-amber-50/50"
            }`}
          >
            <div className="text-[10px] font-semibold tracking-[0.1em] text-stone-500 uppercase">
              {c.k}
            </div>
            <div className="mt-1 font-mono text-[13px] text-stone-900">{c.v}</div>
            <div className="mt-1 text-[11px] leading-snug text-stone-600">{c.note}</div>
          </div>
        ))}
      </div>
    </Figure>
  );
}
