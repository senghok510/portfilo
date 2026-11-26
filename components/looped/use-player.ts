"use client";

import { animate, useReducedMotion, type AnimationPlaybackControls } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

export type PlayerOptions = {
  /** Number of steps in the timeline. */
  count: number;
  /** Milliseconds each step is held during playback. */
  stepMs?: number;
  /** Steps held longer than the rest, so a key moment gets room to land. */
  dwellOn?: number[];
  /** How much longer those steps are held. */
  dwellFactor?: number;
  /** Where the timeline opens. */
  initialIndex?: number;
  /**
   * Start playing by itself, once, when this element first scrolls into view.
   * Honours prefers-reduced-motion: nothing auto-plays when motion is reduced.
   */
  autoPlayWhenVisible?: React.RefObject<Element | null>;
};

export type Player = {
  index: number;
  /** 0 → 1 progress through the current step; 1 whenever nothing is animating. */
  phase: number;
  playing: boolean;
  /** True until the auto-play run has been started or pre-empted. */
  autoPlayed: boolean;
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
 * Drives a step timeline with play/pause, stepping and scrubbing.
 *
 * The whole playback run lives inside one effect that depends only on
 * `playing`. Everything else it needs is read through refs, because the
 * options object is rebuilt on every parent render — if those values were
 * dependencies, the per-frame `setPhase` would restart the effect before a
 * step could ever finish, and the timeline would never advance.
 *
 * Motion's `animate` supplies the frame loop and the easing, and gives back
 * controls that stop cleanly when the effect tears down.
 */
export function usePlayer({
  count,
  stepMs = 1400,
  dwellOn = [],
  dwellFactor = 2,
  initialIndex = 0,
  autoPlayWhenVisible,
}: PlayerOptions): Player {
  const reducedMotion = useReducedMotion() ?? false;
  const [indexState, setIndexState] = useState(initialIndex);
  const [phase, setPhase] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [autoPlayed, setAutoPlayed] = useState(false);

  // Mutable mirrors of the options, refreshed every render so the playback
  // effect can read current values without taking them as dependencies.
  const indexRef = useRef(initialIndex);
  // Set as soon as the reader touches the controls, or the auto-run starts, so
  // a figure scrolled into view later never hijacks what they were doing.
  const autoSettled = useRef(false);
  const opts = useRef({ count, stepMs, dwellOn, dwellFactor, reducedMotion });
  useEffect(() => {
    opts.current = { count, stepMs, dwellOn, dwellFactor, reducedMotion };
  });

  const lastIndex = Math.max(0, count - 1);
  const index = Math.min(indexState, lastIndex);

  const commit = useCallback((i: number) => {
    indexRef.current = i;
    setIndexState(i);
  }, []);

  const takeOver = useCallback(() => {
    autoSettled.current = true;
    setAutoPlayed(true);
  }, []);

  const pause = useCallback(() => {
    takeOver();
    setPlaying(false);
  }, [takeOver]);
  const play = useCallback(() => {
    takeOver();
    const last = Math.max(0, opts.current.count - 1);
    if (indexRef.current >= last) commit(0);
    setPlaying(true);
  }, [commit, takeOver]);
  const toggle = useCallback(() => {
    if (playing) setPlaying(false);
    else play();
  }, [playing, play]);

  const step = useCallback(
    (delta: number) => {
      takeOver();
      setPlaying(false);
      setPhase(1);
      const last = Math.max(0, opts.current.count - 1);
      commit(Math.min(last, Math.max(0, indexRef.current + delta)));
    },
    [commit, takeOver],
  );
  const next = useCallback(() => step(1), [step]);
  const prev = useCallback(() => step(-1), [step]);

  const reset = useCallback(() => {
    takeOver();
    setPlaying(false);
    setPhase(1);
    commit(0);
  }, [commit, takeOver]);

  const seek = useCallback(
    (i: number) => {
      takeOver();
      setPlaying(false);
      setPhase(1);
      const last = Math.max(0, opts.current.count - 1);
      commit(Math.min(last, Math.max(0, i)));
    },
    [commit, takeOver],
  );

  // One playback run, from Play to the end of the timeline or the next pause.
  useEffect(() => {
    if (!playing) return undefined;

    let cancelled = false;
    let controls: AnimationPlaybackControls | null = null;
    let timer = 0;

    const durationOf = (i: number) => {
      const o = opts.current;
      return o.dwellOn.includes(i) ? o.stepMs * o.dwellFactor : o.stepMs;
    };

    const advance = () => {
      if (cancelled) return;
      const last = Math.max(0, opts.current.count - 1);
      const target = Math.min(indexRef.current, last) + 1;
      if (target > last) {
        setPlaying(false);
        return;
      }
      commit(target);
      runStep(target);
    };

    const runStep = (i: number) => {
      if (cancelled) return;
      const ms = durationOf(i);
      if (opts.current.reducedMotion) {
        // No tweening: hold the step, then move on.
        setPhase(1);
        timer = window.setTimeout(advance, ms);
        return;
      }
      controls = animate(0, 1, {
        duration: ms / 1000,
        ease: "easeInOut",
        onUpdate: (v) => {
          if (!cancelled) setPhase(v);
        },
        onComplete: advance,
      });
    };

    runStep(Math.min(indexRef.current, Math.max(0, opts.current.count - 1)));

    return () => {
      cancelled = true;
      controls?.stop();
      window.clearTimeout(timer);
      setPhase(1);
    };
  }, [playing, commit]);

  // Auto-play once, when the figure first comes into view. The observer
  // callback is an external subscription, so starting playback from it does
  // not cascade renders the way a bare effect would.
  const autoRef = autoPlayWhenVisible;
  useEffect(() => {
    const el = autoRef?.current;
    if (!el || reducedMotion) return undefined;
    if (typeof IntersectionObserver === "undefined") return undefined;

    const start = () => {
      if (autoSettled.current) return;
      autoSettled.current = true;
      setAutoPlayed(true);
      indexRef.current = 0;
      setIndexState(0);
      setPlaying(true);
    };

    // threshold 0: any sliver on screen is enough. These figures are often
    // taller than the viewport, so a fractional threshold can never be met.
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        start();
      },
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [autoRef, reducedMotion]);

  return {
    index,
    phase: reducedMotion || !playing ? 1 : phase,
    playing,
    autoPlayed,
    play, pause, toggle, next, prev, reset, seek, reducedMotion,
  };
}
