"use client";

import { useMemo, useState } from "react";
import {
  adjacencyList, triangleCount, type GraphPayload,
} from "@/lib/vgae-lab/data";

/**
 * Draws one graph. Node positions come from networkx's spring layout, computed
 * in scripts/vgae-lab/run.py and exported with the graph, so what you see here
 * is the same drawing networkx would produce.
 */
export function GraphView({
  graph, size = 190, accent = "#2563eb", label, caption, interactive = true,
  showTriangles = false, dim = false, labels,
}: {
  graph: GraphPayload;
  size?: number;
  accent?: string;
  label?: React.ReactNode;
  caption?: React.ReactNode;
  interactive?: boolean;
  /** Shade nodes by how many triangles pass through them. */
  showTriangles?: boolean;
  dim?: boolean;
  /** Optional per-node label, e.g. its position in an ordering. */
  labels?: (string | number)[];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const adj = useMemo(() => adjacencyList(graph), [graph]);
  const tris = useMemo(
    () => (showTriangles ? triangleCount(graph) : null),
    [graph, showTriangles],
  );
  const maxTri = tris ? Math.max(1, ...tris) : 1;

  const pad = 14;
  const span = size - pad * 2;
  const px = (i: number) => pad + graph.pos[i][0] * span;
  const py = (i: number) => pad + (1 - graph.pos[i][1]) * span;
  const near = (i: number) =>
    hover === null || hover === i || adj[hover].includes(i);

  return (
    <figure className="m-0">
      {label ? (
        <figcaption className="mb-1 text-center text-[11px] font-semibold tracking-[0.08em] text-stone-500 uppercase">
          {label}
        </figcaption>
      ) : null}
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-auto w-full"
        role="img"
        aria-label={
          `Graph with ${graph.n} nodes and ${graph.edges.length} edges, ` +
          `density ${graph.density.toFixed(3)}, ` +
          `${graph.triangles.toFixed(2)} triangles per node.`
        }
        onMouseLeave={() => setHover(null)}
      >
        <rect x="0" y="0" width={size} height={size} rx="8"
              className="fill-stone-50/70 stroke-stone-200" />
        {graph.edges.map(([u, v], k) => {
          const lit = hover !== null && (u === hover || v === hover);
          return (
            <line
              key={k}
              x1={px(u)} y1={py(u)} x2={px(v)} y2={py(v)}
              stroke={lit ? accent : "#a8a29e"}
              strokeWidth={lit ? 1.7 : 0.8}
              strokeOpacity={
                dim ? 0.35 : hover === null ? 0.55 : lit ? 0.95 : 0.12
              }
            />
          );
        })}
        {labels
          ? Array.from({ length: graph.n }, (_, i) => (
              <text
                key={`l${i}`}
                x={px(i)}
                y={py(i) - 6.5}
                textAnchor="middle"
                className="pointer-events-none fill-stone-500 font-mono text-[7.5px]"
              >
                {labels[i]}
              </text>
            ))
          : null}
        {Array.from({ length: graph.n }, (_, i) => {
          const lit = hover === i;
          const shade = tris ? Math.min(1, tris[i] / maxTri) : 0;
          return (
            <circle
              key={i}
              cx={px(i)} cy={py(i)}
              r={lit ? 5.2 : 3.6}
              fill={
                tris
                  ? `color-mix(in srgb, ${accent} ${20 + shade * 80}%, white)`
                  : lit
                    ? accent
                    : "#ffffff"
              }
              stroke={near(i) ? accent : "#d6d3d1"}
              strokeWidth={lit ? 1.8 : 1.1}
              opacity={dim ? 0.5 : near(i) ? 1 : 0.3}
              onMouseEnter={interactive ? () => setHover(i) : undefined}
              style={interactive ? { cursor: "pointer" } : undefined}
            />
          );
        })}
      </svg>
      <figcaption className="mt-1 text-center font-mono text-[10.5px] leading-snug text-stone-500">
        {caption ?? (
          <>
            ρ {graph.density.toFixed(3)} · t {graph.triangles.toFixed(2)}
            <br />
            <span className="text-stone-400">
              {graph.edges.length} edges
              {hover !== null ? ` · node ${hover}: ${adj[hover].length} nbrs` : ""}
            </span>
          </>
        )}
      </figcaption>
    </figure>
  );
}
