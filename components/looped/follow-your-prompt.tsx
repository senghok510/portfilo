"use client";

import { useCallback, useMemo, useState } from "react";
import { config, topK } from "@/lib/looped-demo/model";
import {
  attentionFor, buildScene, changedDims, embeddingAt, headSummaries, hiddenAt,
  narrate, STAGE_LABEL, stripView,
} from "@/lib/looped-demo/scene";
import { tokenize, type Token } from "@/lib/looped-demo/tokenizer";
import {
  Counter, Figure, NowLine, Panel, ScaleKey, Transport,
} from "./figure-kit";
import { LoopDiagram } from "./loop-diagram";
import { Predictions } from "./predictions";
import { TokenTrack } from "./token-track";
import { DeltaRow, HeatRow, PickedValue, TopMovers } from "./vector-view";
import { usePlayer } from "./use-player";

const DEFAULT_TEXT = "Mira put the blue key in the drawer. The key is in the";
const BLUE = /\bblue\b/i;

/** Follow the second “key” when the sentence has one, else the last token. */
function defaultPosition(tokens: Token[]): number {
  const keys = tokens
    .map((t, i) => (t.token === "key" ? i : -1))
    .filter((i) => i >= 0);
  if (keys.length >= 2) return keys[1];
  if (keys.length === 1) return keys[0];
  return Math.max(0, tokens.length - 1);
}

/**
 * Index of the readout step for a given loop count. The timeline is
 * tokenize, embed, then (attend, feed-forward, return) per loop, then readout
 * and emit — so the readout always lands at 3T + 1.
 */
function readoutStep(loops: number): number {
  return 3 * loops + 1;
}

function joinGenerated(base: string, generated: string[]): string {
  return generated.reduce(
    (acc, t) => (/^[.,?!;:']$/.test(t) ? `${acc}${t}` : `${acc} ${t}`),
    base,
  );
}

export function FollowYourPrompt() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [draft, setDraft] = useState(DEFAULT_TEXT);
  const [loops, setLoops] = useState(config.defaultLoops);
  const [head, setHead] = useState(0);
  const [generated, setGenerated] = useState<string[]>([]);
  const [position, setPosition] = useState(() =>
    defaultPosition(tokenize(DEFAULT_TEXT)),
  );
  const [peek, setPeek] = useState<number | null>(null);
  const [dim, setDim] = useState<number | null>(null);
  const [comparing, setComparing] = useState(false);

  const fullText = useMemo(() => joinGenerated(text, generated), [text, generated]);
  const scene = useMemo(
    () => buildScene(fullText, loops, generated.length),
    [fullText, loops, generated.length],
  );

  const altText = useMemo(
    () => (BLUE.test(text) ? joinGenerated(text.replace(BLUE, "red"), generated) : null),
    [text, generated],
  );
  const altScene = useMemo(
    () => (comparing && altText ? buildScene(altText, loops, generated.length) : null),
    [comparing, altText, loops, generated.length],
  );

  const player = usePlayer({
    count: scene.steps.length,
    stepMs: 1500,
    stopOnce: scene.firstReturnStep >= 0 ? [scene.firstReturnStep] : [],
  });

  // A new sentence is a new scene. Done here, on the commit, rather than in an
  // effect watching `text`: the reset belongs to the event that caused it.
  const commitText = useCallback(
    (next: string) => {
      if (next === text) return;
      setText(next);
      setGenerated([]);
      setComparing(false);
      setPeek(null);
      setDim(null);
      setPosition(defaultPosition(tokenize(next)));
      player.reset();
    },
    [text, player],
  );

  const step = scene.steps[Math.min(player.index, scene.steps.length - 1)];
  const safePos = Math.min(position, scene.tokens.length - 1);
  const strip = stripView(scene, player.index);
  const showAttention = step.stage === "attend";
  const edges = showAttention ? attentionFor(scene, step.loop, head, safePos) : null;
  const heads = useMemo(
    () => headSummaries(scene, Math.max(1, step.loop), safePos),
    [scene, step.loop, safePos],
  );

  // Vector shown as the travelling packet on the feedback arrow.
  const packetLoop =
    step.stage === "attend" ? step.loop - 1 : Math.min(step.loop, scene.loops);
  const packet = useMemo(() => {
    if (step.stage === "tokenize" || step.stage === "embed") {
      return embeddingAt(scene, safePos);
    }
    return hiddenAt(scene, Math.max(1, packetLoop), safePos);
  }, [scene, safePos, packetLoop, step.stage]);
  const packetScale =
    step.stage === "tokenize" || step.stage === "embed"
      ? scene.embedScale
      : scene.hiddenScale;

  const marks = useMemo(() => {
    const out = scene.steps
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.stage === "attend")
      .map(({ s, i }) => ({ at: i, label: `loop ${s.loop}` }));
    const readout = scene.steps.findIndex((s) => s.stage === "readout");
    if (readout >= 0) out.push({ at: readout, label: "out" });
    return out;
  }, [scene]);

  const canGenerate = scene.tokens.length < config.maxLen;
  // Appending a token does not change the number of steps, so the player can
  // jump straight to the readout of the new, longer pass.
  const generateOne = useCallback(() => {
    if (!canGenerate) return;
    const best = scene.predictions[0];
    if (!best) return;
    setGenerated((g) => [...g, best.token]);
    setPeek(null);
    player.seek(readoutStep(loops));
  }, [scene.predictions, canGenerate, player, loops]);


  const token = scene.tokens[safePos];
  const before = hiddenAt(scene, Math.max(0, packetLoop - 1), safePos);
  const after = hiddenAt(scene, Math.max(1, packetLoop), safePos);
  const altAfter = altScene
    ? hiddenAt(altScene, Math.max(1, packetLoop), Math.min(safePos, altScene.tokens.length - 1))
    : null;
  const altPredictions = altScene ? altScene.predictions : null;
  const comparePredMap = useMemo(() => {
    if (!altScene) return null;
    const m = new Map<number, number>();
    const all = topK(altScene.pass.logits, altScene.pass.length - 1, config.vocabSize);
    for (const p of all) m.set(p.id, p.p);
    return m;
  }, [altScene]);

  const peekEdge = peek !== null ? edges?.find((e) => e.position === peek) : undefined;
  const stageTitle =
    step.loop > 0 && (step.stage === "attend" || step.stage === "ff")
      ? `Loop ${step.loop} of ${scene.loops} · ${STAGE_LABEL[step.stage]}`
      : step.stage === "return"
        ? `Loop ${step.loop} → ${step.loop + 1} · ${STAGE_LABEL.return}`
        : STAGE_LABEL[step.stage];

  return (
    <Figure
      label="Figure 1 · interactive"
      title="Follow your prompt through the loop"
      note={`${config.paramCount.toLocaleString()} weights · ${config.vocabSize}-token vocabulary`}
      caption={
        <>
          <strong className="font-medium text-stone-700">
            Figure 1. One sentence, one block, four passes.
          </strong>{" "}
          Press Play and watch the sentence become tokens, become vectors, and go
          round the same block four times before the model predicts a word. The
          figure runs a real weight-tied transformer in your browser, so every
          number on screen comes from its forward pass. Watch the second “key”:
          its link to the first “key” gets stronger on every pass, which is what
          looping buys you. Click any word to follow it instead, or click an
          earlier word during an attention step to read its exact weight.
        </>
      }
    >
      {/* ---------------------------------------------------- the sentence */}
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[14rem] flex-1">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.1em] text-stone-500 uppercase">
            Your sentence
          </span>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => commitText(draft)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitText(draft);
              }
            }}
            spellCheck={false}
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 font-mono text-[13px] text-stone-800 focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent focus-visible:outline-none"
          />
        </label>
        <label className="shrink-0">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.1em] text-stone-500 uppercase">
            Loops
          </span>
          <select
            value={loops}
            onChange={(e) => setLoops(Number(e.target.value))}
            className="h-[38px] rounded-md border border-stone-300 bg-white px-2 font-mono text-[13px] text-stone-800 focus-visible:border-accent focus-visible:outline-none"
          >
            {Array.from({ length: config.maxLoops }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="shrink-0">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.1em] text-stone-500 uppercase">
            Head
          </span>
          <select
            value={head}
            onChange={(e) => setHead(Number(e.target.value))}
            className="h-[38px] rounded-md border border-stone-300 bg-white px-2 font-mono text-[13px] text-stone-800 focus-visible:border-accent focus-visible:outline-none"
          >
            {heads.map((h) => (
              <option key={h.head} value={h.head}>
                {h.head + 1}
                {h.top ? ` → ${h.top.token} ${(h.top.weight * 100).toFixed(0)}%` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4">
        <TokenTrack
          tokens={scene.tokens}
          position={safePos}
          onSelect={(p) => {
            setPosition(p);
            setDim(null);
          }}
          edges={edges}
          peek={peek}
          onPeek={setPeek}
          strip={strip}
          generated={scene.generated}
          highlightReturn={step.stage === "return"}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-400">
        {strip ? (
          <>
            <span>
              strips show{" "}
              <span className="font-mono text-stone-600">{strip.label}</span> —{" "}
              {strip.description}
            </span>
            <ScaleKey scale={strip.scale} />
          </>
        ) : (
          <span>token ids only — the vectors appear at the next step</span>
        )}
      </div>

      {peekEdge ? (
        <p className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
          Head {head + 1}, loop {step.loop}: “{token?.surface}” puts{" "}
          <span className="font-mono font-semibold">
            {(peekEdge.weight * 100).toFixed(2)}%
          </span>{" "}
          of its attention on “{scene.tokens[peekEdge.position]?.surface}” at
          position {peekEdge.position}.{" "}
          <button
            type="button"
            onClick={() => {
              setPosition(peekEdge.position);
              setPeek(null);
            }}
            className="underline underline-offset-2 hover:text-amber-700"
          >
            Follow that word instead
          </button>
        </p>
      ) : null}

      {/* ------------------------------------------------------- the block */}
      <div className="mt-4 overflow-x-auto rounded-lg border border-stone-200 bg-stone-50/50 p-2 sm:p-3">
        <LoopDiagram
          stage={step.stage}
          loop={step.loop}
          loops={scene.loops}
          phase={player.phase}
          packet={packet}
          packetScale={packetScale}
          reducedMotion={player.reducedMotion}
        />
      </div>

      <Transport
        player={player}
        count={scene.steps.length}
        marks={marks}
        stepLabel={stageTitle}
      >
        <span className="ml-auto flex flex-wrap items-center gap-1.5">
          <Counter label="loop" value={`${Math.max(1, step.loop)} / ${scene.loops}`}
                   tone="accent" />
          <Counter label="generated" value={`${scene.generated} token${scene.generated === 1 ? "" : "s"}`} />
        </span>
      </Transport>

      <NowLine step={stageTitle} tone={step.stage === "return" ? "accent" : "plain"}>
        {narrate(scene, player.index, head, safePos)}
        {player.haltedAt === player.index ? (
          <span className="mt-1 block text-[12px] font-medium text-accent">
            Paused here on purpose — this is the moment the loop closes. Press Play
            to carry on.
          </span>
        ) : null}
      </NowLine>

      {/* ------------------------------------------------------- the panels */}
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Panel
          title={<>Inside “{token?.surface ?? ""}”</>}
          aside={`position ${safePos} · id ${token?.id ?? 0}`}
        >
          <div className="space-y-1.5">
            {step.stage === "tokenize" || step.stage === "embed" ? (
              <HeatRow
                values={embeddingAt(scene, safePos)}
                scale={scene.embedScale}
                label="e"
                picked={dim}
                onPick={setDim}
              />
            ) : (
              <>
                <HeatRow
                  values={before}
                  scale={scene.hiddenScale}
                  label={packetLoop <= 1 ? "h⁰ = 0" : `h${["", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷"][packetLoop - 1]}`}
                  picked={dim}
                  onPick={setDim}
                  muted
                />
                <HeatRow
                  values={after}
                  scale={scene.hiddenScale}
                  label={`h${["", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸"][Math.max(1, packetLoop)]}`}
                  picked={dim}
                  onPick={setDim}
                />
                <DeltaRow
                  before={before}
                  after={after}
                  baseScale={scene.hiddenScale}
                  picked={dim}
                  onPick={setDim}
                />
              </>
            )}
          </div>
          <PickedValue
            dim={dim}
            rows={
              step.stage === "tokenize" || step.stage === "embed"
                ? [{ label: "e", values: embeddingAt(scene, safePos) }]
                : [
                    { label: "before", values: before },
                    { label: "after", values: after },
                  ]
            }
          />
          {step.stage !== "tokenize" && step.stage !== "embed" ? (
            <TopMovers before={before} after={after} />
          ) : (
            <p className="mt-2 text-[11px] leading-relaxed text-stone-500">
              {token?.oov
                ? "This token came from character fallback — the model never saw it in training, so its embedding is untrained noise."
                : `Characters ${token?.start}–${token?.end} of your sentence. Vocabulary entry “${token?.token}”.`}
            </p>
          )}
        </Panel>

        <Panel
          title="What it would say next"
          aside={`after ${scene.loops} loop${scene.loops === 1 ? "" : "s"}`}
          tone={step.stage === "readout" || step.stage === "emit" ? "accent" : "plain"}
        >
          <Predictions
            items={scene.predictions}
            highlight={step.stage === "emit"}
            compare={comparePredMap}
          />
          {comparing && altPredictions ? (
            <p className="mt-2 text-[11px] leading-relaxed text-stone-500">
              The right-hand column is this probability minus the same token’s
              probability in the red run.
            </p>
          ) : (
            <p className="mt-2 text-[11px] leading-relaxed text-stone-500">
              Read off the last position, “{scene.tokens[scene.tokens.length - 1]?.surface}”.
              {!canGenerate
                ? " The sentence has reached the model’s 32-token window."
                : ""}
            </p>
          )}
        </Panel>
      </div>

      {/* --------------------------------------------------- experiments */}
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-stone-200 bg-white p-3">
        <span className="text-[11px] font-semibold tracking-[0.1em] text-stone-500 uppercase">
          Try it
        </span>
        <button
          type="button"
          onClick={() => setComparing((c) => !c)}
          disabled={!altText}
          title={
            altText
              ? "Run the same sentence with red instead of blue and compare"
              : "Your sentence has no “blue” to change"
          }
          className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-[12px] font-medium text-stone-700 transition-colors hover:border-stone-400 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:outline-none"
        >
          {comparing ? "Hide the red run" : "Change blue to red"}
        </button>
        <button
          type="button"
          onClick={generateOne}
          disabled={!canGenerate}
          className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-[12px] font-medium text-stone-700 transition-colors hover:border-stone-400 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:outline-none"
        >
          Generate one more token
        </button>
        {generated.length > 0 ? (
          <button
            type="button"
            onClick={() => setGenerated([])}
            className="rounded-md px-2 py-1.5 text-[12px] text-stone-500 underline underline-offset-2 hover:text-stone-900"
          >
            Clear the {generated.length} generated token
            {generated.length === 1 ? "" : "s"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setDraft(DEFAULT_TEXT);
            commitText(DEFAULT_TEXT);
            setLoops(config.defaultLoops);
            setHead(0);
          }}
          className="ml-auto rounded-md px-2 py-1.5 text-[12px] text-stone-500 underline underline-offset-2 hover:text-stone-900"
        >
          Reset the figure
        </button>
      </div>

      {comparing && altScene && altAfter ? (
        <div className="mt-3">
          <Panel
            title={<>Blue run against red run, at loop {Math.max(1, packetLoop)}</>}
            aside={`following “${token?.surface}”`}
            tone="accent"
          >
            <div className="space-y-1.5">
              <HeatRow values={after} scale={scene.hiddenScale} label="blue"
                       picked={dim} onPick={setDim} />
              <HeatRow values={altAfter} scale={scene.hiddenScale} label="red"
                       picked={dim} onPick={setDim} />
              <DeltaRow before={after} after={altAfter} baseScale={scene.hiddenScale}
                        picked={dim} onPick={setDim} />
            </div>
            <PickedValue
              dim={dim}
              rows={[
                { label: "blue", values: after },
                { label: "red", values: altAfter },
              ]}
            />
            <p className="mt-2 text-[12px] leading-relaxed text-stone-600">
              {(() => {
                const d = changedDims(scene, Math.max(1, packetLoop), safePos);
                let maxAbs = 0;
                for (let i = 0; i < config.dModel; i += 1) {
                  maxAbs = Math.max(maxAbs, Math.abs(after[i] - altAfter[i]));
                }
                const pBlue = scene.predictions[0];
                const pRed = altScene.predictions[0];
                const same = pBlue && pRed && pBlue.token === pRed.token;
                return (
                  `One word changed, and the vector did move: the biggest gap between ` +
                  `the two runs at this loop is ${maxAbs.toFixed(3)}, against a state ` +
                  `whose own numbers reach ${scene.hiddenScale.toFixed(1)}. ` +
                  (same
                    ? `The prediction does not flip — both runs still say ` +
                      `“${pBlue.token}”, at ${(pBlue.p * 100).toFixed(2)}% for blue and ` +
                      `${(pRed.p * 100).toFixed(2)}% for red. The colour of the key is ` +
                      `simply not evidence about where the key is, and the model has ` +
                      `learned that. The change is real but it is not decisive` +
                      (d.changed ? "" : "") + `.`
                    : `This time the winning token changes: “${pBlue?.token}” for blue, ` +
                      `“${pRed?.token}” for red.`)
                );
              })()}
            </p>
          </Panel>
        </div>
      ) : null}
    </Figure>
  );
}
