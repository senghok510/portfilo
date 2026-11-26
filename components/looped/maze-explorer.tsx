"use client";

import { useMemo, useState } from "react";
import {
  BLOCKABLE, COLS, DIRS, FOCUS, MAZE, ROWS, neighbours, runSearch, snapshot,
  type Dir,
} from "@/lib/looped-demo/maze";
import { Counter, Figure, NowLine, Panel, Transport } from "./figure-kit";
import { usePlayer } from "./use-player";

const CELL = 36;
const W = COLS * CELL;
const H = ROWS * CELL;
const DEMO_URL = "https://mbzuai-oryx.github.io/LoopedWSP/demo/maze.html";

/** Light-to-dark shading for the distance wave, as in the paper's Figure 2. */
function waveColor(d: number, max: number): string {
  const t = max > 0 ? Math.min(1, d / max) : 0;
  const from = [239, 244, 255];
  const to = [30, 58, 138];
  const mix = (i: number) => Math.round(from[i] + (to[i] - from[i]) * t);
  return `rgb(${mix(0)},${mix(1)},${mix(2)})`;
}

export function MazeExplorer() {
  const [blocked, setBlocked] = useState(false);
  const [guess, setGuess] = useState<Dir | null>(null);

  const search = useMemo(() => runSearch(blocked), [blocked]);
  const openSearch = useMemo(() => runSearch(false), []);
  const focusDist = search.dist[FOCUS.r][FOCUS.c];
  const askLoop = Math.max(0, focusDist - 1);
  const total = search.maxDist + 1;

  // The figure opens on the loop before the wave arrives, so the question is
  // the first thing on screen.
  const player = usePlayer({ count: total, stepMs: 900, initialIndex: askLoop });

  const loop = player.index;
  const cells = useMemo(() => snapshot(search, loop, blocked), [search, loop, blocked]);
  const nbrs = useMemo(
    () => neighbours(search, askLoop, blocked),
    [search, askLoop, blocked],
  );
  const answer = nbrs.find((n) => n.isAnswer);
  const arrived = loop >= focusDist;
  const asking = loop === askLoop;
  // Until the reader commits to a guess, the buttons do not state which
  // neighbour already has a distance — that is what the grid is for.
  const revealed = arrived || guess !== null;

  const addedLoops = focusDist - openSearch.dist[FOCUS.r][FOCUS.c];

  const reset = () => {
    setGuess(null);
    setBlocked(false);
    player.seek(runSearch(false).dist[FOCUS.r][FOCUS.c] - 1);
  };

  return (
    <Figure
      label="Figure 3 · interactive"
      title="One loop of a maze search"
      note="algorithmic simulation"
      caption={
        <>
          <strong className="font-medium text-stone-700">
            Figure 3. Predict one loop, then run it.
          </strong>{" "}
          The wave of distances starts at the goal and spreads one cell per loop,
          which is exactly what one pass of the LoopedWSP maze transformer does.
          The outlined cell has no route yet. Guess which neighbour will hand it
          one, then advance a single loop and see. Then block the corridor and
          watch the same cell wait{" "}
          {Math.abs(focusDist - openSearch.dist[FOCUS.r][FOCUS.c]) || 6} loops
          longer — and get its route from the other side.
        </>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2">
        <span className="rounded border border-amber-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.1em] text-amber-800 uppercase">
          Algorithmic simulation
        </span>
        <p className="text-[12px] leading-relaxed text-amber-900">
          This grid runs a breadth-first search in JavaScript, not a transformer.
          It shows the update rule the real model performs in weights. For the
          published 19,936-weight model running in your browser, see the authors’{" "}
          <a
            href={DEMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-amber-400 underline-offset-2"
          >
            real-weight maze demo
          </a>
          .
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        {/* ------------------------------------------------------- the grid */}
        <div className="mx-auto w-full max-w-[22rem] lg:mx-0">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full"
            role="img"
            aria-label={
              `A ${ROWS} by ${COLS} maze. The wave of distances from the goal has run ` +
              `${loop} loops. The cell being asked about is at row ${FOCUS.r}, column ` +
              `${FOCUS.c} and ${arrived ? `has distance ${focusDist}` : "has no distance yet"}.`
            }
          >
            {cells.flat().map((cell) => {
              const x = cell.c * CELL;
              const y = cell.r * CELL;
              const isFocus = cell.r === FOCUS.r && cell.c === FOCUS.c;
              const isBlockable = cell.r === BLOCKABLE.r && cell.c === BLOCKABLE.c;
              const visited = cell.count !== null;
              const fill = cell.wall
                ? isBlockable && blocked
                  ? "#b45309"
                  : "#44403c"
                : visited
                  ? waveColor(cell.count!, search.maxDist)
                  : "#fafaf9";
              const deep = visited && cell.count! / Math.max(1, search.maxDist) > 0.45;
              return (
                <g key={`${cell.r}-${cell.c}`}>
                  <rect
                    x={x + 1} y={y + 1} width={CELL - 2} height={CELL - 2} rx={3}
                    fill={fill}
                    stroke={cell.wall ? "transparent" : "#e7e5e4"}
                  />
                  {cell.isGoal ? (
                    <text x={x + CELL / 2} y={y + CELL / 2 + 5} textAnchor="middle"
                          className="font-mono text-[13px] font-bold"
                          fill={deep ? "#ffffff" : "#1c1917"}>G</text>
                  ) : cell.isStart ? (
                    <text x={x + CELL / 2} y={y + CELL / 2 + 5} textAnchor="middle"
                          className="font-mono text-[13px] font-bold"
                          fill={deep ? "#ffffff" : "#1c1917"}>S</text>
                  ) : visited ? (
                    <text x={x + CELL / 2} y={y + CELL / 2 + 4} textAnchor="middle"
                          className="font-mono text-[11px]"
                          fill={deep ? "#ffffff" : "#1c1917"}>{cell.count}</text>
                  ) : null}
                  {cell.pointer !== null ? (
                    <text x={x + CELL - 5} y={y + CELL - 4} textAnchor="end"
                          className="font-mono text-[9px]"
                          fill={deep ? "#bfdbfe" : "#78716c"}>
                      {DIRS[cell.pointer].arrow}
                    </text>
                  ) : null}
                  {cell.justArrived ? (
                    <rect x={x + 1} y={y + 1} width={CELL - 2} height={CELL - 2} rx={3}
                          fill="none" stroke="#f59e0b" strokeWidth={2} />
                  ) : null}
                  {isFocus ? (
                    <rect x={x + 0.5} y={y + 0.5} width={CELL - 1} height={CELL - 1} rx={4}
                          fill="none" stroke="var(--accent)" strokeWidth={2.5}
                          strokeDasharray={arrived ? undefined : "4 2"} />
                  ) : null}
                  {isBlockable && blocked ? (
                    <text x={x + CELL / 2} y={y + CELL / 2 + 4} textAnchor="middle"
                          className="text-[11px]" fill="#ffffff">✕</text>
                  ) : null}
                </g>
              );
            })}
          </svg>
          <p className="mt-1.5 text-center text-[10px] text-stone-400 lg:text-left">
            Shading: near the goal is pale, far is dark. Arrows are each cell’s
            pointer one step closer to G.
          </p>
        </div>

        {/* ------------------------------------------------- the question */}
        <div className="space-y-3">
          <Panel
            title={
              arrived
                ? "The wave arrived"
                : "Which neighbour will give this cell a route to the goal?"
            }
            aside={`row ${FOCUS.r}, column ${FOCUS.c}`}
            tone={asking ? "accent" : "plain"}
          >
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {nbrs.map((n) => {
                const chosen = guess === n.d;
                const show = arrived || (guess !== null && chosen);
                const right = n.isAnswer;
                return (
                  <button
                    key={n.d}
                    type="button"
                    disabled={n.wall}
                    onClick={() => setGuess(n.d)}
                    aria-pressed={chosen}
                    className={`rounded-md border px-2 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:outline-none ${
                      n.wall
                        ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400"
                        : show && right
                          ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                          : show && chosen && !right
                            ? "border-amber-500 bg-amber-50 text-amber-900"
                            : chosen
                              ? "border-accent bg-accent-soft text-accent"
                              : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
                    }`}
                  >
                    <span className="block font-mono text-[13px]">
                      {n.arrow} {n.name}
                    </span>
                    <span className="block text-[10px]">
                      {n.wall
                        ? "wall"
                        : !revealed
                          ? "\u00a0"
                          : n.countAtLoop !== null
                            ? `has ${n.countAtLoop}`
                            : "no route yet"}
                    </span>
                  </button>
                );
              })}
            </div>

            {guess === null && !arrived ? (
              <p className="mt-2 text-[12px] leading-relaxed text-stone-500">
                Read the grid first: a cell can only take a route from a neighbour
                that already holds a number. Pick one, then press Next to run a
                single loop.
              </p>
            ) : null}

            {guess !== null && !arrived ? (
              <p className="mt-2 text-[12px] text-stone-600">
                You picked <strong>{DIRS[guess].name}</strong>. Press Next to run
                one loop and find out.
              </p>
            ) : null}

            {arrived ? (
              <p className="mt-2 text-[12px] leading-relaxed text-stone-700" aria-live="polite">
                {guess !== null ? (
                  <strong className={guess === answer?.d ? "text-emerald-700" : "text-amber-700"}>
                    {guess === answer?.d ? "Right. " : `Not quite — it was ${answer?.name}. `}
                  </strong>
                ) : null}
                Only <strong>{answer?.name}</strong> had a distance at loop {askLoop}:{" "}
                {answer?.countAtLoop}. A cell can only take a route from a neighbour
                that already has one, so at loop {focusDist} this cell copied{" "}
                {answer?.countAtLoop} and added one, giving {focusDist}, and set its
                pointer {DIRS[answer?.d ?? 0].arrow} {answer?.name}. The other open
                neighbours still had nothing to give.
              </p>
            ) : null}
          </Panel>

          <Panel title="This cell, before and after" aside={`loop ${askLoop} → ${focusDist}`}>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <div className="rounded border border-stone-200 bg-white p-2">
                <div className="mb-1 font-mono text-[10px] text-stone-400">
                  after loop {askLoop}
                </div>
                <dl className="space-y-0.5 text-stone-600">
                  <div className="flex justify-between gap-2">
                    <dt>count</dt>
                    <dd className="font-mono text-stone-900">none</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>pointer</dt>
                    <dd className="font-mono text-stone-900">none</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>on a route</dt>
                    <dd className="font-mono text-stone-900">no</dd>
                  </div>
                </dl>
              </div>
              <div
                className={`rounded border p-2 ${
                  arrived ? "border-accent/40 bg-accent-soft" : "border-dashed border-stone-200 bg-stone-50"
                }`}
              >
                <div className="mb-1 font-mono text-[10px] text-stone-400">
                  after loop {focusDist}
                </div>
                <dl className="space-y-0.5 text-stone-600">
                  <div className="flex justify-between gap-2">
                    <dt>count</dt>
                    <dd className="font-mono font-semibold text-stone-900">
                      {arrived ? focusDist : "?"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>pointer</dt>
                    <dd className="font-mono font-semibold text-stone-900">
                      {arrived ? `${DIRS[answer?.d ?? 0].arrow} ${answer?.name}` : "?"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>on a route</dt>
                    <dd className="font-mono font-semibold text-stone-900">
                      {arrived ? "yes" : "?"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-stone-500">
              Nothing else about the cell changes, and no weights change. One loop
              writes three numbers.
            </p>
          </Panel>
        </div>
      </div>

      <Transport
        player={player}
        count={total}
        marks={[
          { at: askLoop, label: "ask" },
          { at: focusDist, label: "arrives" },
          { at: search.loopsToStart, label: "reaches S" },
        ]}
        stepLabel={`loop ${loop} of ${search.maxDist}`}
      >
        <span className="ml-auto flex flex-wrap items-center gap-1.5">
          <Counter label="loop" value={`${loop} / ${search.maxDist}`} tone="accent" />
          <Counter label="reaches S at" value={search.loopsToStart} />
        </span>
      </Transport>

      <NowLine step={`Loop ${loop}`} tone={blocked ? "accent" : "plain"}>
        {blocked ? (
          <>
            The corridor is blocked, so the wave has to come the long way round.
            The outlined cell now waits until loop <strong>{focusDist}</strong>{" "}
            instead of loop {openSearch.dist[FOCUS.r][FOCUS.c]} —{" "}
            <strong>{addedLoops} extra loops</strong> — and it takes its route from
            the <strong>{answer?.name}</strong> now, not the{" "}
            {neighbours(openSearch, openSearch.dist[FOCUS.r][FOCUS.c] - 1, false)
              .find((n) => n.isAnswer)?.name}
            . The start cell waits until loop {search.loopsToStart} instead of{" "}
            {openSearch.loopsToStart}. The weights did not change; the model just
            runs longer.
          </>
        ) : (
          <>
            {loop === 0
              ? "Only the goal has a distance. Everything else is blank."
              : `The wave has spread ${loop} cell${loop === 1 ? "" : "s"} from the goal. ` +
                `Every cell it has touched holds its distance and a pointer one step closer to G.`}{" "}
            The whole maze is solved once the wave reaches S, at loop{" "}
            {search.loopsToStart} — that is {search.loopsToStart} passes of one
            block, not {search.loopsToStart} layers.
          </>
        )}
      </NowLine>

      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-stone-200 bg-white p-3">
        <span className="text-[11px] font-semibold tracking-[0.1em] text-stone-500 uppercase">
          Try it
        </span>
        <button
          type="button"
          onClick={() => {
            const nextBlocked = !blocked;
            setBlocked(nextBlocked);
            setGuess(null);
            // Re-open on the question for the maze as it now stands.
            player.seek(runSearch(nextBlocked).dist[FOCUS.r][FOCUS.c] - 1);
          }}
          className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-[12px] font-medium text-stone-700 transition-colors hover:border-stone-400 hover:text-stone-900 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:outline-none"
        >
          {blocked ? "Open the corridor again" : "Block this corridor"}
        </button>
        {blocked ? (
          <span className="rounded-md border border-accent/30 bg-accent-soft px-2 py-1 font-mono text-[11px] text-accent">
            +{addedLoops} loops to reach the outlined cell ({openSearch.dist[FOCUS.r][FOCUS.c]} → {focusDist})
          </span>
        ) : (
          <span className="text-[12px] text-stone-500">
            Walls the corridor at row {BLOCKABLE.r}, column {BLOCKABLE.c}. A longer
            way round stays open.
          </span>
        )}
        <button
          type="button"
          onClick={reset}
          className="ml-auto rounded-md px-2 py-1.5 text-[12px] text-stone-500 underline underline-offset-2 hover:text-stone-900"
        >
          Reset the figure
        </button>
      </div>
      <p className="sr-only">
        The maze layout, row by row: {MAZE.join("; ")}. A hash is a wall, S the
        start, G the goal.
      </p>
    </Figure>
  );
}
