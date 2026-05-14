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

## Consonants

| Symbol | Codepoint | Phoneme | Example | Phase | Keep | New shape | Notes |
|--------|-----------|---------|---------|-------|:----:|:---------:|-------|
| θ | U+03B8 | voiceless /θ/ (thin) | thin → θɪn | 11 | ☑ | ☐ | Greek theta — visually distinctive, may not need redesign |
| ð | U+00F0 | voiced /ð/ (this) | this → ðɪs | 11 | ☑ | ☑ | Proposed shape: δ-like — curve over closed circle, easy to handwrite |
| ʃ | U+0283 | /ʃ/ (sh) | ship → ʃɪp | 12 | ☑ | ☐ | Esh — already distinct |
| ʒ | U+0292 | /ʒ/ (zh) | vision → vɪʒən | 12 | ☑ | ☐ | Ezh — already distinct |
| ŋ | U+014B | /ŋ/ (ng) | sing → sɪŋ | 12 | ☑ | ☑ | Recorded for font: refined extension of n |
| tʃ | t + ʃ | /tʃ/ (ch) | chip → tʃɪp | 12 | ☑ | ☑ | Ligature: single Nayana glyph for the digraph |
| dʒ | d + ʒ | /dʒ/ (j) | judge → dʒʌdʒ | 13 | ☑ | ☑ | Ligature: matches tʃ treatment |

## Vowels

| Symbol | Codepoint | Phoneme | Example | Phase | Keep | New shape | Notes |
|--------|-----------|---------|---------|-------|:----:|:---------:|-------|
| ː | U+02D0 | length marker | meet → miːt | 8 / 9 | ☑ | ☐ | Triangular colon — pairs with iː uː ɔː ɑː |
| ə | U+0259 | schwa | about → əbaut | 10 | ☑ | ☑ | Proposed shape: baseline two-stroke (`=`-like), extending the vowel-marker stroke |
| ɪ | U+026A | short /ɪ/ | bit → bɪt | 13 | ☑ | ☐ | Small-cap I — distinct from i |
| ʊ | U+028A | short /ʊ/ | book → bʊk | 13 | ☑ | ☐ | Turned omega — not a Latin rotation |
| ɛ | U+025B | short /ɛ/ | bed → bɛd | 13 | ☑ | ☐ | Latin epsilon — distinct from e |
| æ | U+00E6 | /æ/ | cat → kæt | 13 | ☑ | ☐ | Ash ligature — already in Latin-1 |
| ʌ | U+028C | stressed /ʌ/ | cup → kʌp | 13 | ☑ | ☑ | Rotation-of-v concern. Suggested: wedge with downward opening, longer base |
| ɝ | U+025D | stressed r-colored | bird → bɝd | 14 | ☑ | ☑ | Reversed-ɛ-with-hook. Suggested: extend ɛ body with rhoticity stroke without mirroring |
| ɚ | U+025A | unstressed r-colored | teacher → tiːtʃɚ | 14 | ☑ | ☑ | Schwa-with-hook. Suggested: combine baseline schwa shape with rhoticity hook, distinct from r |
| ɔ | U+0254 | open /ɔ/ | call → kɔːl | 16 | ☑ | ☐ | Open o — distinct from o |
| ɑ | U+0251 | cardinal /ɑ/ | hot → hɑːt | 16 | ☑ | ☐ | Script a — distinct from two-story a |
| ɔɪ | ɔ + ɪ | /ɔɪ/ diphthong | boy → bɔɪ | 16 | ☑ | ☐ | Composed of ɔ and ɪ — could ligate or render sequentially |

---

## Summary

**Total IPA characters in the engine**: 19 (7 consonants + 12 vowel-related, including the length marker and one diphthong).

**Pre-flagged for new Nayana shape design** (8 characters):

| Character | Why |
|-----------|-----|
| ð | Proposed δ-like baseline shape |
| ŋ | Custom extension of n |
| tʃ | Ligature for the digraph |
| dʒ | Ligature for the digraph |
| ə | Baseline two-stroke (`=`-like) extension of vowel marker |
| ʌ | Rotation-of-v — needs distinct wedge form |
| ɝ | Reversed-ɛ — needs non-mirror rhoticity mark |
| ɚ | Turned-r — needs distinct rhoticity-with-schwa shape |

The remaining 11 characters are visually distinct in standard IPA fonts
and may not strictly require new shapes — but a consistent Nayana
treatment across the whole inventory is worth considering when the
font phase begins.

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
