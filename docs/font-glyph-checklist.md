# Nayana Font Glyph Checklist

Inventory of every IPA character the engine emits, with two checkboxes
per character:

- **Keep** — use this codepoint as the canonical Nayana spelling.
  Per the [IPA encoding policy](../AGENTS.md), every IPA character we
  emit stays on its canonical Unicode codepoint. So this column is
  pre-checked for everything; it's here as an explicit acknowledgement
  rather than a real choice.
- **New shape** — design a Nayana-specific glyph for this character.
  Pre-checked for the characters where rotation, mirror, or ligature
  concerns have already been raised in earlier phases. The unchecked
  ones are visually distinct enough in standard IPA-supporting fonts
  that they may render acceptably as-is — but the font phase may want
  consistent Nayana shapes across the whole inventory.

To mark a decision: replace ☐ with ☑ in the relevant cell.

---

## Design principles

Constraints on font shape choices, recorded so the design phase
doesn't have to relitigate them:

- **Avoid mirror symmetries.** Pairs like `b/d` and `p/q` create
  reading confusion (a known cause of dyslexia-adjacent difficulties).
  Where the Latin form has a mirror partner already in use, design a
  non-mirror replacement.
- **Avoid rotational symmetries.** The 180° rotation of `e` is `ə`;
  the rotation of `v` is `ʌ`. The Nayana shapes for these characters
  must not be rotations of any letter the reader already knows.
- **Reuse unused Latin letter slots as font glyphs.** Latin letters
  that don't appear in current Nayana output (`c`, `j`, `q`, `x`)
  are available as glyph slots — either as ligatures for IPA digraphs
  or as the rendering shape for IPA codepoints with phonetic
  precedent in another script tradition.
- **Greek capital letters are free for IPA renderings.** IPA is a
  case-less script (no capital/small distinction). Where a Greek
  capital provides a clean shape with no IPA conflict, it can be
  used as the visual form of an IPA codepoint.

---

## Consonants

| Symbol | Codepoint | Phoneme | Example | Phase | Keep | New shape | Notes |
|--------|-----------|---------|---------|-------|:----:|:---------:|-------|
| θ | U+03B8 | voiceless /θ/ (thin) | thin → θɪn | 11 | ☑ | ☐ | Greek theta — visually distinctive, may not need redesign |
| ð | U+00F0 | voiced /ð/ (this) | this → ðɪs | 11 | ☑ | ☑ | **DECIDED**: render as Greek small `δ` — curve over closed circle, easy to handwrite |
| ʃ | U+0283 | /ʃ/ (sh) | ship → ʃɪp | 12 | ☑ | ☐ | Esh — already distinct |
| ʒ | U+0292 | /ʒ/ (zh) | vision → vɪʒən | 12 | ☑ | ☐ | Ezh — already distinct |
| ŋ | U+014B | /ŋ/ (ng) | sing → sɪŋ | 12 | ☑ | ☑ | **DECIDED**: an `n` with a `b`-shaped tail, where b's bowl descends below the baseline. |
| tʃ | t + ʃ | /tʃ/ (ch) | chip → tʃɪp | 12 | ☑ | ☑ | **DECIDED**: ligature renders as Latin `c` shape (Sanskrit IAST tradition; c is unused in current Nayana output) |
| dʒ | d + ʒ | /dʒ/ (j) | judge → dʒʌdʒ | 13 | ☑ | ☑ | **DECIDED**: ligature renders as Latin `j` shape (Sanskrit IAST tradition; j is unused in current Nayana output) |

## Vowels

| Symbol | Codepoint | Phoneme | Example | Phase | Keep | New shape | Notes |
|--------|-----------|---------|---------|-------|:----:|:---------:|-------|
| ː | U+02D0 | length marker | meet → miːt | 8 / 9 | ☑ | ☐ | Triangular colon — pairs with iː uː ɔː ɑː |
| ə | U+0259 | schwa | about → əbaut | 10 | ☑ | ☑ | **DECIDED**: baseline two-stroke (`=`-like at baseline), extending the vowel-marker stroke. Avoids the rotational-of-e shape. |
| ɪ | U+026A | short /ɪ/ | bit → bɪt | 13 | ☑ | ☐ | Small-cap I — distinct from i |
| ʊ | U+028A | short /ʊ/ | book → bʊk | 13 | ☑ | ☐ | Turned omega — not a Latin rotation |
| ɛ | U+025B | short /ɛ/ | bed → bɛd | 13 | ☑ | ☐ | Latin epsilon — distinct from e |
| æ | U+00E6 | /æ/ | cat → kæt | 13 | ☑ | ☑ | **DECIDED**: render as Latin `a` shape (cat reads as "kat"). Latin a is unused standalone in current Nayana output — only appears in `ai`/`au` digraphs, which is consistent with English's existing a-for-/æ/ convention |
| ʌ | U+028C | stressed /ʌ/ | cup → kʌp | 13 | ☑ | ☑ | Rotation-of-v concern. Suggested: wedge with downward opening, longer base |
| ɝ | U+025D | stressed r-colored | bird → bɝd | 14 | ☑ | ☑ | **DECIDED**: two V-shapes stacked vertically with a gap, like `:` but with V's instead of dots. Top is `∨` (arms up, point down toward the gap); bottom is `∧` (arms down, point up toward the gap). Like the letter `x` cut horizontally in half with the middle removed. The gap visualises "r is there but not there" — r-coloration without full articulation. |
| ɚ | U+025A | unstressed r-colored | teacher → tiːtʃɚ | 14 | ☑ | ☑ | **DECIDED**: two small hollow circles (degree-symbol size, `°`) stacked vertically with a gap — like a colon `:` with outlines drawn instead of filled dots. The lighter pair to ɝ's V-stack: same vertical-gap structure, hollow circles instead of solid V-points to signal the unstressed quality. |
| ɔ | U+0254 | open /ɔ/ | call → kɔːl | 16 | ☑ | ☐ | Open o — distinct from o |
| ɑ | U+0251 | cardinal /ɑ/ | hot → hɑːt | 16 | ☑ | ☑ | **DECIDED**: render as Greek `α` shape, drawn closer to the infinity sign `∝` (curl-with-extension form) so it reads visibly distinct from Latin a. Greek α matches the IPA's own one-story tradition and gives "hot" → "hαːt" |
| ɔɪ | ɔ + ɪ | /ɔɪ/ diphthong | boy → bɔɪ | 16 | ☑ | ☐ | Composed of ɔ and ɪ — could ligate or render sequentially |

---

## Summary

**Total IPA characters in the engine**: 19 (7 consonants + 12 vowel-related, including the length marker and one diphthong).

**Decided shapes** (9 IPA codepoints + 1 Latin letter):

| Character | Designed shape | Reason |
|-----------|----------------|--------|
| ð | Greek small `δ` | curve over closed circle, easy handwriting |
| tʃ | Latin `c` shape (ligature) | Sanskrit IAST; c unused in output |
| dʒ | Latin `j` shape (ligature) | Sanskrit IAST; j unused (Y is /j/) |
| ə | Baseline two-stroke (`=`-like) | Extends vowel-marker stroke; avoids rotation-of-e |
| æ | Latin `a` shape | a unused standalone in output; matches English's a-for-/æ/ |
| ɑ | Greek `α` (closer to `∝` infinity) | Phonetic match for cardinal /a/; visually distinct from Latin a |
| ɝ | Two V's stacked vertically (∨ above ∧) with a gap | Like `:` but V's instead of dots; gap signals not-quite-r |
| ɚ | Two hollow circles (degree-symbol size) stacked vertically with a gap | Like `:` with outlined dots; lighter pair to ɝ's V-stack |
| ŋ | `n` with a `b`-shaped tail, b's bowl below baseline | — |
| Latin `d` | Greek capital `Δ` | b/d mirror avoidance; ties to ð→δ family |

**Still open** (1 character):

| Character | Status | Notes |
|-----------|--------|-------|
| ʌ | open | Wedge with downward opening, longer base (sketch only) |

The remaining 9 IPA characters (θ, ʃ, ʒ, ː, ɪ, ʊ, ɛ, ɔ, ɔɪ) are
visually distinct in standard IPA fonts and may not strictly
require new shapes — but a consistent Nayana treatment across the
whole inventory is worth considering when the font phase begins.

## Latin-letter digraphs (no new IPA codepoints)

For completeness, the engine also emits these multi-character forms
that compose existing Latin letters or IPA + length markers. The font
may want ligature treatment for some, but no new codepoints needed.

| Form | Phoneme | Example | Composition |
|------|---------|---------|-------------|
| ai | /aɪ/ | nait | a + i |
| ei | /eɪ/ | feis | e + i |
| ou | /oʊ/ | bout | o + u |
| au | /aʊ/ | abaut | a + u |
| iː | /iː/ | miːt | i + ː |
| uː | /uː/ | fuːd | u + ː |
| ɔː | /ɔː/ | kɔːl | ɔ + ː |
| ɑː | /ɑː/ | fɑːðɚ | ɑ + ː |
| ks | /ks/ | boks | k + s |
| gz | /gz/ | ɛgzɪt | g + z |
| juː | /juː/ | juːs | j + u + ː |

---

## Letter-shape mappings — IPA codepoints rendered as Latin/Greek shapes

Engine still emits canonical IPA codepoints; the font draws each one
with a Nayana-designed shape that's either a familiar Latin letter
(via ligature for digraphs) or a Greek letter (free of IPA conflict
because IPA is case-less for Greek capitals and uses different
codepoints from Greek's small letters).

| IPA codepoint(s) | Designed font shape | Reason |
|------------------|---------------------|--------|
| `ð` (U+00F0) | Greek small `δ` | Curve over closed circle, easy to handwrite. Pairs visually with d → Δ for the alveolar/dental d-family. |
| `tʃ` digraph (t + ʃ) | Latin `c` shape (ligature) | Sanskrit IAST tradition; c is unused in current Nayana output (phase 2 c→k/c→s removed it). Font ligates the two-character sequence to one `c`-shaped glyph. |
| `dʒ` digraph (d + ʒ) | Latin `j` shape (ligature) | Sanskrit IAST tradition; j is unused in current Nayana output (we use Y for the consonant /j/). Font ligates to one `j`-shaped glyph. |
| `ə` (U+0259) | Baseline two-stroke (`=`-like) | Extends the vowel-marker baseline stroke. Avoids the rotation-of-e shape that the standard IPA glyph carries. |
| `æ` (U+00E6) | Latin `a` shape | Latin a is unused standalone in current output (only appears in `ai`/`au` digraphs). Matches English's existing a-for-/æ/ convention: cat reads as "kat". |
| `ɑ` (U+0251) | Greek `α` (closer to `∝` infinity sign) | Phonetic match for the cardinal /a/. Drawn with the curl-with-extension form so it's clearly distinct from Latin a. hot reads as "hαːt". |
| `ɝ` (U+025D) | Two V-shapes stacked vertically (∨ over ∧) with a gap between | Direct visual analogue of `:` (two stacked dots) — but V-shapes instead of dots. Top is `∨` with arms reaching up and point at bottom; bottom is `∧` with arms reaching down and point at top; the two points face each other across a vertical gap. Equivalent: the letter `x` cut in half horizontally, middle removed. The gap is the "r is there but not there" — r-coloration without articulation. |
| `ɚ` (U+025A) | Two hollow circles (`°`-size) stacked vertically with a gap between | Direct visual analogue of `:` with the dots drawn as outlines instead of filled. Pairs with ɝ's V-stack: same vertical-stack-with-gap structure, but circles instead of points to signal the lighter, unstressed quality of the unstressed r-colored vowel. teacher reads as "tiːc°°" (with the trailing pair representing the rhotic schwa). |
| `ŋ` (U+014B) | An `n` with a `b`-shaped tail, where b's bowl descends below the baseline | — |

| Latin codepoint | Designed font shape | Reason |
|-----------------|---------------------|--------|
| Latin `d` (U+0064) | Greek capital `Δ` shape | Latin `d` is the mirror of `b`. Replacing the glyph with capital delta breaks the mirror confusion. Ties visually to ð → δ for the alveolar/dental d-family. IPA being case-less, capital delta has no IPA conflict. |

## Open design questions

### R-colored vowels — both ɝ and ɚ decided

These two IPA characters represent r-coloration applied to a vowel —
a quality of the vowel itself rather than a separate /r/ consonant.
The visual idea is to mark the "r-colored but not fully articulated"
quality with a paired gap shape, analogous to the way the length
marker `ː` uses paired dots.

Both shapes share the same structure (vertically stacked elements
with a gap between, like `:`); the difference is in the visual
weight of the elements:

- **ɝ (stressed, bird → bɝd)** — pointed V's: heavier, more present
- **ɚ (unstressed, teacher → tiːtʃɚ)** — hollow circles: lighter, more absent

**ɝ (stressed) — DECIDED**:

Two V-shapes stacked **vertically** with a gap between, exactly the
way `:` is two dots stacked vertically — but V's instead of dots.
The top is `∨` (arms reaching up to the sky, point at the bottom);
the bottom is `∧` (arms reaching down to the ground, point at the
top). The two points face each other across a vertical gap.

Equivalent description: the letter `x` cut in half horizontally,
with the middle removed — the upper and lower halves of x remain
but no longer touch. The gap signals "r is there but not there" —
r-coloration without a fully articulated /r/.

**ɚ (unstressed) — DECIDED**:

Two small hollow circles (degree-symbol size, like `°`) stacked
vertically with a gap between — like a colon `:` with its dots
drawn as outlines instead of filled. The lighter pair to ɝ's
V-stack: same vertical-stack-with-gap structure, but rounded and
hollow instead of pointed and solid, signalling the lighter
unstressed quality.

<!-- Original brainstorm preserved below for reference; the
     "two stacked circles" option was selected. -->

Brainstorm options that were considered for ɚ:

- Two small circles stacked vertically (like the degrees symbol `°` paired) — **selected**
- Two small vertical bars with a gap (like `‖` but smaller, with whitespace between)
- Some lighter form of the ɝ V-stack (smaller V's, dotted, or hollow)

The heuristic was "lighter mark for the unstressed form" so the
reader's eye can register stress visually. The hollow circles
selected pair cleanly with ɝ's solid V's.

### Other open shape questions

The 9 IPA characters not pre-flagged for new shape (θ, ʃ, ʒ, ː, ɪ,
ʊ, ɛ, ɔ, ɔɪ) render acceptably in standard IPA fonts. Whether
to give them consistent Nayana treatment is a font-phase question.
