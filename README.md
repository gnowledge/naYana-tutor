# Nayana for English

**A phased phonetic reform of English orthography.** v0.1 ships
General American English; other English varieties (RP, Indian English)
and other languages will follow as parallel projects. Each variety
wants its own phonetic spelling because each variety has its own
pronunciation — there's no universally "correct" Nayana spelling,
only the spelling that matches how a particular variety actually sounds.

Two halves of one project:

- **A font** (`Nayana-Regular.otf`, family name *Nayana English*) that
  draws the eventual phonetic glyphs, with phases enabled via OpenType
  feature toggles.
- **A preprocessor** that progressively rewrites English text using
  grapheme→phoneme alignment. Each phase is one new substitution rule.

Readers advance through phases at their own pace. The original spelling
is always recoverable — hover any rewritten word in the test harness.

→ **Why naYana?**
[*Returning Time to the Reader — On naYana*](engine/public/why/index.html)
(self-contained HTML; ships with the font bundled)

---

## How it looks

| Phase | Rule(s)                          | Examples                                  |
|-------|----------------------------------|-------------------------------------------|
| 1     | `ph → f`                         | philosophy → filosofy                     |
| 2     | `c → k`, `c → s`, `cc → k`       | city → sity, account → akount             |
| 3     | `ck → k`                         | clock → klok, jacket → jaket              |
| 4     | `kn → n`, `wr → r`, `mb → m`     | knife → nife, write → rite, comb → kom    |

Each phase is cumulative: a reader at phase 4 sees all four rule sets
applied. The rule fires only when alignment confirms the spelling matches
the pronunciation, so words like *shepherd* (where `ph` is /p/+/h/, not
/f/) and *number* (where the `b` is pronounced) are correctly left alone.

---

## Project context

Part of the broader [naYana project](https://www.gnowledge.org/projects/naYana)
of the gnowledge lab at the Homi Bhabha Centre for Science Education,
TIFR Mumbai. naYana proposes a complete IPA-mapped script; this
repository implements a phased adoption path designed to lower the
cold-start cost.

---

## Two codebases under one roof

- **`src/` + `fonts/` + `tests/`** — the font build (Python, FontForge).
  Builds `Nayana-Regular.otf` from a Comic Neue base.
- **`engine/`** — the preprocessor (Node.js) plus a local test harness
  (Express + browser UI) for trying the rules on text or whole web
  articles. Not the production runtime; that comes later as a browser
  extension once the rule set has matured.

The two share the IPA Unicode encoding decision but no runtime code.

---

## Quick start

### Font

Prerequisites: FontForge with Python bindings, Python 3.8+,
`pip install fonttools pytest`.

```bash
make download    # fetch Comic Neue
make build       # build with default phases (currently: vowel_marker)
make test        # python tests
make sample      # copy font into samples/, then open samples/test.html
```

### Engine

Prerequisites: Node 18+, Python 3 (for the one-time alignment build).

```bash
cd engine
npm install
npm run fetch-cmudict             # one-time, downloads CMUdict

# One-time alignment (Phonetisaurus, ~10–15 min)
python3 -m venv .venv
.venv/bin/pip install phonetisaurus
npm run align-cmudict

npm run build                     # compile dictionary + catalogue
npm test                          # run the test suite (67 tests)
PORT=5050 npm start               # serve test harness at http://localhost:5050
```

The test harness has a phase slider, a multi-pronunciation picker
(click any word with a `▾` marker), per-phase demo text that loads as
you advance, a progression badge that tracks the highest phase you've
read at, and a URL fetch tab for trying the engine on real articles.

---

## Repository layout

```
nayana/
├── src/                    Font build pipeline (Python + FontForge)
├── fonts/                  Comic Neue source + built Nayana-Regular.otf
├── engine/                 The preprocessor (Node.js)
│   ├── src/                Engine library
│   ├── data/               Catalogue YAML + CMUdict + alignment
│   ├── public/             Test harness UI + tutor + Why naYana? essay
│   ├── scripts/            Build/fetch/align scripts
│   └── tests/              Unit tests, one file per phase
├── samples/                HTML test pages for the font
├── tests/                  pytest validation for the font
├── docs/                   Design notes, roadmap, phase descriptions
├── scripts/                Font inspection / comparison helpers
└── Makefile                Font build automation
```

Detailed orientation for new contributors and coding agents:
**[AGENTS.md](AGENTS.md)**.

---

## Roadmap

`docs/roadmap.md` is the source of truth for shipped phases. We do not
commit to phase ordering past whatever is currently in flight — field
testing decides what comes next.

---

## License

- **Source code** (`src/`, `scripts/`, `tests/`, `engine/`): MIT.
  See `LICENSE-CODE`.
- **Documentation** (`docs/`, READMEs, essay prose): CC BY 4.0.
  See `LICENSE-DOCS`.
- **Generated fonts** (`fonts/output/*.otf`,
  `engine/public/why/Nayana-Regular.otf`): SIL Open Font License
  1.1 (inherited from Comic Neue). See `fonts/output/OFL.txt`.

---

## Credits

- Original font: [Comic Neue](https://comicneue.com) by Craig Rozynski.
- naYana project: Nagarjuna G., Vickram Krishna et al., gnowledge lab,
  HBCSE/TIFR.
- See `CONTRIBUTORS.md`.

---

## Contributing

See `CONTRIBUTING.md`.
