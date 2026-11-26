"use client";

import { useState } from "react";
import { blockParamCount, sharedParamCount } from "@/lib/looped-demo/model";
import { Figure } from "./figure-kit";

const DEPTH = 4;
const BOX_W = 40;
const BOX_H = 34;
const GAP = 8;
const X0 = 34;
const BOX_Y = 26;
const CHIP_Y = 96;
const CHIP_H = 24;

type Side = "looped" | "stacked";

const BLOCK = blockParamCount();
const SHARED = sharedParamCount();
const LOOPED_TOTAL = SHARED + BLOCK;
const STACKED_TOTAL = SHARED + BLOCK * DEPTH;

function boxX(i: number) {
  return X0 + i * (BOX_W + GAP);
}

const WIDTH = X0 * 2 + DEPTH * BOX_W + (DEPTH - 1) * GAP;

function Diagram({
  side, selected, onSelect,
}: {
  side: Side;
  selected: number | null;
  onSelect: (i: number | null) => void;
}) {
  const looped = side === "looped";
  const labels = looped
    ? Array<string>(DEPTH).fill("θ")
    : ["θ₁", "θ₂", "θ₃", "θ₄"];
  // In the looped model every box is the same weight set, so selecting one
  // lights up all of them.
  const isLit = (i: number) =>
    selected !== null && (looped ? true : selected === i);
  const chipLit = selected !== null;

  const press = (i: number) => onSelect(selected === i ? null : i);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      press(i);
    }
  };

  return (
    <svg
      viewBox={`0 0 ${WIDTH} 136`}
      className="h-auto w-full"
      role="img"
      aria-label={
        looped
          ? `Four applications of one shared block theta, all drawn from a single weight set.`
          : `Four stacked blocks, theta one to theta four, each with its own weight set.`
      }
    >
      <defs>
        <marker id={`ur-${side}`} viewBox="0 0 10 10" refX="9" refY="5"
                markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="fill-stone-400" />
        </marker>
      </defs>

      <text x="6" y={BOX_Y + 21} className="fill-stone-500 font-mono text-[11px]">x</text>
      {Array.from({ length: DEPTH }, (_, i) => {
        const x = boxX(i);
        const lit = isLit(i);
        return (
          <g key={i}>
            <line
              x1={i === 0 ? 14 : x - GAP} y1={BOX_Y + BOX_H / 2}
              x2={x - 2} y2={BOX_Y + BOX_H / 2}
              className="stroke-stone-400" markerEnd={`url(#ur-${side})`}
            />
            {/* dashed line from this box down to the weight set it uses */}
            <line
              x1={looped ? x + BOX_W / 2 : x + BOX_W / 2}
              y1={BOX_Y + BOX_H}
              x2={looped ? WIDTH / 2 : x + BOX_W / 2}
              y2={CHIP_Y}
              stroke={lit ? "var(--accent)" : "#d6d3d1"}
              strokeWidth={lit ? 1.4 : 1}
              strokeDasharray="3 3"
            />
            <g
              tabIndex={0}
              role="button"
              aria-pressed={lit}
              aria-label={
                looped
                  ? `Shared block theta, application ${i + 1} of ${DEPTH}. Activate to highlight every place these weights are reused.`
                  : `Block theta ${i + 1} of ${DEPTH}, with its own weights. Activate to highlight it.`
              }
              onClick={() => press(i)}
              onKeyDown={(e) => onKey(e, i)}
              className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-[var(--accent)] [&:focus-visible>rect]:stroke-[2.5]"
            >
              <rect
                x={x} y={BOX_Y} width={BOX_W} height={BOX_H} rx={5}
                fill={lit ? "var(--accent-soft)" : "#ffffff"}
                stroke={lit ? "var(--accent)" : "#d6d3d1"}
                strokeWidth={lit ? 1.8 : 1.1}
              />
              <text
                x={x + BOX_W / 2} y={BOX_Y + 22} textAnchor="middle"
                className="pointer-events-none font-mono text-[13px]"
                fill={lit ? "var(--accent)" : "#44403c"}
              >
                {labels[i]}
              </text>
            </g>
          </g>
        );
      })}
      <line
        x1={boxX(DEPTH - 1) + BOX_W} y1={BOX_Y + BOX_H / 2}
        x2={WIDTH - 14} y2={BOX_Y + BOX_H / 2}
        className="stroke-stone-400" markerEnd={`url(#ur-${side})`}
      />
      <text x={WIDTH - 10} y={BOX_Y + 21}
            className="fill-stone-500 font-mono text-[11px]">y</text>

      {/* the weight sets themselves */}
      {looped ? (
        <g
          tabIndex={0}
          role="button"
          aria-pressed={chipLit}
          aria-label={`One weight set, ${BLOCK.toLocaleString()} weights, reused at all ${DEPTH} depths. Activate to highlight every place it is used.`}
          onClick={() => press(0)}
          onKeyDown={(e) => onKey(e, 0)}
          className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-[var(--accent)] [&:focus-visible>rect]:stroke-[2.5]"
        >
          <rect
            x={WIDTH / 2 - 30} y={CHIP_Y} width={60} height={CHIP_H} rx={5}
            fill={chipLit ? "var(--accent)" : "#fafaf9"}
            stroke={chipLit ? "var(--accent)" : "#d6d3d1"}
          />
          <text
            x={WIDTH / 2} y={CHIP_Y + 16} textAnchor="middle"
            className="pointer-events-none font-mono text-[12px]"
            fill={chipLit ? "#ffffff" : "#44403c"}
          >
            θ
          </text>
        </g>
      ) : (
        Array.from({ length: DEPTH }, (_, i) => {
          const lit = selected === i;
          return (
            <g
              key={i}
              tabIndex={0}
              role="button"
              aria-pressed={lit}
              aria-label={`Weight set theta ${i + 1}, ${BLOCK.toLocaleString()} weights, used once.`}
              onClick={() => press(i)}
              onKeyDown={(e) => onKey(e, i)}
              className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-[var(--accent)] [&:focus-visible>rect]:stroke-[2.5]"
            >
              <rect
                x={boxX(i)} y={CHIP_Y} width={BOX_W} height={CHIP_H} rx={5}
                fill={lit ? "var(--accent)" : "#fafaf9"}
                stroke={lit ? "var(--accent)" : "#d6d3d1"}
              />
              <text
                x={boxX(i) + BOX_W / 2} y={CHIP_Y + 16} textAnchor="middle"
                className="pointer-events-none font-mono text-[11px]"
                fill={lit ? "#ffffff" : "#44403c"}
              >
                {`θ${["₁", "₂", "₃", "₄"][i]}`}
              </text>
            </g>
          );
        })
      )}
      <text
        x={WIDTH / 2} y={132} textAnchor="middle"
        className="text-[9px]"
        fill={chipLit ? "var(--accent)" : "#a8a29e"}
      >
        {looped
          ? `one weight set, used ${DEPTH} times`
          : `${DEPTH} weight sets, each used once`}
      </text>
    </svg>
  );
}

export function UnrollTheLoop() {
  const [selected, setSelected] = useState<{ side: Side; index: number } | null>(
    null,
  );
  const pick = (side: Side) => (i: number | null) =>
    setSelected(i === null ? null : { side, index: i });

  return (
    <Figure
      label="Figure 2 · interactive"
      title="Unroll the loop"
      note={`depth 4 · ${BLOCK.toLocaleString()} weights per block`}
      caption={
        <>
          <strong className="font-medium text-stone-700">
            Figure 2. The same depth, bought two ways.
          </strong>{" "}
          Click a θ. On the left every box lights up at once, because they are
          the same numbers read four times; on the right only one box lights up.
          Both diagrams run four blocks deep, but the looped model stores{" "}
          {LOOPED_TOTAL.toLocaleString()} weights and the stack stores{" "}
          {STACKED_TOTAL.toLocaleString()}.
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {(["looped", "stacked"] as Side[]).map((side) => {
          const active = selected?.side === side;
          return (
            <div
              key={side}
              className={`rounded-lg border p-3 transition-colors ${
                active ? "border-accent/40 bg-accent-soft/40" : "border-stone-200 bg-stone-50/50"
              }`}
            >
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <h4 className="text-[11px] font-semibold tracking-[0.1em] text-stone-500 uppercase">
                  {side === "looped" ? "Looped · T = 4" : "Stacked · L = 4"}
                </h4>
                <span className="font-mono text-[11px] text-stone-400">
                  {(side === "looped" ? LOOPED_TOTAL : STACKED_TOTAL).toLocaleString()} weights
                </span>
              </div>
              <Diagram
                side={side}
                selected={active ? selected!.index : null}
                onSelect={pick(side)}
              />
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-stone-500" aria-live="polite">
        {selected === null ? (
          <>
            Click any θ to see which boxes share it. Both sides also carry{" "}
            {SHARED.toLocaleString()} weights that sit outside the block — the
            embedding table, the positions and the output head — so the saving is
            on the block alone.
          </>
        ) : selected.side === "looped" ? (
          <>
            One weight set, {BLOCK.toLocaleString()} weights, read at depth 1, 2, 3
            and 4. Running it a fifth time costs no new parameters at all — only a
            fifth pass of arithmetic.
          </>
        ) : (
          <>
            θ<sub>{selected.index + 1}</sub> is used at depth {selected.index + 1} and
            nowhere else. Going one layer deeper means {BLOCK.toLocaleString()} more
            weights to store and to train.
          </>
        )}
      </p>
    </Figure>
  );
}
