# Repository Structure

```
nayana/
├── README.md                  Project overview, quick start
├── Makefile                   build / test / package / inspect
├── FONTLOG.txt                OFL-convention changelog
├── CONTRIBUTING.md / CONTRIBUTORS.md
├── LICENSE-CODE               MIT for src/, scripts/, tests/
├── LICENSE-DOCS               CC BY 4.0 for docs/
├── .gitignore / .gitattributes
│
├── src/                       The build pipeline
│   ├── build.py               CLI entry point. Parses --phases, dispatches
│   └── nayana/                Python package
│       ├── __init__.py        VERSION, FAMILY_NAME, derivative copyright
│       ├── config.py          Tunable parameters for all phases
│       ├── font_io.py         open / save / metadata helpers
│       └── phases/
│           ├── __init__.py    Phase REGISTRY
│           ├── base.py        Phase base class + GSUB helpers
│           └── vowel_marker.py   ss01 — first phase
│           # Future: pronounced_vowel.py, schwa_marker.py, ...
│
├── fonts/
│   ├── source/                Upstream fonts (Comic Neue etc.)
│   │   ├── ComicNeue-Regular.otf  (downloaded by `make download`)
│   │   └── README.md          Provenance and license info
│   └── output/                Generated derivative fonts
│       ├── Nayana-Regular.otf  (built by `make build`)
│       ├── OFL.txt            Ships with the font
│       └── README.md
│
├── samples/                   Browser test pages
│   ├── test.html              Interactive test page (toggleable phases)
│   └── README.md
│
├── tests/                     pytest validation suite
│   ├── conftest.py
│   └── test_font_structure.py    Phase-aware tests
│
├── docs/
│   ├── structure.md           This file
│   ├── roadmap.md             Phase-based roadmap
│   ├── ofl-compliance.md      OFL 1.1 obligations and how we meet them
│   └── phases/                One file per phase
│       └── vowel_marker.md
│
├── scripts/                   Helper utilities
│   ├── inspect_gsub.py        Dump GSUB to readable form
│   └── compare_renders.py     (stub) visual regression helper
│
├── build/                     Gitignored. Generated artifacts, dist zips.
│
└── .github/workflows/build.yml   CI: build, test, upload artifact
```

## Adding a new phase

1. Create `src/nayana/phases/your_phase.py`:

   ```python
   from nayana.phases.base import Phase, add_single_substitution_lookup
   from nayana.config import YOUR_PHASE

   class YourPhase(Phase):
       name = "your_phase"
       feature_tag = "ss02"
       description = "What this phase does in one line"

       def apply(self, font):
           # mutate font: add glyph variants, register GSUB lookup
           ...
   ```

2. Add config to `src/nayana/config.py`:

   ```python
   YOUR_PHASE = {
       "param1": ...,
       "param2": ...,
   }
   ```

3. Register in `src/nayana/phases/__init__.py`:

   ```python
   from nayana.phases.your_phase import YourPhase

   REGISTRY = {
       "vowel_marker": VowelMarkerPhase,
       "your_phase": YourPhase,
   }
   ```

4. Add a test in `tests/test_font_structure.py` that skips when the
   phase isn't built (so partial builds still pass).

5. Document the phase in `docs/phases/your_phase.md` and add a row to
   the roadmap table in `docs/roadmap.md`.

The Makefile and CI need no changes; they discover phases via the
registry.

## Versioning

Single source of truth in `src/nayana/__init__.py`:

```python
VERSION = "0.1.0"
```

The Makefile and CI both read this. Bump it at release time.

The font file is always named `Nayana-Regular.otf` regardless of
version. Version information lives inside the font's `name` table
(record ID 5). Distribution zips include the version: `Nayana-0.1.0.zip`.
