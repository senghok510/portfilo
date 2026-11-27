"use client";

import { useMemo, useRef } from "react";
import { Counter, Figure, NowLine, Transport } from "./figure-kit";
import { usePlayer } from "./use-player";

const PASSES = 7;
const E = 1;
const f = (z: number) => z / 2;

function fmt(v: number): string {
  if (Number.isInteger(v)) return v.toFixed(0);
  return v.toFixed(Math.min(5, Math.max(1, Math.ceil(-Math.log10(Math.abs(v))) + 2)))
    .replace(/0+$/, "")
    .replace(/\.$/, "");
}

/** h after each pass, with and without the input re-added every time. */
function series(): { without: number[]; withInj: number[] } {
  const without = [0];
  const withInj = [0];
  for (let t = 1; t <= PASSES; t += 1) {
    // Without injection the input is consumed once, on the first pass only.
    without.push(t === 1 ? f(E) : f(without[t - 1]));
    withInj.push(f(withInj[t - 1] + E));
  }
  return { without, withInj };
}

type LaneProps = {
  inject: boolean;
  values: number[];
  pass: number;
  phase: number;
  reducedMotion: boolean;
};

function Lane({ inject, values, pass, phase, reducedMotion }: LaneProps) {
  const prev = values[Math.max(0, pass - 1)];
  const cur = values[Math.max(0, pass)];
  const active = pass >= 1;
  // The original input only enters on pass 1 when there is no injection.
  const eLive = active && (inject || pass === 1);
  const dotT = reducedMotion ? 1 : phase;

  return (
    <div
      className={`rounded-lg border p-3 ${
        inject ? "border-accent/30 bg-accent-soft/50" : "border-stone-200 bg-stone-50/60"
      }`}
    >
      <h4 className="text-[11px] font-semibold tracking-[0.1em] text-stone-500 uppercase">
        {inject ? "With input injection" : "Without input injection"}
      </h4>
      <p className="mt-0.5 font-mono text-[11px] text-stone-500">
        {inject ? "h ← f(h + e)" : "h ← f(h)"}
      </p>

      <svg viewBox="0 0 268 96" className="mt-2 h-auto w-full" aria-hidden="true">
        <defs>
          <marker id={`ij-${inject}`} viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="fill-stone-400" />
          </marker>
        </defs>

        {/* the original input, held outside the loop */}
        <rect x="76" y="4" width="36" height="20" rx="4"
              fill={eLive ? "#ffffff" : "#f5f5f4"}
              stroke={eLive ? "var(--accent)" : "#d6d3d1"} />
        <text x="94" y="18" textAnchor="middle" className="font-mono text-[10px]"
              fill={eLive ? "var(--accent)" : "#a8a29e"}>e = 1</text>
        <line x1="94" y1="24" x2="94" y2="42"
              stroke={eLive ? "var(--accent)" : "#d6d3d1"}
              strokeDasharray={inject ? undefined : "3 2"}
              markerEnd={`url(#ij-${inject})`} />
        {!inject ? (
          <text x="118" y="20" className="fill-stone-400 text-[8px]">
            only on pass 1
          </text>
        ) : null}

        {/* h in */}
        <rect x="4" y="42" width="46" height="24" rx="4"
              className="fill-white stroke-stone-300" />
        <text x="27" y="58" textAnchor="middle"
              className="fill-stone-700 font-mono text-[11px]">{fmt(prev)}</text>
        <text x="27" y="38" textAnchor="middle" className="fill-stone-400 text-[8px]">h in</text>
        <line x1="50" y1="54" x2="80" y2="54" className="stroke-stone-400"
              markerEnd={`url(#ij-${inject})`} />

        {/* the plus sign where the input re-enters */}
        <circle cx="94" cy="54" r="12"
                fill={inject && active ? "var(--accent-soft)" : "#fafaf9"}
                stroke={inject ? "var(--accent)" : "#d6d3d1"} />
        <text x="94" y="58" textAnchor="middle" className="fill-stone-600 text-[12px]">
          {inject ? "+" : "·"}
        </text>
        <line x1="106" y1="54" x2="134" y2="54" className="stroke-stone-400"
              markerEnd={`url(#ij-${inject})`} />

        {/* f */}
        <rect x="138" y="42" width="34" height="24" rx="4"
              className="fill-white stroke-stone-400" />
        <text x="155" y="58" textAnchor="middle"
              className="fill-stone-700 font-mono text-[11px]">f</text>
        <text x="155" y="78" textAnchor="middle" className="fill-stone-400 text-[8px]">z / 2</text>
        <line x1="172" y1="54" x2="200" y2="54" className="stroke-stone-400"
              markerEnd={`url(#ij-${inject})`} />

        {/* h out */}
        <rect x="204" y="42" width="56" height="24" rx="4"
              fill={active ? (inject ? "var(--accent)" : "#ffffff") : "#ffffff"}
              stroke={inject && active ? "var(--accent)" : "#d6d3d1"} />
        <text x="232" y="58" textAnchor="middle" className="font-mono text-[11px]"
              fill={inject && active ? "#ffffff" : "#44403c"}>{fmt(cur)}</text>
        <text x="232" y="38" textAnchor="middle" className="fill-stone-400 text-[8px]">h out</text>

        {/* feedback */}
        <path d="M 232 66 C 232 92 27 92 27 68" fill="none"
              className="stroke-stone-300" strokeDasharray="3 2"
              markerEnd={`url(#ij-${inject})`} />

        {/* the input travelling into the plus sign */}
        {eLive ? (
          <circle cx="94" cy={24 + 18 * dotT} r="3.2" fill="var(--accent)" />
        ) : null}
      </svg>

      <p className="mt-1 font-mono text-[12px] text-stone-800" aria-live="polite">
        {pass === 0 ? (
          <span className="text-stone-400">h starts at 0</span>
        ) : inject ? (
          <>
            pass {pass}: f({fmt(prev)} + {E}) = <strong>{fmt(cur)}</strong>
          </>
        ) : (
          <>
            pass {pass}:{" "}
            {pass === 1 ? `f(${E})` : `f(${fmt(prev)})`} = <strong>{fmt(cur)}</strong>
          </>
        )}
      </p>

      <ol className="mt-2 flex flex-wrap gap-1">
        {values.slice(1).map((v, i) => (
          <li
            key={i}
            className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${
              i + 1 === pass
                ? "border-accent bg-white font-semibold text-accent"
                : i + 1 < pass
                  ? "border-stone-200 bg-white text-stone-500"
                  : "border-dashed border-stone-200 bg-transparent text-stone-300"
            }`}
          >
            {fmt(v)}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function InputInjection() {
  const { without, withInj } = useMemo(() => series(), []);
  const figureRef = useRef<HTMLElement>(null);
  const player = usePlayer({
    count: PASSES + 1,
    stepMs: 1100,
    autoPlayWhenVisible: figureRef,
  });
  const pass = player.index;

  return (
    <Figure
      rootRef={figureRef}
      label="Figure 4 · interactive"
      title="What the “+ e” is for"
      note="scalar illustration"
      caption={
        <>
          <strong className="font-medium text-stone-700">
            Figure 4. One extra addition, two different fates.
          </strong>{" "}
          Step the two lanes forward together. Both reach 0.5 on the first pass.
          On the second, the lane without injection halves 0.5 to 0.25 and keeps
          halving towards nothing, while the lane that re-adds e computes
          f(0.5 + 1) = 0.75 and settles on 1. This is a scalar stand-in for a
          whole hidden state, but it is the same arithmetic the{" "}
          <code className="font-mono text-[13px]">+ e</code> performs: it keeps
          the question in view however long the loop runs.
        </>
      }
    >
      <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
        <code className="font-mono text-[13px] text-stone-800">
          h = self.block(h{" "}
          <span className="rounded bg-accent-soft px-1 font-semibold text-accent">
            + e
          </span>
          )
        </code>
        <p className="mt-1 text-[11px] text-stone-500">
          The highlighted addition is the whole of input injection. Below, h and e
          are single numbers instead of vectors, with e = 1 and f(z) = z / 2.
        </p>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Lane inject={false} values={without} pass={pass} phase={player.phase}
              reducedMotion={player.reducedMotion} />
        <Lane inject values={withInj} pass={pass} phase={player.phase}
              reducedMotion={player.reducedMotion} />
      </div>

      <Transport
        player={player}
        count={PASSES + 1}
        marks={[
          { at: 1, label: "pass 1" },
          { at: 2, label: "pass 2" },
          { at: PASSES, label: `pass ${PASSES}` },
        ]}
        stepLabel={`pass ${pass} of ${PASSES}`}
      >
        <span className="ml-auto flex flex-wrap items-center gap-1.5">
          <Counter label="pass" value={`${pass} / ${PASSES}`} tone="accent" />
        </span>
      </Transport>

      <NowLine step={pass === 0 ? "Before the first pass" : `Pass ${pass}`}>
        {pass === 0 ? (
          <>Both lanes start with h = 0. Press Play to run the two updates side by side.</>
        ) : pass === 1 ? (
          <>
            The first pass is a tie: both lanes see the input for the first time, so
            both compute f(1) = 0.5. Nothing has gone wrong yet in either of them —
            which is exactly why a loop run for only one pass gives no hint of the
            problem.
          </>
        ) : pass === 2 ? (
          <>
            Here they part. Without injection the only thing left of the input is
            whatever survives in h, so f(0.5) = 0.25 — half of what there was. With
            injection, e comes back in at the plus sign and f(0.5 + 1) = 0.75. One
            lane is losing the question, the other is sharpening its answer to it.
          </>
        ) : (
          <>
            After {pass} passes: {fmt(without[pass])} without injection,{" "}
            {fmt(withInj[pass])} with. The first is on its way to 0 and the model has
            forgotten what it was asked; the second is converging on 1, the fixed
            point of z = (z + 1) / 2. Run more loops and the gap only widens — which
            is why deep loops without injection tend to collapse.
          </>
        )}
      </NowLine>
    </Figure>
  );
}
