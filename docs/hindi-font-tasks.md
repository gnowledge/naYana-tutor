# Nayana font: Hindi extension — design tasks

Adds Devanagari-source phonemes to the Nayana font so Hindi can be rendered
in nayana-IPA without introducing the Devanagari script. Same font family,
expanded coverage.

## Design principles

- Compositional: prefer combining marks over precomposed letters.
- Reuse before invent: existing glyphs (macron, dot-above, vowels) carry
  new meanings where context makes them unambiguous.
- Each mark has exactly one meaning given the base letter type
  (vowel vs consonant).

## Modifier vocabulary (final)

```
above vowel:      ̄ = long       ̇ = anusvāra     candrabindu = pure nasal
above consonant:  ̄ = aspirated
below consonant:  ̣ = retroflex
inside n:         ɲ (palatal nasal)
```

No mark collides with another in any valid base+mark combination.

---

## A. New outlines to draw

| # | Glyph | Codepoint | Class | Visual spec |
|---|---|---|---|---|
| 1 | Combining dot below | **U+0323** | combining mark (below) | Small filled circular dot, ~⅓ the diameter of the lowercase x-height. Sits centered horizontally below the base letter, with a small visual gap below the baseline/descender. |
| 2 | Combining candrabindu | **U+0310** | combining mark (above) | Half-bowl opening upward (lower arc of a circle) with a single small dot centered above the bowl's opening. Width ~half the x-height; sits above the base, above where macron would sit if stacked. |
| 3 | Latin small letter n with left hook (palatal nasal) | **U+0272** `ɲ` | base letter | An `n` shape, ~10–15% wider than regular `n` to accommodate visual breathing room, with a small filled dot placed inside the bowl (centered between the two stems, vertically mid-x-height). |

## B. Existing glyphs needing new anchor positions

| # | Glyph | Codepoint | What's needed |
|---|---|---|---|
| 4 | Macron (combining) | **U+0304** | Add an "above" anchor on every Hindi-relevant consonant (`p b t d k g m n r l s h` + ligatures `tesh.lig`, `dezh.lig`, plus the new `ɲ`) so macron can sit above a consonant for aspiration. Currently anchored only on vowels. |
| 5 | Combining dot above | **U+0307** | Verify/add "above" anchors on all Hindi vowels for anusvāra rendering: `a e i o u ā ī ū ē ō` (i.e. the bare letters and their macron-bearing forms via mark-to-mark). |

## C. Mark-to-mark stacking (mkmk)

Hindi text can put two marks on one vowel (e.g. long vowel + nasalization). Wire mkmk anchors so:

| # | Stack | Example | Resolves to |
|---|---|---|---|
| 6 | Macron + dot above | मेंं → e + macron + dot-above | macron sits closest to vowel; dot-above sits above macron |
| 7 | Macron + candrabindu | हाँ → a + macron + candrabindu | macron closest to vowel; candrabindu sits above macron |
| 8 | Consonant + dot below + macron | ठ → t + dot-below + macron (retroflex + aspirated) | dot-below independent; macron sits above (no stacking conflict) |

## D. Out of scope (confirmed)

- No `ʰ` U+02B0, no `ʱ` U+02B1 — aspiration is rendered via macron-on-consonant (task #4).
- No precomposed retroflex letters (`ʈ ɖ ɳ ɽ ɭ`) — composed at runtime via dot-below (task #1).
- No new tilde — `tildecomb` retains its English/general-IPA role; Hindi uses candrabindu (task #2) instead.

## Net deliverable

**3 new outlines + 2 anchor passes + 3 mkmk pairings** in `fonts/source/Nayana-Regular.sfd`, regenerated via `make build`.

---

## Phoneme coverage check (for reference)

Hindi phonemes that the font must render after this work is complete:

### Vowels
| Devanagari | nayana-IPA | Glyph source |
|---|---|---|
| अ | ə | existing `schwa` |
| आ | ā | `a` + macron |
| इ | ɪ | existing `uni026A` |
| ई | ī | `i` + macron |
| उ | ʊ | existing `uni028A` |
| ऊ | ū | `u` + macron |
| ए | ē | `e` + macron |
| ऐ | ɛ | existing `uni025B` |
| ओ | ō | `o` + macron |
| औ | ɔ | existing `uni0254` |

### Consonants (selected — retroflex and aspirated rows)
| Devanagari | nayana-IPA | Composition |
|---|---|---|
| ट | ṭ | `t` + dot-below |
| ठ | ṭ̄ | `t` + dot-below + macron |
| ड | ḍ | `d` + dot-below |
| ढ | ḍ̄ | `d` + dot-below + macron |
| ण | ṇ | `n` + dot-below |
| ड़ | ṛ | `r` + dot-below |
| प | p | existing |
| फ | p̄ | `p` + macron |
| ब | b | existing |
| भ | b̄ | `b` + macron |
| क | k | existing |
| ख | k̄ | `k` + macron |
| ग | g | existing |
| घ | ḡ | `g` + macron |
| च | tʃ | existing `tesh.lig` |
| छ | t̄ʃ | `tesh.lig` + macron |
| ज | dʒ | existing `dezh.lig` |
| झ | d̄ʒ | `dezh.lig` + macron |
| ञ | ɲ | new outline (task #3) |
| ङ | ŋ | (out of scope — rare in Hindi; revisit if needed) |

### Nasal marks
| Devanagari | nayana-IPA | Composition |
|---|---|---|
| ं (anusvāra, before stop) | homorganic nasal | converter outputs `m`/`n`/`ɳ`/`ɲ`/`ŋ` |
| ं (anusvāra, elsewhere) | vowel + dot-above | `V` + U+0307 |
| ँ (candrabindu) | vowel + candrabindu | `V` + U+0310 (new outline, task #2) |
