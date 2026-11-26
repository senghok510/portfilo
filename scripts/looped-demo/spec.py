"""Vocabulary, tokenizer and training corpus for the looped-attention demo model.

This file is the single source of truth for the demo model's tokenizer. The
TypeScript tokenizer in lib/looped-demo/tokenizer.ts implements the same
algorithm and reads the vocabulary exported from here, so the article shows
exactly the tokens the model was trained on.

Tokenizer: lowercase, punctuation split off, then greedy whole-word lookup in a
fixed vocabulary with single-character fallback for out-of-vocabulary words.
"""

import random
import re

# --- vocabulary ------------------------------------------------------------

SPECIALS = ["<pad>", "<unk>"]

NAMES = ["mira", "aria", "omar", "leo", "nina", "iris", "theo", "maya"]
COLORS = ["blue", "red", "green", "black", "white", "silver"]
OBJECTS = ["key", "book", "coin", "card", "cup", "pen", "ring", "lamp"]
CONTAINERS = ["drawer", "box", "basket", "bag", "pocket", "case"]
SURFACES = ["table", "shelf", "desk", "chair"]
VERBS = ["put", "left", "kept", "found"]

FUNCTION = [
    "the", "a", "and", "in", "on", "under", "is", "was",
    "then", "later", "it", "where", "her", "his",
]

PUNCT = [".", ",", "?", "'", "-", "!", ";", ":"]
CHARS = list("abcdefghijklmnopqrstuvwxyz") + list("0123456789")


def build_vocab():
    """Deterministic, ordered vocabulary. Whole words first, then fallbacks."""
    words = []
    for group in (NAMES, COLORS, OBJECTS, CONTAINERS, SURFACES, VERBS, FUNCTION):
        for w in group:
            if w not in words:
                words.append(w)
    vocab = list(SPECIALS)
    vocab += words
    for p in PUNCT:
        if p not in vocab:
            vocab.append(p)
    for c in CHARS:
        if c not in vocab:
            vocab.append(c)
    assert len(vocab) == len(set(vocab)), "duplicate vocabulary entry"
    return vocab


VOCAB = build_vocab()
STOI = {t: i for i, t in enumerate(VOCAB)}
UNK = STOI["<unk>"]
PAD = STOI["<pad>"]

# --- tokenizer -------------------------------------------------------------

# Words are runs of letters/digits/apostrophes; every other non-space character
# is its own token. Kept deliberately simple so the TS port is exact.
_WORD_RE = re.compile(r"[a-z0-9']+|[^\sa-z0-9']")


def pre_tokenize(text):
    """-> list of (surface, start, end) over the LOWERCASED text."""
    lowered = text.lower()
    return [(m.group(0), m.start(), m.end()) for m in _WORD_RE.finditer(lowered)]


def encode(text):
    """-> list of dicts: token id, the vocab string, source span, oov flag."""
    out = []
    for surface, start, end in pre_tokenize(text):
        if surface in STOI:
            out.append(
                {"id": STOI[surface], "token": surface, "start": start,
                 "end": end, "oov": False}
            )
            continue
        # Out-of-vocabulary word: fall back to single characters.
        for k, ch in enumerate(surface):
            tid = STOI.get(ch, UNK)
            out.append(
                {
                    "id": tid,
                    "token": ch if ch in STOI else "<unk>",
                    "start": start + k,
                    "end": start + k + 1,
                    "oov": True,
                }
            )
    return out


def encode_ids(text):
    return [t["id"] for t in encode(text)]


# --- corpus ----------------------------------------------------------------

MAX_LEN = 32


def _templates(rng):
    """One sampled sentence as a list of whole words."""
    name = rng.choice(NAMES)
    color, color2 = rng.sample(COLORS, 2)
    obj, obj2 = rng.sample(OBJECTS, 2)
    cont, cont2 = rng.sample(CONTAINERS, 2)
    surf = rng.choice(SURFACES)
    verb = rng.choice(VERBS[:3])
    kind = rng.randrange(7)

    if kind == 0:  # one object, container
        s = f"{name} {verb} the {color} {obj} in the {cont} . the {obj} is in the {cont} ."
    elif kind == 1:  # one object, surface
        s = f"{name} {verb} the {color} {obj} on the {surf} . the {obj} is on the {surf} ."
    elif kind == 2:  # two objects, ask about the first
        s = (f"{name} {verb} the {color} {obj} in the {cont} and the {color2} {obj2} "
             f"in the {cont2} . the {obj} is in the {cont} .")
    elif kind == 3:  # two objects, ask about the second
        s = (f"{name} {verb} the {color} {obj} in the {cont} and the {color2} {obj2} "
             f"in the {cont2} . the {obj2} is in the {cont2} .")
    elif kind == 4:  # colour is the only distinguishing feature
        s = (f"{name} {verb} the {color} {obj} in the {cont} and the {color2} {obj} "
             f"in the {cont2} . the {color} {obj} is in the {cont} .")
    elif kind == 5:  # colour distinguishes, ask about the second
        s = (f"{name} {verb} the {color} {obj} in the {cont} and the {color2} {obj} "
             f"in the {cont2} . the {color2} {obj} is in the {cont2} .")
    else:  # statement then recall with a connective
        s = (f"the {color} {obj} is in the {cont} . later {name} found the {obj} "
             f"in the {cont} .")
    return s


def build_corpus(n=24000, seed=0):
    rng = random.Random(seed)
    seqs, seen = [], set()
    while len(seqs) < n:
        s = _templates(rng)
        ids = encode_ids(s)
        if len(ids) + 1 > MAX_LEN:
            continue
        key = tuple(ids)
        if key in seen:
            continue
        seen.add(key)
        seqs.append(ids)
    return seqs


DEMO_PROMPT = "Mira put the blue key in the drawer. The key is in the"
DEMO_PROMPT_RED = "Mira put the red key in the drawer. The key is in the"

if __name__ == "__main__":
    print(f"vocab size: {len(VOCAB)}")
    corpus = build_corpus(2000)
    print(f"corpus: {len(corpus)} unique sequences, "
          f"max len {max(len(s) for s in corpus)}")
    toks = encode(DEMO_PROMPT)
    print("demo prompt ->", " ".join(t["token"] for t in toks))
    print("ids:", [t["id"] for t in toks])
    oov = encode("Mira put the sapphire key in the drawer")
    print("oov demo ->", " ".join(t["token"] for t in oov))
