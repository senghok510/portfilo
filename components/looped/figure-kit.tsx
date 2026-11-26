"use client";

import { useId } from "react";
import type { Player } from "./use-player";

/* ---------------------------------------------------------------- colours */

// Signed heat scale. Negative values run blue, positive amber, zero near-white.
// The exponent compresses large magnitudes so early loops stay readable on the
// same scale as late ones — the mapping is identical for every pass, which is
// what makes two strips comparable.
const NEG = [37, 99, 235] as const; // accent blue
const POS = [217, 119, 6] as const; // amber
const ZERO = [247, 246, 244] as const;
const GAMMA = 0.65;

export function valueColor(v: number, scale: number): string {
  if (!Number.isFinite(v) || scale <= 0) return `rgb(${ZERO.join(",")})`;
  const t = Math.min(1, Math.pow(Math.abs(v) / scale, GAMMA));
  const end = v < 0 ? NEG : POS;
  const mix = (i: number) => Math.round(ZERO[i] + (end[i] - ZERO[i]) * t);
  return `rgb(${mix(0)},${mix(1)},${mix(2)})`;
}

/** Text colour that stays legible on top of `valueColor(v, scale)`. */
export function valueTextColor(v: number, scale: number): string {
  const t = Math.min(1, Math.pow(Math.abs(v) / scale, GAMMA));
  return t > 0.55 ? "#ffffff" : "#44403c";
}

/** p99 of |values|, the scale shared by every strip in a figure. */
export function sharedScale(groups: ArrayLike<number>[]): number {
  const all: number[] = [];
  for (const g of groups) for (let i = 0; i < g.length; i += 1) all.push(Math.abs(g[i]));
  if (all.length === 0) return 1;
  all.sort((a, b) => a - b);
  const q = all[Math.min(all.length - 1, Math.floor(all.length * 0.99))];
  return q > 0 ? q : 1;
}

/* ------------------------------------------------------------------ shell */

export function Figure({
  label, title, children, caption, note,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
  caption: React.ReactNode;
  note?: React.ReactNode;
}) {
  return (
    <figure className="not-prose my-8">
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-stone-100 px-4 py-3 sm:px-5">
          <span className="text-[11px] font-semibold tracking-[0.12em] text-stone-400 uppercase">
            {label}
          </span>
          <span className="text-sm font-medium text-stone-900">{title}</span>
          {note ? (
            <span className="ml-auto text-[11px] text-stone-400">{note}</span>
          ) : null}
        </div>
        <div className="px-4 py-4 sm:px-5 sm:py-5">{children}</div>
      </div>
      <figcaption className="mt-3 text-sm leading-relaxed text-stone-500">
        {caption}
      </figcaption>
    </figure>
  );
}

/** A labelled band inside a figure. */
export function Panel({
  title, aside, children, tone = "plain",
}: {
  title: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
  tone?: "plain" | "accent";
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        tone === "accent"
          ? "border-accent/30 bg-accent-soft"
          : "border-stone-200 bg-stone-50/60"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <h4 className="text-[11px] font-semibold tracking-[0.1em] text-stone-500 uppercase">
          {title}
        </h4>
        {aside ? (
          <span className="ml-auto font-mono text-[11px] text-stone-400">{aside}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/* --------------------------------------------------------------- controls */

function Btn({
  onClick, title, children, disabled, primary, ariaLabel,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
  primary?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel ?? title}
      disabled={disabled}
      className={`inline-flex h-9 shrink-0 items-center justify-center rounded-md border text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:outline-none ${
        primary
          ? "min-w-[5.5rem] gap-1.5 border-accent bg-accent px-4 text-white hover:bg-accent/90"
          : "w-9 border-stone-300 bg-white text-stone-600 hover:border-stone-400 hover:text-stone-900"
      }`}
    >
      {children}
    </button>
  );
}

export type ScrubMark = { at: number; label: string };

/**
 * Transport bar: reset, previous, play/pause, next, then a scrubber whose
 * ticks mark the loop boundaries.
 */
export function Transport({
  player, count, marks, stepLabel, children,
}: {
  player: Player;
  count: number;
  marks?: ScrubMark[];
  stepLabel: string;
  children?: React.ReactNode;
}) {
  const id = useId();
  const atEnd = player.index >= count - 1;
  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Btn onClick={player.reset} title="Back to the start"
             disabled={player.index === 0 && !player.playing}>
          <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
            <path d="M4 3v10M13 3.5v9l-7-4.5z" fill="none" stroke="currentColor"
                  strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
        </Btn>
        <Btn onClick={player.prev} title="Previous step" disabled={player.index === 0}>
          <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
            <path d="M10.5 3.5v9l-7-4.5z" fill="currentColor" />
          </svg>
        </Btn>
        <Btn onClick={player.toggle} primary
             title={player.playing ? "Pause" : atEnd ? "Play again" : "Play"}>
          {player.playing ? (
            <>
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
                <path d="M4.5 3h2.5v10H4.5zM9 3h2.5v10H9z" fill="currentColor" />
              </svg>
              Pause
            </>
          ) : (
            <>
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
                <path d="M4.5 2.5v11l9-5.5z" fill="currentColor" />
              </svg>
              {atEnd ? "Replay" : "Play"}
            </>
          )}
        </Btn>
        <Btn onClick={player.next} title="Next step" disabled={atEnd}>
          <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
            <path d="M5.5 3.5v9l7-4.5z" fill="currentColor" />
          </svg>
        </Btn>
        {children}
      </div>

      <div>
        <label htmlFor={id} className="sr-only">
          Step through the computation
        </label>
        <input
          id={id}
          type="range"
          min={0}
          max={Math.max(0, count - 1)}
          step={1}
          value={player.index}
          onChange={(e) => player.seek(Number(e.target.value))}
          aria-valuetext={stepLabel}
          className="h-6 w-full cursor-pointer accent-[var(--accent)]"
        />
        {marks && marks.length > 0 ? (
          <div className="relative mt-0.5 hidden h-4 sm:block" aria-hidden="true">
            {marks.map((m) => {
              const frac = m.at / Math.max(1, count - 1);
              // Pin the end labels inside the track instead of centring them,
              // so neither one is clipped by the figure's edge.
              const shift =
                frac < 0.06 ? "0" : frac > 0.94 ? "-100%" : "-50%";
              return (
                <span
                  key={m.at}
                  className="absolute font-mono text-[10px] whitespace-nowrap text-stone-400"
                  style={{ left: `${frac * 100}%`, transform: `translateX(${shift})` }}
                >
                  {m.label}
                </span>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** The "what just happened" line. Reads out to screen readers as it changes. */
export function NowLine({
  step, children, tone = "plain",
}: {
  step: React.ReactNode;
  children: React.ReactNode;
  tone?: "plain" | "accent";
}) {
  return (
    <div
      aria-live="polite"
      className={`mt-4 rounded-lg border-l-4 px-4 py-3 ${
        tone === "accent"
          ? "border-accent bg-accent-soft"
          : "border-stone-300 bg-stone-50"
      }`}
    >
      <div className="text-[11px] font-semibold tracking-[0.1em] text-stone-500 uppercase">
        {step}
      </div>
      <p className="mt-1 text-sm leading-relaxed text-stone-700">{children}</p>
    </div>
  );
}

/** Colour key for the signed heat scale. */
export function ScaleKey({ scale, unit = "" }: { scale: number; unit?: string }) {
  const stops = [-1, -0.5, -0.15, 0, 0.15, 0.5, 1];
  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      <span className="font-mono text-[10px] text-stone-400">
        −{scale.toFixed(1)}
        {unit}
      </span>
      <span className="inline-flex overflow-hidden rounded-sm border border-stone-200">
        {stops.map((s) => (
          <span key={s} className="block h-3 w-3.5"
                style={{ background: valueColor(s * scale, scale) }} />
        ))}
      </span>
      <span className="font-mono text-[10px] text-stone-400">
        +{scale.toFixed(1)}
        {unit}
      </span>
    </span>
  );
}

/** Small pill used for counters such as "loop 2 of 4". */
export function Counter({
  label, value, tone = "plain",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "plain" | "accent";
}) {
  return (
    <span
      className={`inline-flex items-baseline gap-1.5 rounded-md border px-2 py-1 text-[11px] ${
        tone === "accent"
          ? "border-accent/30 bg-accent-soft text-accent"
          : "border-stone-200 bg-white text-stone-500"
      }`}
    >
      <span className="tracking-[0.08em] uppercase">{label}</span>
      <span className="font-mono text-xs font-medium text-stone-900">{value}</span>
    </span>
  );
}
