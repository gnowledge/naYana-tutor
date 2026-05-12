# AGENTS.md — Project Handoff

This file orients a coding agent (or a new human collaborator) picking up the
Nayana project. It records architectural decisions, the current state, and
the conventions to work within. Read `README.md` first for project purpose
and motivation.

---

## Project in one paragraph

Nayana is a phased phonetic reform of English orthography. The reader
installs a font and (later) a browser extension. A preprocessor converts
English text to progressively more phonetic spelling, one ambiguity at a
time, each phase a new substitution rule. End state: text rendered as a
Latin-alphabet phonetic script, with IPA-only characters appearing in the
final phases for sounds Latin can't represent unambiguously. Underlying
encoding is **IPA Unicode** (non-negotiable); the **glyph shapes** are
where Nayana innovates.

Parent project: https://www.gnowledge.org/projects/naYana
(gnowledge lab, HBCSE/TIFR Mumbai).

---

## Architectural decisions (settled — do not relitigate)

**The reform happens in the preprocessor, not the font.** The preprocessor
takes English text + a phase number, looks up each word's pronunciation in
CMUdict, applies the phase's substitution rules using grapheme→phoneme
alignment, emits rewritten text. The font's job is purely typographic:
render whatever characters appear.

**Encoding is IPA Unicode.** When phases eventually introduce non-Latin
characters (ə, θ, ð, ʃ, ʒ, ŋ), they use canonical IPA codepoints (U+0259,
U+03B8, etc.). The font draws these with Nayana-designed shapes; the
underlying text is standard IPA so it remains interoperable with TTS,
linguistic tools, and IPA-aware software.

**Phases are reader-side, not document-side.** A user at phase 3 sees
phases 1–3 applied to any document. The user advances at their own pace.
Original English text is always preserved as a `data-original` attribute so
the reader can hover any rewritten word to see what it was. Reversibility
is total.

**One font, many phases.** The font is `Nayana-Regular.otf`. Phases turn
on/off via OpenType feature toggles (`ss01`, `ss02`, ...). New phases ship
as font updates and/or catalogue updates, never as new font files. The
phase rule system is in the preprocessor; the font supplies glyphs.

**General American dialect is the v1 reference.** CMUdict is GA. RP and
others come later. Schwa (/ə/) and stressed schwa (/ʌ/) are distinct
phonemes following CMUdict's distinction.

**`y` is consonant-only in Nayana.** `y` represents /j/ only (yes,
yellow). The vowel uses of `y` (happy, gym, my) get rewritten to the
appropriate vowel glyph in a later phase. No conditional behavior.

**Diphthongs are emergent, not engineered.** Adjacent vowel glyphs with
the vowel_marker (ss01) feature visually run together because of the
horizontal stroke padding. This is a feature, not a bug. We do not design
separate diphthong glyphs.

**Mirror-image / IPA tension policy.** Where IPA's glyph choices create
cognitive friction (mirror pairs, near-duplicates), Nayana picks different
shapes. But the Unicode codepoint remains the IPA one. Only the glyph
design changes.

**Alignment is owned, not borrowed.** The grapheme→phoneme corpus is
generated locally with Phonetisaurus (BSD-3-Clause) from CMUdict. We do
not depend on third-party aligned corpora of unclear licensing. The
pipeline is reproducible: `npm run fetch-cmudict && npm run align-cmudict`.

**Multi-pronunciation policy: first-wins, with alternates surfaced.**
When CMUdict lists multiple pronunciations for a word (e.g. *celtic*
/sɛltɪk/ and /kɛltɪk/), the engine rewrites under the first by default.
Other pronunciations that produce a different rewrite are attached to the
output as alternates; the test harness shows them in a click-to-pick
popover. Reader choices persist in `localStorage` and are honored on
subsequent rewrites.

---

## Repository structure

The project is two parallel codebases under one repo, plus shared data:

```
nayana/                          (the repo)
├── src/                         Font build pipeline (Python + FontForge)
│   ├── build.py                 CLI entry point with --phases flag
│   └── nayana/                  Python package
│       ├── __init__.py          VERSION, FAMILY_NAME
│       ├── config.py            Tunable parameters per phase
│       ├── font_io.py           open/save/metadata helpers
│       └── phases/
│           ├── base.py          Phase base class + GSUB helpers
│           ├── vowel_marker.py  First phase: baseline stroke under vowels
│           └── __init__.py      Phase REGISTRY
│
├── fonts/source/                Comic Neue (downloaded by `make download`)
├── fonts/output/                Generated Nayana-Regular.otf
│
├── engine/                      The preprocessor (Node.js)
│   ├── src/
│   │   ├── dictionary.js        CMUdict + alignment loader, ARPAbet→IPA
│   │   ├── catalogue.js         Loads ambiguity catalogue (YAML)
│   │   ├── rewrite.js           Position-based rewrite over aligned pairs
│   │   ├── process.js           Walks HTML, picks pron, emits alternates
│   │   └── server.js            Express test-harness server
│   ├── data/
│   │   ├── ambiguity-catalogue.yaml   Phase definitions, hand-edited
│   │   ├── cmudict.txt          Downloaded by `npm run fetch-cmudict`
│   │   ├── aligned-cmudict.corpus     Generated by `npm run align-cmudict`
│   │   ├── cmudict.json         Compiled by `npm run build`
│   │   ├── catalogue.json       Compiled by `npm run build`
│   │   ├── cmudict-sample.txt   Tiny fallback for offline testing
│   │   └── cmudict-sample.corpus      Aligned counterpart of the sample
│   ├── public/                  Test harness web UI
│   │   └── manifesto/           Published manifesto + bundled font
│   ├── scripts/                 fetch-cmudict, build-cmudict,
│   │                            build-catalogue, build-aligned-cmudict
│   └── tests/                   node:test suites (one file per phase)
│
├── samples/                     HTML test pages for the font
├── tests/                       pytest tests for the font
├── docs/
│   ├── roadmap.md               Phase-based roadmap (current!)
│   ├── structure.md             Repo layout reference
│   ├── ofl-compliance.md        OFL 1.1 obligations
│   ├── missing-alignments.md    488 entries Phonetisaurus drops; strategy
│   └── phases/                  One file per shipped phase
│
├── Makefile                     Font build automation
└── README.md
```

The font build (`src/`) is Python, FontForge-driven. The preprocessor
(`engine/`) is Node.js. They share the IPA Unicode encoding decision but
no runtime code; they coexist in the repo because they're the two halves
of the same project.

---

## Current state

### Font
- **vowel_marker (`ss01`)** — shipped. Adds a horizontal stroke at
  baseline beneath each lowercase Latin vowel. Pure GSUB.
- Capital vowels (A, E, I, O, U) not yet handled — small overdue
  follow-up.

### Engine — phases 1–4 shipped
All phases use position-based grapheme→phoneme alignment:

| Phase | Rule(s)                          | Examples                                  |
|-------|----------------------------------|-------------------------------------------|
| 1     | `ph → f`                         | philosophy → filosofy                     |
| 2     | `c → k`, `c → s`, `cc → k`       | city → sity, account → akount             |
| 3     | `ck → k`                         | clock → klok, jacket → jaket              |
| 4     | `kn → n`, `wr → r`, `mb → m`     | knife → nife, write → rite, comb → kom    |

Each rule fires only when alignment confirms the grapheme matches the
expected phoneme. This handles tricky cases by construction:
*shepherd* (alignment is `p}P h}_`, so `ph→f` does not fire) and
*number* (alignment is `m}M b}B`, so `mb→m` does not fire).

67 unit tests cover positives, exception cases, capitalization
preservation, and multi-rule composition.

### Test harness (engine/public/)
- Phase slider 0..N
- Multi-pronunciation picker (click words with the `▾` marker)
- Reader preferences persisted in `localStorage`
- Per-phase demo text auto-loads on phase change (unless user has typed
  their own)
- Progression badge `★ phase N` tracks the highest phase the reader has
  ever transformed at (`localStorage`)
- URL fetch tab proxies through the server, strips nav/aside/footer
  noise, processes article body

### Manifesto
- Published at `engine/public/manifesto/index.html`
- Self-contained: HTML + markdown source + bundled font
- Loaded at `/manifesto/` when the engine server runs
- Designed to be uploaded as a static unit to any host

---

## Conventions and preferences

- **No premature roadmap.** Don't write phase N+1 designs until phase N
  ships. Add phases as they happen. `docs/roadmap.md` reflects shipped +
  in-progress only.
- **No version numbers in filenames.** Single `Nayana-Regular.otf`
  forever. Phases are OpenType feature toggles, not file versions.
- **No new repos.** Everything lives in this one repo. Browser extension
  when we get there will be a new top-level directory.
- **Browser plugin comes later.** The engine is currently a correctness
  prototype. Plugin/packaging/distribution work waits until "most phases"
  pass tests and the cumulative output is a clean phonetic Latin script.
  Don't propose extension scaffolding while phase work is in flight.
- **Field testing trumps theory.** When a question is "will users prefer
  X or Y," prototype both and let the user run them rather than arguing
  in the abstract.
- **Stay generic.** No `engine/src/build_nayana_v2.py`. Architecture is
  phase-agnostic; specifics live in catalogue YAML and config files.
- **Honest pushback expected.** If a proposal conflicts with earlier
  decisions, say so plainly with the reasoning. Don't quietly comply.

---

## How to run things

### Font

```bash
make download                    # fetch Comic Neue (one-time)
make build                       # produces fonts/output/Nayana-Regular.otf
make test                        # runs python tests
make sample                      # copies font + opens samples/test.html
```

### Engine

```bash
cd engine
npm install
npm run fetch-cmudict            # one-time, downloads full CMUdict

# One-time alignment build (Phonetisaurus, ~10–15 min)
python3 -m venv .venv
.venv/bin/pip install phonetisaurus
npm run align-cmudict            # writes data/aligned-cmudict.corpus

npm run build                    # compiles cmudict + catalogue to JSON
npm test                         # runs the test suite
PORT=5050 npm start              # serves test harness
```

The font must be copied into `engine/public/fonts/Nayana-Regular.otf`
for the harness to display Nayana's glyphs (otherwise harness still
works, just renders in browser default sans). The manifesto's font is
already bundled at `engine/public/manifesto/Nayana-Regular.otf`.

---

## Adding a new phase — concrete recipe

1. **Pick a candidate.** Spot-check Phonetisaurus alignment on
   representative words to confirm per-pair fit. Look for words that
   align as a single grapheme to a single phoneme (e.g. `ck}K`, `kn}N`)
   — these are clean rule candidates. Words where the digraph is split
   (e.g. `q}K u}W` for `qu`) need engine extension first.
2. **Add the phase to** `engine/data/ambiguity-catalogue.yaml`:
   `number`, `name`, `description`, `rationale`, `rules`, `demoText`.
   The `demoText` should be cumulative — extend the previous phase's
   demo with a new paragraph that exercises the new rule, so the reader
   sees one continuous narrative as they progress through phases.
3. **Add tests** at `engine/tests/phaseN.test.js`. Cover positives,
   exception cases (especially negatives where alignment correctly
   prevents the rule from firing), and cross-phase composition.
4. **Verify**: `npm run build`, `npm test`, restart server, check in
   browser.
5. (Optional) Add `docs/phases/<phase-name>.md` to mirror the
   `vowel_marker.md` precedent.

---

## How rule application works (read this before touching rewrite.js)

Each pronunciation entry in the dictionary carries a `pairs` array:

```js
[
  { graphemes: 'ph', phonemes: ['F'] },
  { graphemes: 'i',  phonemes: ['IH1'] },
  { graphemes: 'l',  phonemes: ['L'] },
  ...
]
```

A rule has shape `{ name, from, to, phoneme }`. It fires on a pair when:
1. `pair.graphemes.toLowerCase() === rule.from.toLowerCase()`
2. `rule.phoneme` appears in `pair.phonemes` (after stripping stress
   digits — so a rule targeting `AE` matches `AE0`/`AE1`/`AE2`).

When a rule fires, the pair's graphemes are replaced with `rule.to`.
The final spelling is the concatenation of pair graphemes after all
rules have run, with original capitalization lifted back on top.

Rules within a phase compose by sequential application: rule N's output
feeds rule N+1. Order matters when rules target the same grapheme
(e.g. phase 2's `c→k` and `c→s` are mutually exclusive per pair, so
order is irrelevant; but if you add a rule that fires on `k` after
`c→k` has produced one, ordering matters).

488 entries in CMUdict fail to align under default Phonetisaurus
settings (mostly acronyms and foreign-origin words). Tracked in
`docs/missing-alignments.md` with three strategies for resolving them.
