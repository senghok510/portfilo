"use client";

import type { Prediction } from "@/lib/looped-demo/model";

/** The output head's top-k next-token probabilities. */
export function Predictions({
  items, highlight, compare,
}: {
  items: Prediction[];
  /** Mark the winning row as appended. */
  highlight?: boolean;
  /** Probabilities from the comparison run, keyed by token id. */
  compare?: Map<number, number> | null;
}) {
  const max = Math.max(...items.map((i) => i.p), 1e-9);
  return (
    <ol className="space-y-1.5">
      {items.map((it, rank) => {
        const other = compare?.get(it.id);
        const diff = other === undefined ? null : it.p - other;
        return (
          <li key={it.id} className="flex items-center gap-2">
            <span className="w-3 shrink-0 font-mono text-[10px] text-stone-400">
              {rank + 1}
            </span>
            <span
              className={`w-[5.5rem] shrink-0 truncate font-mono text-xs ${
                rank === 0 && highlight ? "font-semibold text-accent" : "text-stone-700"
              }`}
            >
              {it.token}
            </span>
            <span className="relative h-4 flex-1 overflow-hidden rounded-sm bg-stone-100">
              <span
                className={`absolute inset-y-0 left-0 rounded-sm ${
                  rank === 0 ? "bg-accent" : "bg-stone-300"
                }`}
                style={{ width: `${Math.max(1.5, (it.p / max) * 100)}%` }}
              />
            </span>
            <span className="w-[3.6rem] shrink-0 text-right font-mono text-[11px] text-stone-500">
              {it.p >= 0.0005 ? `${(it.p * 100).toFixed(2)}%` : "<0.05%"}
            </span>
            {diff !== null ? (
              <span
                className={`w-[4.2rem] shrink-0 text-right font-mono text-[10px] ${
                  Math.abs(diff) < 1e-6
                    ? "text-stone-300"
                    : diff > 0
                      ? "text-emerald-700"
                      : "text-amber-700"
                }`}
              >
                {Math.abs(diff) < 1e-6
                  ? "no change"
                  : `${diff > 0 ? "+" : "−"}${(Math.abs(diff) * 100).toFixed(3)}`}
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
