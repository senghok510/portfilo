// The demo model's facts, read straight from the exported weight file so the
// article's prose cannot drift from the model the figures actually run.
import raw from "./weights.json";

const c = raw.config;

export const CARD = {
  params: c.paramCount,
  vocab: c.vocabSize,
  dModel: c.dModel,
  heads: c.nHeads,
  dFF: c.dFF,
  maxLen: c.maxLen,
  accuracy: c.heldOutAccuracy,
  loopsTrained: c.loopsTrained as number[],
  defaultLoops: c.defaultLoops,
  maxLoops: c.maxLoops,
};

export const CARD_TEXT = {
  paramsPretty: CARD.params.toLocaleString("en-GB"),
  accuracyPct: `${Math.round(CARD.accuracy * 100)}%`,
  loopRange: `${Math.min(...CARD.loopsTrained)} to ${Math.max(...CARD.loopsTrained)}`,
};
