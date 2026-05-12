# CLAUDE.md — Project Handoff

This file orients a Claude Code agent picking up the Nayana project. It
records decisions, current state, and the open work. It is not a tutorial
on the project's purpose — read `README.md` for that.

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
CMUdict, applies the phase's substitution rules, emits rewritten text.
The font's job is purely typographic: render whatever characters appear.

**Encoding is IPA Unicode.** When phases eventually introduce non-Latin
characters (ə, θ, ð, ʃ, ʒ, ŋ), they use canonical IPA codepoints (U+0259,
U+03B8, etc.). The font draws these with Nayana-designed shapes; the
underlying text is standard IPA so it remains interoperable with TTS,
linguistic tools, and IPA-aware software.

**Phases are reader-side, not document-side.** A user at phase 3 sees
phases 1–3 applied to any document. The user advances at their own pace.
Original English text is always preserved as a data attribute so the
reader can hover any rewritten word to see what it was. Reversibility is
total.

**One font, many phases.** The font is `Nayana-Regular.otf`. Phases turn
on/off via OpenType feature toggles (`ss01`, `ss02`, ...). New phases ship
as font updates and/or catalogue updates, never as new font files. The
phase system is in the preprocessor; the font supplies glyphs.

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

---

## Repository structure

The project is organized as two parallel codebases under one repo, plus
shared data:

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
│   │   ├── dictionary.js        CMUdict loader, ARPAbet→IPA conversion
│   │   ├── catalogue.js         Loads ambiguity catalogue (YAML)
│   │   ├── rewrite.js           Applies rules to one word
│   │   ├── process.js           Walks HTML, calls rewrite() per word
│   │   └── server.js            Express test-harness server
│   ├── data/
│   │   ├── ambiguity-catalogue.yaml   Phase definitions, hand-edited
│   │   ├── cmudict.txt          Downloaded by `npm run fetch-cmudict`
│   │   ├── cmudict.json         Compiled by `npm run build`
│   │   ├── catalogue.json       Compiled by `npm run build`
│   │   └── cmudict-sample.txt   Tiny fallback for offline testing
│   ├── public/                  Test harness web UI
│   ├── scripts/                 fetch-cmudict, build-cmudict, build-catalogue
│   └── tests/                   pytest-style tests
│
├── samples/                     HTML test pages for the font
├── tests/                       pytest tests for the font
├── docs/
│   ├── roadmap.md               Phase-based roadmap (current!)
│   ├── structure.md             Repo layout reference
│   ├── ofl-compliance.md        OFL 1.1 obligations
│   └── phases/                  One file per shipped phase
│
├── Makefile                     Font build automation
└── README.md
```

The font build (`src/`) is Python, FontForge-driven. The preprocessor
(`engine/`) is Node.js. They share nothing at runtime; they coexist in
the repo because they're the two halves of the same project.

---

## Current state (Phase 1 SHIPPED)

### Font: `vowel_marker` (`ss01`)
- Adds a horizontal stroke at baseline beneath each Latin vowel
  (a, e, i, o, u).
- Pure GSUB. No preprocessing needed.
- 17 tests pass. OFL-compliant naming verified.
- **Caveat**: capital vowels (A, E, I, O, U) not yet handled. Trivial
  to add; deferred but should be done soon.

### Preprocessor: phase 1 — `ph→f`
- One rule: replace `ph` with `f` when pronunciation contains /f/.
- 17 unit tests pass (including the critical exception cases: shepherd,
  uphill, uphold, loophole — all containing `ph` but no /f/, so the
  rule correctly skips them).
- 6 regression tests for prototype-pollution bug (history below).
- The current rewrite engine uses **presence-based phoneme matching**
  (does the phoneme appear anywhere in the word?), not position-based.
  This works for `ph→f` but will need to change for phase 2 — see
  "Open work" below.

### Test harness
- `npm start` runs Express server. Defaults to port 3000 but accepts
  `PORT=NNNN npm start`.
- `/api/process` (POST) takes `{text, phase}`, returns rewritten HTML.
- `/api/fetch` (POST) takes `{url, phase}`, fetches and processes a
  remote page (CORS proxy).
- Browser UI at `/` has a textarea, URL tab, phase slider, hover-to-
  reveal-original on rewritten words.

### Bugs fixed
- **Makefile URL was wrong.** The Comic Neue path is
  `Fonts/OTF/ComicNeue/ComicNeue-Regular.otf`, not
  `Fonts/OTF/ComicNeue-Regular.otf`. Patched with `curl -fL` and a
  `file` check to fail loudly if download is HTML.
- **Prototype-pollution in dictionary.** Words like `constructor`,
  `toString`, `valueof` in CMUdict crashed `parseCmudictText` because
  `result['constructor']` returned the inherited Object method. Fixed
  with `Object.create(null)` throughout dictionary.js. Regression
  tests in place.
- **FontForge API issue.** `appendSFNTName('English (US)', 'Stylistic
  Set 01 Name', ...)` is not supported by FontForge's high-level
  Python API. Removed; ss01 still works, just shows as "ss01" in apps
  rather than the friendly name "Vowel Marker". Setting the friendly
  name requires writing FeatureParams records to GSUB referencing name
  table IDs 256-356. Deferred until we move font tooling to fontTools.

---

## Open work — Phase 2 (IN PROGRESS, not yet shipped)

**Phase 2 will be the c-ambiguity**: resolve `c` into `k` or `s`
depending on pronunciation. `cat → kat`, `city → sity`. This is the
original motivating example from the user's "filosafi" story (an
8-year-old wrote "filosofi" for "philosophy" because spelling-rules
are the obstacle, not phonemic awareness).

### The architectural change phase 2 requires

The current `applyRule` in `engine/src/rewrite.js` matches a rule when
the phoneme is *present anywhere* in the word's pronunciation. This is
adequate for `ph→f` because /f/ is unambiguous. It will fail on words
like `cliques` (/kliks/) — the engine sees both /k/ and /s/ present
and might apply `c→s` incorrectly.

The required upgrade: **position-based matching using
grapheme-phoneme alignment**. Each word's data should be a list of
(grapheme, phoneme) pairs from a Phonetisaurus alignment. Rules fire
at specific positions where the alignment confirms grapheme matches
phoneme.

### Proof of concept (DONE — verify before integrating)

A proof-of-concept exists in `/tmp/alignment-test/` (or wherever the
user extracted `alignment-poc.tar.gz`). It demonstrates alignment-aware
rewriting on the eight acid-test cases:

| Word        | Expected | Why it matters                              |
|-------------|----------|---------------------------------------------|
| cat         | kat      | c→k fires straightforwardly                 |
| city        | sity     | c→s fires                                   |
| cycle       | sykle    | both rules fire in one word                 |
| account     | akount   | `cc` aligned as single token → `cc→k` rule  |
| cello       | cello    | c is /tʃ/ — NEITHER rule fires              |
| Celtic      | keltik   | c→k despite following 'e' (no spelling rule)|
| ocean       | ocean    | c is /ʃ/ — NEITHER rule fires               |
| facade      | fasade   | c→s despite following 'a'                   |

All 8 pass with alignment-aware engine. The presence-based engine
would mishandle `cycle` and any word with multiple `c`'s of different
sounds (e.g. `cynical`: c→s, then c→k).

### Phase 2 integration plan

1. **Acquire aligned CMUdict.** Two options:
   - Fetch precomputed: https://github.com/ckw017/aligned-cmudict
     (single JSON file, MIT, ~10MB, one-off dump but format is stable).
   - Build from scratch: install Phonetisaurus
     (https://github.com/AdolfVonKleist/Phonetisaurus), run
     `phonetisaurus-align` on CMUdict (5-10 minutes one-time).
   - Recommend trying option 1 first.

2. **Verify alignment quality.** Spot-check at minimum: cat, city,
   cycle, account, cello, Celtic, ocean, facade, philosophy, shepherd,
   uphill. Confirm alignments match what the POC used.

3. **Migrate `engine/src/dictionary.js`** to parse the alignment
   format. Each word's entry becomes an array of `{graphemes, phonemes}`
   pairs. Keep the old format around if any code still depends on it,
   but new code uses alignment.

4. **Rewrite `engine/src/rewrite.js`** to apply rules at pair
   positions. Reference implementation: `alignment-test/aligned-engine.mjs`
   in the POC. Strip stress digits from phonemes for comparison
   (so AE1, AE2, AE0 all match a rule targeting AE).

5. **Add phase 2 rules to** `engine/data/ambiguity-catalogue.yaml`:
   ```yaml
   - number: 2
     name: "c → k or s"
     description: "Resolves the c-ambiguity per pronunciation"
     rules:
       - name: "c→k"
         phoneme: "K"      # ARPAbet, not IPA (alignment uses ARPAbet)
         from: "c"
         to: "k"
       - name: "c→s"
         phoneme: "S"
         from: "c"
         to: "s"
       - name: "cc→k"
         phoneme: "K"
         from: "cc"
         to: "k"
   ```

6. **Migrate phase 1 to the alignment format.** The `ph→f` rule
   becomes:
   ```yaml
   - name: "ph→f"
     phoneme: "F"
     from: "ph"
     to: "f"
   ```
   Phonetisaurus aligns `ph` as a single token `p|h}F`, so the
   grapheme is the literal string "ph". The existing 17 tests should
   still pass after migration.

7. **Add acid-test cases as permanent tests** in
   `engine/tests/`.

### Open design questions on phase 2

- **Should `cc→k` be its own rule, or generated automatically from
  `c→k`?** Aligned CMUdict has `cc` as a single token; the rule must
  literally target "cc". Probably explicit is cleaner. Same will apply
  to `ll`, `tt`, etc. in later phases.
- **What about `ch` cases?** `ch` is sometimes /tʃ/ (chip), sometimes
  /k/ (school), sometimes /ʃ/ (machine). Phase 2 should NOT touch
  these — defer to a future "ch-resolution" phase. The current rules
  only target `c` and `cc`, not `ch`.
- **Should `qu→kw` be in phase 2?** It's structurally different
  (introduces a letter rather than removing one). Recommend a separate
  phase.

---

## What's after phase 2 (sketch, not committed)

The agreed approach: **do not write the full roadmap. Add phases as
they're implemented.** The current "roadmap" in `docs/roadmap.md`
should only list shipped + currently-in-progress phases. Speculative
phases beyond phase 2 are intentionally absent.

Candidates that are likely-good early phases (each one rule, clean
exception handling):

- `ph→f` (shipped as phase 1)
- `c → k/s` (in progress as phase 2)
- `ck → k` (cleanest possible rule, no exceptions)
- `qu → kw` (introduces a letter; visually striking)
- `x → ks` (introduces a letter; small frequency)
- `s → z` (the regular plural; high frequency, visually disruptive)

Don't commit to ordering past phase 2 until phase 2 ships and field
testing tells us what users find easy vs. hard.

The ultimate end-state is full IPA Unicode with Nayana glyphs. That's
far in the future. Focus on the next phase only.

---

## Conventions and preferences for the agent

- **No premature roadmap.** Don't write phase 3+ designs until phase 2
  ships. Add phases as they happen.
- **No version numbers in filenames.** Single `Nayana-Regular.otf`
  forever. Phases are OpenType feature toggles, not file versions.
- **No new repos.** Everything lives in this one repo. Browser
  extension when we get there will be a new top-level directory.
- **Field testing trumps theory.** When a question is "will users
  prefer X or Y," prototype both and let the user run them rather than
  arguing in the abstract.
- **Stay generic.** No `engine/src/build_nayana_v2.py`. Architecture
  is phase-agnostic; specifics live in catalogue YAML and config files.
- **Honest pushback expected.** If the user proposes something that
  conflicts with earlier decisions, say so plainly with the reasoning.
  Don't quietly comply.

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
npm run build                    # compiles dictionary + catalogue to JSON
npm test                         # runs Node.js test suite
PORT=5000 npm start              # serves test harness
```

The font must be copied into `engine/public/fonts/Nayana-Regular.otf`
for the harness to display it (otherwise harness still works, just
renders in browser default sans).

---

## Where I (previous agent) left off

The proof-of-concept for alignment-aware rewriting is built and tested.
The user is migrating to Claude Code to continue. The next concrete
step is to either:

(a) fetch `ckw017/aligned-cmudict`, verify the acid-test alignments
    match the POC, and proceed with phase 2 integration; OR
(b) build Phonetisaurus locally, run alignment on full CMUdict, and
    proceed.

Option (a) is faster if the file is good quality. Option (b) is more
self-contained but requires building Phonetisaurus (C++, OpenFst).
Recommend trying (a) first.

After phase 2 ships, the next decisions are:
- Capital-vowel patch for the font (small, overdue)
- Browser extension scaffolding (the test harness is the runtime
  equivalent; extension is the deployment form)
- Phase 3 (TBD based on phase 2 learnings)
