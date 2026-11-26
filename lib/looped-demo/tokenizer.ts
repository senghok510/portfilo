// The demo model's tokenizer.
//
// A port of scripts/looped-demo/spec.py, which is what the model was trained
// with: lowercase the text, split words from punctuation, then look each word
// up whole in a fixed 95-entry vocabulary. Words that are not in the
// vocabulary fall back to one token per character, which is why the figure
// marks them — the model has never seen those characters in training.
import { config, vocab } from "./model";

const STOI = new Map<string, number>();
vocab.forEach((t, i) => STOI.set(t, i));

// Runs of letters/digits/apostrophes are words; every other non-space
// character is a token of its own. Same expression as the Python tokenizer.
const PIECE = /[a-z0-9']+|[^\sa-z0-9']/g;

export type Token = {
  /** Index in the token sequence. */
  index: number;
  /** Vocabulary id fed to the model. */
  id: number;
  /** The vocabulary entry this id stands for. */
  token: string;
  /** Character span in the original (un-lowercased) text. */
  start: number;
  end: number;
  /** The original text of the span, with its original case. */
  surface: string;
  /** True when this token came from character fallback. */
  oov: boolean;
};

export function tokenize(text: string): Token[] {
  const lowered = text.toLowerCase();
  const out: Token[] = [];
  PIECE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PIECE.exec(lowered)) !== null) {
    const piece = m[0];
    const start = m.index;
    const known = STOI.get(piece);
    if (known !== undefined) {
      out.push({
        index: out.length, id: known, token: piece,
        start, end: start + piece.length,
        surface: text.slice(start, start + piece.length), oov: false,
      });
      continue;
    }
    for (let k = 0; k < piece.length; k += 1) {
      const ch = piece[k];
      const id = STOI.get(ch);
      out.push({
        index: out.length,
        id: id ?? config.unkId,
        token: id === undefined ? "<unk>" : ch,
        start: start + k, end: start + k + 1,
        surface: text.slice(start + k, start + k + 1), oov: true,
      });
    }
  }
  return out.slice(0, config.maxLen).map((t, i) => ({ ...t, index: i }));
}

export function idsOf(tokens: Token[]): number[] {
  return tokens.map((t) => t.id);
}

/** True when `text` tokenizes to more tokens than the model's window. */
export function overflows(text: string): boolean {
  const lowered = text.toLowerCase();
  PIECE.lastIndex = 0;
  let n = 0;
  let m: RegExpExecArray | null;
  while ((m = PIECE.exec(lowered)) !== null) {
    n += STOI.has(m[0]) ? 1 : m[0].length;
  }
  return n > config.maxLen;
}

/** Detokenize for the generated continuation: spaces except before punctuation. */
export function joinTokens(tokens: string[]): string {
  return tokens
    .reduce((acc, t) => {
      if (acc === "") return t;
      return /^[.,?!;:']$/.test(t) ? `${acc}${t}` : `${acc} ${t}`;
    }, "")
    .trim();
}
