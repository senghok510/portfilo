"use client";

import { motion } from "motion/react";
import { config } from "@/lib/looped-demo/model";
import type { Stage } from "@/lib/looped-demo/scene";
import { valueColor } from "@/components/figures/figure-kit";

const D = config.dModel;
const ACCENT = "#2563eb";
const ACCENT_SOFT = "#eff4ff";
const FADE = { duration: 0.32, ease: "easeInOut" } as const;

// The feedback arrow, as a cubic Bézier evaluated in JS so the travelling
// packet can be placed exactly on it without measuring the DOM.
const P0 = { x: 275, y: 143 };
const P1 = { x: 275, y: 188 };
const P2 = { x: 139, y: 188 };
const P3 = { x: 139, y: 131 };

const REST = { x: 36, y: 112 };

function bezier(t: number) {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * P0.x + b * P1.x + c * P2.x + d * P3.x,
    y: a * P0.y + b * P1.y + c * P2.y + d * P3.y,
  };
}

const PACKET_W = 46;
const PACKET_H = 13;

/**
 * The "vector in transit". It glides between the stages of the block, but
 * follows the feedback curve exactly, frame by frame, while the state is
 * travelling back round — so the arrow is traced rather than approximated.
 */
function Packet({
  values, scale, x, y, visible, tracking,
}: {
  values: Float64Array;
  scale: number;
  x: number;
  y: number;
  visible: boolean;
  tracking: boolean;
}) {
  const cw = PACKET_W / D;
  return (
    <motion.g
      initial={false}
      animate={{ x: x - PACKET_W / 2, y: y - PACKET_H / 2, opacity: visible ? 1 : 0 }}
      transition={
        tracking
          ? { duration: 0 }
          : { type: "spring", stiffness: 210, damping: 26, opacity: { duration: 0.25 } }
      }
    >
      <rect x={-1.5} y={-1.5} width={PACKET_W + 3} height={PACKET_H + 3} rx={3}
            fill="#ffffff" stroke="var(--accent)" strokeWidth={1.2} />
      {Array.from({ length: D }, (_, i) => (
        <rect key={i} x={i * cw} y={0} width={cw + 0.35} height={PACKET_H}
              fill={valueColor(values[i], scale)} />
      ))}
    </motion.g>
  );
}

export type LoopDiagramProps = {
  stage: Stage;
  loop: number;
  loops: number;
  /** 0 → 1 progress through the current step. */
  phase: number;
  /** The followed token's vector, drawn as the packet in transit. */
  packet: Float64Array;
  packetScale: number;
  reducedMotion: boolean;
};

export function LoopDiagram({
  stage, loop, loops, phase, packet, packetScale, reducedMotion,
}: LoopDiagramProps) {
  const inAttn = stage === "attend";
  const inFF = stage === "ff";
  const inBlock = inAttn || inFF;
  const returning = stage === "return";
  const emitted = stage === "readout" || stage === "emit";

  // Where the packet sits right now. REST is only used to park it, invisibly,
  // before the vectors exist.
  let pk: { x: number; y: number } | null = null;
  if (returning) {
    const t = reducedMotion ? 0.5 : phase;
    pk = bezier(t);
  } else if (inAttn) {
    pk = { x: 235, y: 116 };
  } else if (inFF) {
    pk = { x: 315, y: 116 };
  } else if (emitted) {
    pk = { x: 404, y: 112 };
  } else if (stage === "embed") {
    // On the arrow between e and the plus sign, rather than on top of the box.
    pk = { x: 88, y: 112 };
  }

  const ink = "stroke-stone-400";
  return (
    <svg
      viewBox="0 66 460 140"
      className="h-auto w-full"
      style={{ minWidth: 420 }}
      role="img"
      aria-label={
        `The looped block. The embedded input e enters at a plus sign, the sum goes ` +
        `through one shared block with an attention stage and a feed-forward stage, and ` +
        `the result travels back along a feedback arrow into the same block. ` +
        `Currently at loop ${loop || 1} of ${loops}, stage ${stage}.`
      }
    >
      <defs>
        <marker id="ld-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="fill-stone-400" />
        </marker>
        <marker id="ld-arrow-accent" viewBox="0 0 10 10" refX="9" refY="5"
                markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
        </marker>
      </defs>

      {/* the embedded input, held to one side and never recomputed */}
      <rect x="14" y="96" width="44" height="32" rx="5"
            className="fill-stone-50 stroke-stone-300" />
      <text x="36" y="117" textAnchor="middle"
            className="fill-stone-700 font-mono text-[13px]">e</text>
      <text x="36" y="146" textAnchor="middle"
            className="fill-stone-400 text-[10px]">the input</text>
      <line x1="58" y1="112" x2="117" y2="112" className={ink}
            markerEnd="url(#ld-arrow)" />

      {/* input injection */}
      <motion.circle cx="139" cy="112" r="16" strokeWidth="1.2"
              initial={false}
              animate={{ fill: returning ? ACCENT_SOFT : "#fafaf9",
                         stroke: returning ? ACCENT : "#d6d3d1",
                         scale: returning ? 1.08 : 1 }}
              style={{ originX: "139px", originY: "112px" }}
              transition={FADE} />
      <text x="139" y="117" textAnchor="middle"
            className="fill-stone-600 text-[14px]">+</text>
      <text x="139" y="80" textAnchor="middle"
            className="fill-stone-400 text-[10px]">input injection</text>
      <line x1="155" y1="112" x2="186" y2="112" className={ink}
            markerEnd="url(#ld-arrow)" />

      {/* the one shared block */}
      <motion.rect x="190" y="84" width="170" height="59" rx="7"
            stroke="var(--accent)"
            initial={false}
            animate={{ fill: inBlock ? ACCENT_SOFT : "#ffffff",
                       strokeWidth: inBlock ? 1.6 : 1.1 }}
            transition={FADE} />
      <motion.rect x="199" y="91" width="72" height="34" rx="4"
            initial={false}
            animate={{ fill: inAttn ? ACCENT : "#ffffff",
                       stroke: inAttn ? ACCENT : "#d6d3d1" }}
            transition={FADE} />
      <motion.text x="235" y="102" textAnchor="middle" className="text-[10.5px]"
            initial={false}
            animate={{ fill: inAttn ? "#ffffff" : "#78716c" }}
            transition={FADE}>attention</motion.text>
      <motion.rect x="279" y="91" width="72" height="34" rx="4"
            initial={false}
            animate={{ fill: inFF ? ACCENT : "#ffffff",
                       stroke: inFF ? ACCENT : "#d6d3d1" }}
            transition={FADE} />
      <motion.text x="315" y="102" textAnchor="middle" className="text-[10.5px]"
            initial={false}
            animate={{ fill: inFF ? "#ffffff" : "#78716c" }}
            transition={FADE}>feed-forward</motion.text>
      <text x="275" y="137" textAnchor="middle" className="text-[11.5px] font-medium"
            fill="var(--accent)">one shared block θ</text>

      {/* feedback: the same weights, entered again */}
      <motion.path
        d={`M ${P0.x} ${P0.y} C ${P1.x} ${P1.y} ${P2.x} ${P2.y} ${P3.x} ${P3.y}`}
        fill="none"
        strokeDasharray="4 3"
        initial={false}
        animate={{ stroke: returning ? ACCENT : "#d6d3d1",
                   strokeWidth: returning ? 1.8 : 1.2 }}
        transition={FADE}
        markerEnd={returning ? "url(#ld-arrow-accent)" : "url(#ld-arrow)"}
      />
      <text x="207" y="203" textAnchor="middle"
            className="text-[10px]"
            fill={returning ? "var(--accent)" : "#a8a29e"}>
        h goes back into the same θ
      </text>

      {/* readout */}
      <line x1="360" y1="112" x2="392" y2="112"
            className={emitted ? "stroke-[var(--accent)]" : ink}
            markerEnd={emitted ? "url(#ld-arrow-accent)" : "url(#ld-arrow)"} />
      <text x="430" y="117" textAnchor="middle"
            className="fill-stone-600 font-mono text-[12px]">
        {emitted ? "logits" : "h"}
      </text>

      {/* loop counter rides on the feedback arrow */}
      <g transform="translate(207 170)">
        <rect x="-30" y="-9" width="60" height="18" rx="9"
              fill="#ffffff" stroke={returning ? "var(--accent)" : "#e7e5e4"} />
        <text x="0" y="4" textAnchor="middle"
              className="fill-stone-500 font-mono text-[10px]">
          loop {Math.max(1, loop)}/{loops}
        </text>
      </g>

      <Packet
        values={packet}
        scale={packetScale}
        x={(pk ?? REST).x}
        y={(pk ?? REST).y}
        visible={pk !== null}
        tracking={returning}
      />
    </svg>
  );
}
