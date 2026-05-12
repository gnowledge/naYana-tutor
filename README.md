# Nayana

**A phased phonetic reform of English orthography, delivered as an OpenType font.**

Nayana is a single, evolving font that gradually transitions English text
toward IPA-aligned phonetic spelling. Each phase introduces one visual
change. Readers acclimate to it before the next is layered on. All
phases ship in the same font; users opt into each via OpenType feature
toggles (`ss01`, `ss02`, ...).

The font is a derivative of [Comic Neue](https://comicneue.com) by Craig
Rozynski, used under the SIL Open Font License 1.1.

## Project context

Part of the broader [naYana project](https://www.gnowledge.org/projects/naYana)
of the gnowledge lab at the Homi Bhabha Centre for Science Education,
TIFR Mumbai. naYana proposes a complete IPA-mapped script; this
repository implements a phased adoption path designed to lower the
cold-start cost.

See [docs/roadmap.md](docs/roadmap.md) for the full phasing plan.

## Quick start

### Prerequisites

- FontForge with Python bindings
  - Ubuntu/Debian: `sudo apt install fontforge python3-fontforge`
  - macOS: `brew install fontforge`
  - Windows: [official installer](https://fontforge.org/en-US/downloads/windows/)
- Python 3.8+ and `pip install fonttools pytest`

### Build

```bash
make download    # fetch Comic Neue
make build       # build with default phases (currently: vowel_marker)
make sample      # copy font into samples/, then open samples/test.html
```

To enable additional phases:

```bash
# All currently registered phases
make build-all

# A specific subset
make build PHASES="vowel_marker schwa_marker"

# See what's available
make list-phases
```

## Architecture

The build is a Python pipeline. Each *phase* is a self-contained module
that contributes glyph variants and GSUB rules. New phases plug in
without disturbing existing ones.

```
src/
├── build.py                Entry point: parses CLI, dispatches to phases
└── nayana/
    ├── __init__.py         Version, family name, derivative copyright
    ├── config.py           Tunable parameters for all phases
    ├── font_io.py          Open / save / metadata helpers
    └── phases/
        ├── __init__.py     Phase registry
        ├── base.py         Phase base class + GSUB helpers
        └── vowel_marker.py First phase: baseline stroke under vowels
```

To add a new phase:

1. Create `src/nayana/phases/your_phase.py` with a class subclassing
   `Phase`.
2. Add tunable parameters to `src/nayana/config.py`.
3. Register the class in `src/nayana/phases/__init__.py` (`REGISTRY`).
4. Add tests in `tests/`.
5. Update `docs/roadmap.md` and `docs/phases/your-phase.md`.

The font's filename and family name don't change between phases. What
changes is which OpenType features the user enables. A reader who has
been using the font for six months simply turns on the next `ssNN` toggle
when they're ready.

## Repository layout

```
nayana/
├── src/                    Build pipeline (Python + FontForge)
├── fonts/source/           Upstream fonts (downloaded at build)
├── fonts/output/           Generated derivative font
├── samples/                HTML test pages
├── tests/                  pytest validation
├── docs/                   Design notes, roadmap, phase descriptions
├── scripts/                Inspection and helper utilities
├── Makefile                Build automation
└── .github/workflows/      CI
```

See [docs/structure.md](docs/structure.md) for full details.

## Roadmap

- **vowel_marker** (current): baseline stroke under each Latin vowel.
  Pure GSUB, no preprocessing required.
- **pronounced_vowel** (planned): adds CMUdict preprocessor; stroke
  appears only under voiced vowels.
- **schwa_marker** (planned): unstressed vowels get a distinct modifier.
- **long_short** (planned): long and short vowels become visibly distinct.
- **diphthong** (planned): vowel digraphs render as unified phonemes.
- **glyph_replacement** (planned): Latin vowel letters replaced with
  naYana symbols.

Each is a phase module, not a separate font version.

## License

- **Source code** (`src/`, `scripts/`, `tests/`): MIT. See `LICENSE-CODE`.
- **Documentation** (`docs/`, READMEs): CC BY 4.0. See `LICENSE-DOCS`.
- **Generated fonts** (`fonts/output/*.otf`): SIL Open Font License 1.1
  (inherited from Comic Neue). See `fonts/output/OFL.txt`.

## Credits

- Original font: Comic Neue by Craig Rozynski.
- naYana project: Nagarjuna G., Vickram Krishna et al., gnowledge lab,
  HBCSE/TIFR.
- See `CONTRIBUTORS.md`.

## Contributing

See `CONTRIBUTING.md`.
