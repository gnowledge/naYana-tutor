# Nayana Engine

The phased phonetic rewriting engine for the Nayana project.

Takes English text, looks up each word's pronunciation in CMUdict, applies
the phase-specific substitution rules from the ambiguity catalogue, and
emits the rewritten text with originals preserved for hover-to-reveal.

This is a Node.js library with a small local test-harness web server. The
same engine code will later power a browser extension (no server required
in that context); the server exists only so we can iterate on the
linguistic logic without browser-extension overhead.

## Quick start

```bash
cd engine/
npm install
npm run fetch-cmudict     # downloads full CMU pronouncing dictionary
npm run build             # compiles cmudict and catalogue to runtime JSON
npm start                 # serves http://localhost:3000
```

If `fetch-cmudict` can't reach the internet, the build falls back to the
hand-curated `data/cmudict-sample.txt` (~100 words covering ph→f testing).

### One-time alignment build (required from phase 2 onwards)

Phase 2 and beyond use position-based grapheme→phoneme matching, which
needs an aligned CMUdict. We produce it locally with Phonetisaurus:

```bash
python3 -m venv .venv
.venv/bin/pip install phonetisaurus
npm run align-cmudict     # ~10–15 min EM run, writes data/aligned-cmudict.corpus
```

The output is deterministic given identical input, so this only needs to
re-run when CMUdict updates.

To put the Nayana font into the harness:

```bash
cp ../fonts/output/Nayana-Regular.otf public/fonts/
```

If the font is missing, the harness still works — vowel markers just
don't appear.

## Architecture

```
src/
├── dictionary.js   CMUdict lookup, ARPAbet → IPA conversion
├── catalogue.js    loads ambiguity catalogue, returns rules for a phase
├── rewrite.js      core: applies a rule list to a single word
├── process.js      walks HTML/text, calls rewrite() per word, wraps changed words
└── server.js       Express server with /api/process, /api/fetch, /api/phases

data/
├── ambiguity-catalogue.yaml   the phase definitions, hand-edited
├── catalogue.json             built from yaml
├── cmudict-sample.txt         small offline-test dictionary
└── cmudict.json               built from cmudict.txt or cmudict-sample.txt

public/
├── index.html      test harness UI
├── style.css       loads Nayana font, styles changed-word highlights
├── app.js          client-side: slider, fetch /api, render results
└── fonts/          Nayana-Regular.otf goes here

scripts/
├── fetch-cmudict.js   downloads CMUdict from upstream
├── build-cmudict.js   converts CMUdict text to runtime JSON
└── build-catalogue.js converts YAML catalogue to runtime JSON

tests/
└── rewrite.test.js    Unit tests for the rewrite engine (17 tests)
```

## How rules apply

A rule is a substitution: "replace grapheme `from` with grapheme `to`
whenever it spells phoneme `phoneme`." Example:

```yaml
- name: "ph→f"
  phoneme: "f"
  from: "ph"
  to: "f"
```

The engine fires a rule only when **both** conditions hold:

1. The grapheme (`ph`) appears in the spelling
2. The phoneme (`/f/`) appears in the pronunciation

This double-check is what prevents over-application. `philosophy` has
`ph` in spelling AND `f` in pronunciation, so the rule fires. `shepherd`
has `ph` in spelling but NO `f` in pronunciation (it's `/ʃɛpɚd/`,
`p` + `h` across a morpheme boundary), so the rule is skipped.

This is verified by the test suite — see `tests/rewrite.test.js`.

## Adding a phase

1. Edit `data/ambiguity-catalogue.yaml`: add a new `phases:` entry with a
   `number`, `name`, `description`, and one or more `rules`.
2. Run `npm run build` to recompile.
3. Restart the server.
4. The slider in the harness automatically adapts to the new max phase.
5. Add tests in `tests/` for the new rule's behavior, especially
   exception cases.

## API endpoints

The local server exposes three endpoints, useful for debugging and
also for any future tooling:

- `GET /api/phases` — list available phases
- `POST /api/process` — body: `{ text | html, phase }`. Returns rewritten output.
- `POST /api/fetch` — body: `{ url, phase }`. Server fetches the URL (bypassing
  browser CORS), extracts the main article content, processes it.

## Tests

```bash
npm test
```

Runs the rewrite engine test suite. Currently 17 tests covering:
- Basic substitution (philosophy → filosofy, phone → fone, etc.)
- Multiple substitutions in one word (photograph → fotograf)
- Critical exception cases (shepherd, uphill, uphold, loophole NOT rewritten)
- Capitalization preservation (Phone → Fone, PHONE → FONE)
- Unknown words pass through
- Phase 0 = no changes
