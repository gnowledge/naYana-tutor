# Phasing Roadmap

Nayana is one font with many phases. Each phase introduces one visual
change, registered under an OpenType stylistic set (`ssNN`). Readers
opt into each phase by enabling the corresponding feature.

## Principle

Each phase must be:

1. **Readable without learning anything new.** The visual change is
   informative, not blocking. A reader who has never seen the font can
   still read the text.
2. **Preparation for the next phase.** No sudden jumps.
3. **Independently toggleable.** Users can enable phase N+1 without
   ever turning on phase N.
4. **Compatible with all earlier phases.** Phases compose; they don't
   replace each other.
5. **Reversible.** Every phase has a CSS off-switch.

## Phase index

| Phase | Feature | Status | Description |
|-------|---------|--------|-------------|
| `vowel_marker` | `ss01` | shipped | Baseline stroke under each Latin vowel |
| `pronounced_vowel` | `ss02` | planned | Stroke only under voiced vowels (silent letters left bare) |
| `schwa_marker` | `ss03` | planned | Distinct modifier for unstressed (schwa) vowels |
| `long_short` | `ss04` | planned | Long and short vowels become visibly distinct |
| `diphthong` | `ss05` | planned | Vowel digraphs render as unified phonemes |
| `glyph_replacement` | `ss06+` | planned | Latin vowel letters replaced with naYana symbols |

Each phase has a detailed design doc in `docs/phases/`.

## Why this is one font, not many

The original draft of this project considered shipping each phase as
a separate font (Nayana v0.1, v0.2, ...). The single-font approach is
strictly better because:

- **Same install path forever.** Users install once. Updates ship via
  font updates, not new font downloads.
- **Independent feature toggles.** Some readers may want schwa marking
  but not long/short distinction. With one font, they pick.
- **Cleaner backwards compatibility.** Old text rendered by a reader
  using a newer font still works; toggles are additive.
- **Cleaner forwards compatibility.** A reader who hasn't updated yet
  doesn't see broken phases, just unstyled vowels.

## Phase: vowel_marker (ss01) — shipped

**Visual**: Horizontal stroke at baseline under every Latin vowel
letter (a, e, i, o, u).

**What it teaches**: "Vowels are visually distinct from consonants."
Trains the eye to chunk text by vowel positions, foundation of syllable
recognition.

**Implementation**: Pure GSUB. No preprocessing required. ~70 lines
of phase logic.

**Scope decision**: Marks every vowel *letter*, including silent ones
(`make`, `eight`). Intentional — makes the silent-letter phenomenon
visible, preparing for `pronounced_vowel`.

## Phase: pronounced_vowel (ss02) — planned

**Visual**: Stroke appears only under vowels that are voiced. Silent
vowels remain bare (e.g. final `e` in `make`).

**What it teaches**: "Spelling and pronunciation differ. Some letters
are decorative."

**Implementation**: Adds a preprocessor (CMUdict, ~134k words, +
fallback g2p). Text is marked up before rendering. The font stays
the same; the input stream changes.

**Distribution**: OTF + browser extension / input method. The font
alone still works, but the full experience requires the preprocessor.

**Open question**: Which dialect's pronunciation? American, British,
Indian English have different silent-vowel patterns. Probably ship
multiple dictionaries.

## Phase: schwa_marker (ss03) — planned

**Visual**: Unstressed vowels (which collapse to /ə/) get a distinct
modifier — likely a dot above, or a thinner stroke. Stressed vowels
keep the ss02 appearance.

**What it teaches**: English has a stressed/unstressed rhythm. The
"missing" sound in `about` is actually present, just unstressed.

**Implementation**: Same preprocessor as ss02; CMUdict already encodes
stress.

## Phase: long_short (ss04) — planned

**Visual**: Long vowels (`make`, `feet`) and short vowels (`mat`,
`bet`) become visibly different. Probably a curved modifier above the
vowel.

**What it teaches**: The categorical distinction English makes between
vowel pairs that share spelling.

## Phase: diphthong (ss05) — planned

**Visual**: Vowel digraphs that represent a single phoneme (`ai`, `oi`,
`ou`, etc.) collapse into a unified marked vowel.

**What it teaches**: English treats certain letter pairs as single
sounds. Last preparation step before glyph replacement.

## Phase: glyph_replacement (ss06+) — planned

**Visual**: The Latin vowel letters above the strokes are replaced
with naYana-style phoneme-specific symbols. Consonants remain Latin.

**What it teaches**: A full phonetic vowel system.

By this point the reader has spent (hopefully) months with vowels
visually anchored above a baseline stroke. Replacing the glyph above
the stroke is a small perceptual jump.

## Beyond glyph replacement

Open. Possible directions:

- **Consonant reform**: high-irregularity consonants first (`th` for
  /θ/ vs /ð/, `c` for /k/ vs /s/, `g` for /g/ vs /dʒ/), then digraphs
  (`sh` → /ʃ/, `ng` → /ŋ/). Same phasing logic, more `ssNN` slots.
- **Stop here**: vowel reform addresses ~80% of English's
  phoneme/grapheme mismatch. May be enough.
