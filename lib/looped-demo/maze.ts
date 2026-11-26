// A breadth-first search on a small grid, run one round per "loop".
//
// This is an algorithmic simulation, not a transformer: it reproduces the
// update rule that the LoopedWSP maze transformer performs in weights, so the
// figure can show what one loop of such a model accomplishes. The wave starts
// at the goal, exactly as in the paper, and each round it spreads one cell
// further; every visited cell points at a neighbour one step closer to the goal.

// Written out explicitly so the layout is readable in source.
export const MAZE: string[] = [
  "#########",
  "#S...#..#",
  "###.##.##",
  "#.......#",
  "#.#####.#",
  "#.G......".slice(0, 8) + "#",
  "#########",
];

export const ROWS = MAZE.length;
export const COLS = MAZE[0].length;

/** The cell the figure asks the reader about. */
export const FOCUS = { r: 3, c: 3 };
/** The wall the "Block this corridor" experiment adds. */
export const BLOCKABLE = { r: 4, c: 1 };

export type Dir = 0 | 1 | 2 | 3;
/** The paper's fixed tie-break order: down, left, right, up. */
export const DIRS: { d: Dir; dr: number; dc: number; name: string; arrow: string }[] = [
  { d: 0, dr: 1, dc: 0, name: "down", arrow: "↓" },
  { d: 1, dr: 0, dc: -1, name: "left", arrow: "←" },
  { d: 2, dr: 0, dc: 1, name: "right", arrow: "→" },
  { d: 3, dr: -1, dc: 0, name: "up", arrow: "↑" },
];

export type Search = {
  /** Distance from the goal, or -1 for a wall or an unreachable cell. */
  dist: number[][];
  /** Direction each visited cell points, one step closer to the goal. */
  pointer: (Dir | null)[][];
  start: { r: number; c: number };
  goal: { r: number; c: number };
  /** Loops needed for the wave to reach the start cell. */
  loopsToStart: number;
  /** Largest finite distance in the grid. */
  maxDist: number;
};

function isWall(r: number, c: number, blocked: boolean): boolean {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return true;
  if (blocked && r === BLOCKABLE.r && c === BLOCKABLE.c) return true;
  return MAZE[r][c] === "#";
}

export function runSearch(blocked: boolean): Search {
  let start = { r: 1, c: 1 };
  let goal = { r: 5, c: 2 };
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      if (MAZE[r][c] === "S") start = { r, c };
      if (MAZE[r][c] === "G") goal = { r, c };
    }
  }
  const dist = Array.from({ length: ROWS }, () => Array<number>(COLS).fill(-1));
  dist[goal.r][goal.c] = 0;
  let frontier = [goal];
  let maxDist = 0;
  while (frontier.length > 0) {
    const next: { r: number; c: number }[] = [];
    for (const cell of frontier) {
      for (const { dr, dc } of DIRS) {
        const r = cell.r + dr;
        const c = cell.c + dc;
        if (isWall(r, c, blocked) || dist[r][c] !== -1) continue;
        dist[r][c] = dist[cell.r][cell.c] + 1;
        maxDist = Math.max(maxDist, dist[r][c]);
        next.push({ r, c });
      }
    }
    frontier = next;
  }

  // Each visited cell points at the first neighbour, in the fixed order, whose
  // distance is one less than its own.
  const pointer = Array.from({ length: ROWS }, () =>
    Array<Dir | null>(COLS).fill(null),
  );
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      if (dist[r][c] <= 0) continue;
      for (const { d, dr, dc } of DIRS) {
        const nr = r + dr;
        const nc = c + dc;
        if (isWall(nr, nc, blocked)) continue;
        if (dist[nr][nc] === dist[r][c] - 1) {
          pointer[r][c] = d;
          break;
        }
      }
    }
  }

  return {
    dist, pointer, start, goal,
    loopsToStart: dist[start.r][start.c],
    maxDist,
  };
}

export type CellState = {
  r: number;
  c: number;
  wall: boolean;
  isStart: boolean;
  isGoal: boolean;
  /** Distance once the wave has arrived, else null. */
  count: number | null;
  pointer: Dir | null;
  /** True on the loop the wave arrived. */
  justArrived: boolean;
};

/** The grid as it stands after `loop` rounds. */
export function snapshot(search: Search, loop: number, blocked: boolean): CellState[][] {
  return Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => {
      const wall = isWall(r, c, blocked);
      const d = search.dist[r][c];
      const visited = d >= 0 && d <= loop;
      return {
        r, c, wall,
        isStart: MAZE[r][c] === "S",
        isGoal: MAZE[r][c] === "G",
        count: visited ? d : null,
        pointer: visited ? search.pointer[r][c] : null,
        justArrived: visited && d === loop && d > 0,
      };
    }),
  );
}

export type NeighbourInfo = {
  d: Dir;
  name: string;
  arrow: string;
  r: number;
  c: number;
  wall: boolean;
  /** Distance at the loop being asked about, or null if not yet reached. */
  countAtLoop: number | null;
  /** True when this is the neighbour that hands the focus cell its route. */
  isAnswer: boolean;
};

/** The focus cell's neighbours as they stand after `loop` rounds. */
export function neighbours(
  search: Search, loop: number, blocked: boolean,
  cell = FOCUS,
): NeighbourInfo[] {
  const own = search.dist[cell.r][cell.c];
  return DIRS.map(({ d, dr, dc, name, arrow }) => {
    const r = cell.r + dr;
    const c = cell.c + dc;
    const wall = isWall(r, c, blocked);
    const dd = wall ? -1 : search.dist[r][c];
    const reached = dd >= 0 && dd <= loop;
    return {
      d, name, arrow, r, c, wall,
      countAtLoop: reached ? dd : null,
      isAnswer: !wall && own > 0 && dd === own - 1,
    };
  });
}
