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
| ŋ | U+014B | /ŋ/ (ng) | sing → sɪŋ | 12 | ☑ | ☑ | Recorded for font: refined extension of n |
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
| ɝ | U+025D | stressed r-colored | bird → bɝd | 14 | ☑ | ☑ | **OPEN** — see [R-colored vowels brainstorm](#r-colored-vowels-ɝ-and-ɚ) below. Family of paired-mark proposals (wedges, circles, vertical bars). |
| ɚ | U+025A | unstressed r-colored | teacher → tiːtʃɚ | 14 | ☑ | ☑ | **OPEN** — see [R-colored vowels brainstorm](#r-colored-vowels-ɝ-and-ɚ) below. The lighter half of the pair. |
| ɔ | U+0254 | open /ɔ/ | call → kɔːl | 16 | ☑ | ☐ | Open o — distinct from o |
| ɑ | U+0251 | cardinal /ɑ/ | hot → hɑːt | 16 | ☑ | ☑ | **DECIDED**: render as Greek `α` shape, drawn closer to the infinity sign `∝` (curl-with-extension form) so it reads visibly distinct from Latin a. Greek α matches the IPA's own one-story tradition and gives "hot" → "hαːt" |
| ɔɪ | ɔ + ɪ | /ɔɪ/ diphthong | boy → bɔɪ | 16 | ☑ | ☐ | Composed of ɔ and ɪ — could ligate or render sequentially |

---

## Summary

**Total IPA characters in the engine**: 19 (7 consonants + 12 vowel-related, including the length marker and one diphthong).

**Decided shapes** (6 IPA codepoints + 1 Latin letter):

| Character | Designed shape | Reason |
|-----------|----------------|--------|
| ð | Greek small `δ` | curve over closed circle, easy handwriting |
| tʃ | Latin `c` shape (ligature) | Sanskrit IAST; c unused in output |
| dʒ | Latin `j` shape (ligature) | Sanskrit IAST; j unused (Y is /j/) |
| ə | Baseline two-stroke (`=`-like) | Extends vowel-marker stroke; avoids rotation-of-e |
| æ | Latin `a` shape | a unused standalone in output; matches English's a-for-/æ/ |
| ɑ | Greek `α` (closer to `∝` infinity) | Phonetic match for cardinal /a/; visually distinct from Latin a |
| Latin `d` | Greek capital `Δ` | b/d mirror avoidance; ties to ð→δ family |

**Still open** (4 characters):

| Character | Status | Notes |
|-----------|--------|-------|
| ŋ | open | Refined extension of n (sketch only) |
| ʌ | open | Wedge with downward opening, longer base (sketch only) |
| ɝ | open | See R-colored vowels brainstorm below |
| ɚ | open | See R-colored vowels brainstorm below |

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

| Latin codepoint | Designed font shape | Reason |
|-----------------|---------------------|--------|
| Latin `d` (U+0064) | Greek capital `Δ` shape | Latin `d` is the mirror of `b`. Replacing the glyph with capital delta breaks the mirror confusion. Ties visually to ð → δ for the alveolar/dental d-family. IPA being case-less, capital delta has no IPA conflict. |

## Open design questions

### R-colored vowels (ɝ and ɚ)

These two IPA characters represent r-coloration applied to a vowel —
a quality of the vowel itself rather than a separate /r/ consonant.
Since the r is "not produced as a separate sound," the font can
visually mark it as a paired gap-style mark to the right, analogous
to how the length marker `ː` uses paired dots.

Brainstormed options for the gap-style mark (one for stressed ɝ,
one for unstressed ɚ — each has its own twist):

- **Two small wedges facing opposite** (like `>` and `<` or `▷ ◁` stacked)
- **Two small circles stacked vertically** (like the degrees symbol `°` paired)
- **Two small vertical bars with a gap** (like `‖` but smaller, with whitespace between)

Which mark goes with which form (stressed vs unstressed) is open. One
plausible heuristic: the visually heavier mark (filled wedges, solid
circles) for the stressed `ɝ`, the lighter mark (vertical bars,
hollow circles) for the unstressed `ɚ`.

### Other open shape questions

The 11 IPA characters not pre-flagged for new shape (θ, ʃ, ʒ, ː, ɪ,
ʊ, ɛ, æ, ɔ, ɑ, ɔɪ) render acceptably in standard IPA fonts. Whether
to give them consistent Nayana treatment is a font-phase question.
