"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function readReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(REDUCED_QUERY).matches;
}

/** True when the reader has asked the system to minimise animation. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    readReducedMotion,
    () => false, // the server renders the un-reduced layout
  );
}

export type PlayerOptions = {
  /** Number of steps in the timeline. */
  count: number;
  /** Milliseconds each step is held during playback. */
  stepMs?: number;
  /** Step indices where playback should stop once, the first time through. */
  stopOnce?: number[];
  /** Where the timeline opens. */
  initialIndex?: number;
};

export type Player = {
  index: number;
  /** 0 → 1 progress through the current step; 1 whenever nothing is animating. */
  phase: number;
  playing: boolean;
  /** Set when playback halted itself at a `stopOnce` step. */
  haltedAt: number | null;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
  seek: (i: number) => void;
  reducedMotion: boolean;
};

/**
 * Drives a step timeline with play/pause, stepping and scrubbing. Playback
 * tweens `phase` across each step so figures can animate inside a step, and
 * collapses to discrete steps when the reader prefers reduced motion.
 */
export function usePlayer({
  count, stepMs = 1400, stopOnce = [], initialIndex = 0,
}: PlayerOptions): Player {
  const reducedMotion = useReducedMotion();
  const [rawIndex, setIndex] = useState(initialIndex);
  const [rawPhase, setPhase] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [haltedAt, setHaltedAt] = useState<number | null>(null);
  const used = useRef<Set<number>>(new Set());
  const stops = useMemo(() => new Set(stopOnce), [stopOnce]);

  // Clamped on read rather than corrected in an effect, so a timeline that
  // shrinks never renders an out-of-range step.
  const last = Math.max(0, count - 1);
  const index = Math.min(rawIndex, last);

  const pause = useCallback(() => setPlaying(false), []);
  const play = useCallback(() => {
    setHaltedAt(null);
    setIndex((i) => (Math.min(i, last) >= last ? 0 : Math.min(i, last)));
    setPlaying(true);
  }, [last]);
  const toggle = useCallback(() => {
    setPlaying((p) => {
      if (p) return false;
      setHaltedAt(null);
      setIndex((i) => (Math.min(i, last) >= last ? 0 : Math.min(i, last)));
      return true;
    });
  }, [last]);

  const step = useCallback(
    (delta: number) => {
      setPlaying(false);
      setHaltedAt(null);
      setPhase(1);
      setIndex((i) => Math.min(last, Math.max(0, Math.min(i, last) + delta)));
    },
    [last],
  );
  const next = useCallback(() => step(1), [step]);
  const prev = useCallback(() => step(-1), [step]);
  const reset = useCallback(() => {
    setPlaying(false);
    setHaltedAt(null);
    setPhase(1);
    setIndex(0);
    used.current = new Set();
  }, []);
  const seek = useCallback(
    (i: number) => {
      setPlaying(false);
      setHaltedAt(null);
      setPhase(1);
      setIndex(Math.min(last, Math.max(0, i)));
    },
    [last],
  );

  // Advancing the timeline is the one place that drives itself, so it is a
  // genuine subscription: a timer or a frame callback pushes the next step in.
  useEffect(() => {
    if (!playing) return undefined;

    const advance = () =>
      setIndex((i) => {
        const n = Math.min(i, last) + 1;
        if (n > last) {
          setPlaying(false);
          return Math.min(i, last);
        }
        if (stops.has(n) && !used.current.has(n)) {
          used.current.add(n);
          setPlaying(false);
          setHaltedAt(n);
        }
        return n;
      });

    if (reducedMotion) {
      const id = window.setTimeout(advance, stepMs);
      return () => window.clearTimeout(id);
    }

    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / stepMs);
      setPhase(p);
      if (p >= 1) {
        start = 0;
        advance();
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [playing, index, last, stepMs, reducedMotion, stops]);

  return {
    index,
    // Anything that is not mid-playback shows the step fully rendered.
    phase: reducedMotion || !playing ? 1 : rawPhase,
    playing,
    haltedAt,
    play, pause, toggle, next, prev, reset, seek, reducedMotion,
  };
}
