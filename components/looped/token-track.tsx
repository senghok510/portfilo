"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { config } from "@/lib/looped-demo/model";
import type { AttentionEdge } from "@/lib/looped-demo/scene";
import type { Token } from "@/lib/looped-demo/tokenizer";
import { valueColor } from "@/components/figures/figure-kit";

const ARC_BAND = 46; // headroom above the chips for the attention arcs
const STRIP_H = 15;
const D = config.dModel;

/**
 * The 32 values of one token, drawn small enough to read as a signature. The
 * strip stretches to whatever width the chip ends up with, so its size is never
 * fed back into the measured layout.
 */
function MiniStrip({
  values, offset, scale,
}: {
  values: Float64Array;
  offset: number;
  scale: number;
}) {
  return (
    <svg
      viewBox={`0 0 ${D} 10`}
      preserveAspectRatio="none"
      className="block w-full"
      style={{ height: STRIP_H }}
      aria-hidden="true"
    >
      {Array.from({ length: D }, (_, i) => (
        <rect
          key={i}
          x={i}
          y={0}
          width={1.02}
          height={10}
          fill={valueColor(values[offset + i], scale)}
        />
      ))}
    </svg>
  );
}

export type TokenTrackProps = {
  tokens: Token[];
  /** Query position being followed. */
  position: number;
  onSelect: (position: number) => void;
  /** Attention of the followed position, when the attention stage is showing. */
  edges: AttentionEdge[] | null;
  peek: number | null;
  onPeek: (position: number | null) => void;
  strip: { values: Float64Array; scale: number } | null;
  /** How many trailing tokens the model generated. */
  generated: number;
  /** Position whose vector is travelling the feedback arrow, for emphasis. */
  highlightReturn: boolean;
};

export function TokenTrack({
  tokens, position, onSelect, edges, peek, onPeek, strip, generated,
  highlightReturn,
}: TokenTrackProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Horizontal centre of each chip, for the attention arcs only.
  const [geom, setGeom] = useState<number[]>([]);
  const [trackW, setTrackW] = useState(0);
  const [overflowing, setOverflowing] = useState(false);
  // Which chip the keyboard is on. A ref, not state: moving it only moves DOM
  // focus, and the tab stop itself is always the followed token.
  const focusRef = useRef(position);
  const hasStrip = strip !== null;

  const weightOf = useCallback(
    (i: number) => edges?.find((e) => e.position === i)?.weight ?? 0,
    [edges],
  );

  // Measure chip positions so the arcs can be drawn over them.
  useLayoutEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      const next = tokens.map((_, i) => {
        const el = chipRefs.current[i];
        return el ? el.offsetLeft + el.offsetWidth / 2 : 0;
      });
      setGeom(next);
      setTrackW(track.scrollWidth);
      const sc = scrollRef.current;
      if (sc) setOverflowing(sc.scrollWidth > sc.clientWidth + 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    const onFonts = () => measure();
    document.fonts?.ready?.then(onFonts).catch(() => {});
    return () => ro.disconnect();
  }, [tokens, hasStrip]);

  // Keep the followed token in view without scrolling the page.
  useEffect(() => {
    const el = chipRefs.current[position];
    const sc = scrollRef.current;
    if (!el || !sc) return;
    const left = el.offsetLeft;
    const right = left + el.offsetWidth;
    if (left < sc.scrollLeft) sc.scrollLeft = Math.max(0, left - 16);
    else if (right > sc.scrollLeft + sc.clientWidth) {
      sc.scrollLeft = right - sc.clientWidth + 16;
    }
  }, [position, tokens.length]);

  const activate = (i: number) => {
    if (edges && i < position) onPeek(peek === i ? null : i);
    else {
      onPeek(null);
      onSelect(i);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const from = focusRef.current;
    let next = from;
    if (e.key === "ArrowRight") next = Math.min(tokens.length - 1, from + 1);
    else if (e.key === "ArrowLeft") next = Math.max(0, from - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tokens.length - 1;
    else return;
    e.preventDefault();
    focusRef.current = next;
    chipRefs.current[next]?.focus();
  };

  const arcs = edges
    ? edges
        .filter((e) => e.weight >= 0.02 && e.position !== position && geom[e.position] !== undefined)
        .slice(0, 6)
    : [];
  const qx = geom[position] ?? 0;

  return (
    <div>
      <div className="relative">
        <div
          ref={scrollRef}
          className="-mx-1 overflow-x-auto px-1 pb-1"
          style={{ scrollbarWidth: "thin" }}
        >
          <div ref={trackRef} className="relative w-max">
          <svg
            width={Math.max(trackW, 1)}
            height={ARC_BAND}
            viewBox={`0 0 ${Math.max(trackW, 1)} ${ARC_BAND}`}
            className="pointer-events-none absolute top-0 left-0 block"
            aria-hidden="true"
          >
            {arcs.map((e) => {
              const sx = geom[e.position];
              const span = Math.abs(qx - sx);
              const lift = Math.min(ARC_BAND - 6, 12 + span * 0.3);
              const peeked = peek === e.position;
              return (
                <motion.path
                  // Keyed by position alone, so an arc that survives from one
                  // loop to the next thickens in place as its weight grows,
                  // instead of being thrown away and redrawn.
                  key={e.position}
                  d={`M ${sx} ${ARC_BAND - 2} Q ${(sx + qx) / 2} ${ARC_BAND - lift} ${qx} ${ARC_BAND - 2}`}
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, strokeOpacity: 0 }}
                  animate={{
                    pathLength: 1,
                    stroke: peeked ? "#b45309" : "#2563eb",
                    strokeWidth: 0.9 + e.weight * 3.6,
                    strokeOpacity: peeked ? 0.95 : 0.2 + e.weight * 0.65,
                  }}
                  transition={{
                    pathLength: { duration: 0.45, ease: "easeOut" },
                    default: { duration: 0.35, ease: "easeInOut" },
                  }}
                />
              );
            })}
          </svg>

          <div
            className="flex items-end gap-1"
            style={{ paddingTop: ARC_BAND }}
            role="group"
            aria-label="Tokens of the sentence. Use the left and right arrow keys to move, then Enter to follow a token."
            onKeyDown={onKeyDown}
          >
            {tokens.map((t, i) => {
              const isQuery = i === position;
              const w = weightOf(i);
              // Only weights worth reading get a number; the arcs carry the rest.
              const attended = Boolean(edges) && i < position && w >= 0.05;
              const isPeek = peek === i;
              const isGenerated = i >= tokens.length - generated && generated > 0;
              const label = isQuery
                ? `${t.surface}, position ${i}, the token you are following`
                : edges && i < position
                  ? `${t.surface}, position ${i}, attention weight ${(w * 100).toFixed(1)} percent. Activate to read it.`
                  : `${t.surface}, position ${i}. Activate to follow this token.`;
              return (
                <button
                  key={`${i}-${t.start}`}
                  ref={(el) => {
                    chipRefs.current[i] = el;
                  }}
                  type="button"
                  tabIndex={i === position ? 0 : -1}
                  onClick={() => activate(i)}
                  onFocus={() => {
                    focusRef.current = i;
                  }}
                  aria-label={label}
                  aria-pressed={isQuery}
                  className={`group relative flex flex-col items-stretch rounded-md border transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:outline-none ${
                    isQuery
                      ? "border-accent bg-accent-soft"
                      : isPeek
                        ? "border-amber-500 bg-amber-50"
                        : isGenerated
                          ? "border-dashed border-stone-400 bg-white hover:border-stone-500"
                          : "border-stone-200 bg-white hover:border-stone-400"
                  } ${highlightReturn && isQuery ? "ring-2 ring-accent/40" : ""}`}
                  style={{ minWidth: 52 }}
                >
                  {/* Reserved whatever the step, so chips never change height. */}
                  <span
                    className="block h-[13px] text-center font-mono text-[9px] leading-[13px] text-stone-500"
                    aria-hidden="true"
                  >
                    {attended ? (w >= 0.1 ? w.toFixed(2) : w.toFixed(3)) : ""}
                  </span>
                  <span
                    className={`px-2 pt-0.5 pb-1 text-center font-mono text-[13px] leading-none whitespace-nowrap ${
                      isQuery ? "font-semibold text-accent" : "text-stone-800"
                    }`}
                  >
                    {t.surface}
                  </span>
                  {t.oov ? (
                    <span className="px-1 pb-0.5 text-center text-[8px] tracking-wide text-amber-700 uppercase">
                      char
                    </span>
                  ) : null}
                  {strip ? (
                    <span className="block overflow-hidden rounded-b-[4px] px-px pb-px">
                      <MiniStrip
                        values={strip.values}
                        offset={i * D}
                        scale={strip.scale}
                      />
                    </span>
                  ) : (
                    <span className="block" style={{ height: 3 }} />
                  )}
                  <span
                    className="pb-1 text-center font-mono text-[9px] text-stone-400"
                    aria-hidden="true"
                  >
                    {i}
                  </span>
                </button>
              );
            })}
            </div>
          </div>
        </div>
        {overflowing ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent"
          />
        ) : null}
      </div>
      {overflowing ? (
        <p className="mt-1 text-[11px] text-stone-400">
          The sentence is wider than the figure — scroll it sideways, or use the
          arrow keys, to reach the rest.
        </p>
      ) : null}
    </div>
  );
}
