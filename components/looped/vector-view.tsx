"use client";

import { useState } from "react";
import { config } from "@/lib/looped-demo/model";
import { valueColor } from "@/components/figures/figure-kit";

const D = config.dModel;

/**
 * One vector as a row of 32 heat cells. Pointer users can pick a cell; keyboard
 * users move with the arrow keys, and the picked value is announced.
 */
export function HeatRow({
  values, scale, label, picked, onPick, muted,
}: {
  values: Float64Array | number[];
  scale: number;
  label: React.ReactNode;
  picked: number | null;
  onPick: (dim: number | null) => void;
  muted?: boolean;
}) {
  const get = (i: number) => values[i] ?? 0;
  const onKeyDown = (e: React.KeyboardEvent) => {
    const cur = picked ?? -1;
    let next = cur;
    if (e.key === "ArrowRight") next = Math.min(D - 1, cur + 1);
    else if (e.key === "ArrowLeft") next = Math.max(0, cur <= 0 ? 0 : cur - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = D - 1;
    else if (e.key === "Escape") next = -1;
    else return;
    e.preventDefault();
    onPick(next < 0 ? null : next);
  };
  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-[4.5rem] shrink-0 font-mono text-[11px] ${
          muted ? "text-stone-400" : "text-stone-600"
        }`}
      >
        {label}
      </span>
      <div
        role="group"
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-label={
          `${typeof label === "string" ? label : "vector"}: ${D} numbers. ` +
          `Use the arrow keys to read a single dimension.`
        }
        className="flex h-5 flex-1 overflow-hidden rounded border border-stone-200 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:outline-none"
      >
        {Array.from({ length: D }, (_, i) => (
          <button
            key={i}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => onPick(picked === i ? null : i)}
            title={`dim ${i} = ${get(i).toFixed(3)}`}
            className="h-full flex-1 cursor-pointer border-0 p-0"
            style={{
              background: valueColor(get(i), scale),
              boxShadow:
                picked === i ? "inset 0 0 0 2px #1c1917" : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** The readout line under a set of heat rows. */
export function PickedValue({
  dim, rows,
}: {
  dim: number | null;
  rows: { label: string; values: Float64Array | number[] }[];
}) {
  if (dim === null) {
    return (
      <p className="mt-2 text-[11px] text-stone-400">
        Click a cell — or focus a row and use the arrow keys — to read one of the{" "}
        {D} numbers.
      </p>
    );
  }
  return (
    <p className="mt-2 font-mono text-[11px] text-stone-600" aria-live="polite">
      dimension {dim}:{" "}
      {rows.map((r, i) => (
        <span key={r.label}>
          {i > 0 ? "  ·  " : ""}
          <span className="text-stone-400">{r.label}</span>{" "}
          {(r.values[dim] ?? 0).toFixed(3)}
        </span>
      ))}
    </p>
  );
}

/** Element-wise difference, with the amplification needed to see it. */
export function DeltaRow({
  before, after, baseScale, picked, onPick,
}: {
  before: Float64Array | number[];
  after: Float64Array | number[];
  baseScale: number;
  picked: number | null;
  onPick: (dim: number | null) => void;
}) {
  const delta = Array.from({ length: D }, (_, i) => (after[i] ?? 0) - (before[i] ?? 0));
  let maxAbs = 0;
  for (const v of delta) maxAbs = Math.max(maxAbs, Math.abs(v));
  const scale = maxAbs > 0 ? maxAbs : 1;
  const amplification = baseScale / scale;
  return (
    <>
      <HeatRow
        values={delta}
        scale={scale}
        label="change"
        picked={picked}
        onPick={onPick}
      />
      <p className="mt-1 pl-[5.3rem] text-[10px] text-stone-400">
        {maxAbs < 1e-9
          ? "identical — nothing moved"
          : `own scale, ±${scale.toFixed(scale < 1 ? 3 : 2)} ` +
            `(${amplification >= 2 ? `about ${Math.round(amplification)}× ` : ""}` +
            `magnified against the rows above)`}
      </p>
    </>
  );
}

/** Lists the dimensions that moved most between two vectors. */
export function TopMovers({
  before, after, limit = 3,
}: {
  before: Float64Array | number[];
  after: Float64Array | number[];
  limit?: number;
}) {
  const movers = Array.from({ length: D }, (_, i) => ({
    dim: i,
    delta: (after[i] ?? 0) - (before[i] ?? 0),
  }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, limit);
  const unchanged = Array.from({ length: D }, (_, i) =>
    Math.abs((after[i] ?? 0) - (before[i] ?? 0)) < 0.05 ? 1 : 0,
  ).reduce((a: number, b: number) => a + b, 0);
  return (
    <p className="mt-2 text-[11px] leading-relaxed text-stone-500">
      Biggest movers:{" "}
      {movers.map((m, i) => (
        <span key={m.dim} className="font-mono">
          {i > 0 ? ", " : ""}dim {m.dim} {m.delta >= 0 ? "+" : "−"}
          {Math.abs(m.delta).toFixed(2)}
        </span>
      ))}
      . {unchanged} of {D} stayed within 0.05.
    </p>
  );
}

/** Keeps a picked dimension in component state. */
export function useDimPick() {
  return useState<number | null>(null);
}
