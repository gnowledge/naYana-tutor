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

**Script reflects pronunciation, not prescription.** Different English
varieties pronounce the same word differently. Indian English speakers
articulate /r/ where General American uses ɝ/ɚ, RP rounds vowels GA
leaves unrounded, etc. Each variety wants its *own* Nayana spelling
because each variety has its own pronunciation. There is no "correct"
or "incorrect" Nayana spelling for English in the abstract — there is
the spelling that matches how a particular variety actually sounds.

The v1 engine ships GA because GA has the cleanest open phonetic
data (CMUdict). Other varieties become parallel sub-projects that
share the font and writing system but swap in their own dictionaries:
"Nayana Indian English", "Nayana RP", etc. The font family name
("Nayana English") flags this scope explicitly; future families will
sit alongside it ("Nayana Hindi", "Nayana Telugu") rather than
replacing it.

**v1 ships English-only.** Deployment artefacts (font, tutor, browser
plugin when it lands) all carry "English" in their name and metadata.
Dialect/language expansion is post-v1.

**`y` is the canonical letter for /j/. `j` is reserved for the dʒ
ligature.** Two halves of one decision:

- `y` is consonant-only in Nayana — represents /j/ only. Holds for
  input y (yes, yellow stays as `y`) AND for engine-inserted /j/
  (use → yuːs, cute → kyuːt, music → myuːzɪk). Vowel uses of input
  y (happy, gym, my) get rewritten to the appropriate vowel glyph
  by phases 5/9/17 (y → ai when /aɪ/, y → iː when /iː/, y → ɪ when /ɪ/).
- `j` never appears bare in Nayana output. Input `j` is converted to
  the dʒ digraph by phase 13 (judge → dʒʌdʒ); the font then ligates
  d+ʒ to a single `j`-shaped glyph. So the visual `j` shape on the
  page always means /dʒ/, never /j/.

Any new rule that emits a /j/ phoneme into the spelling MUST emit
the letter `y`, not `j`. Failing to do so creates a real
ambiguity — readers parse a bare `j` as /dʒ/ via the ligature.

**Diphthongs are emergent, not engineered.** Adjacent vowel glyphs with
the vowel_marker (ss01) feature visually run together because of the
horizontal stroke padding. This is a feature, not a bug. We do not design
separate diphthong glyphs.

**Mirror-image / IPA tension policy.** Where IPA's glyph choices create
cognitive friction (mirror pairs, near-duplicates), Nayana picks different
shapes. But the Unicode codepoint remains the IPA one. Only the glyph
design changes.

**Font glyph design — visual vocabulary.** A consistent visual grammar
has been chosen for the IPA characters the engine emits. Recorded in
detail in `docs/font-glyph-checklist.md`. The settled rules:

- **Avoid mirror symmetries.** Pairs like `b/d` and `p/q` create reading
  confusion. Where a Latin letter has a mirror partner already in use,
  design a non-mirror replacement (e.g. Latin `d` → Greek capital `Δ`).
- **Avoid rotational symmetries.** `ə` is the rotation of `e`, `ʌ` is
  the rotation of `v`. Their Nayana shapes must not rotate any letter
  the reader already knows.
- **Reuse unused Latin letters.** Letters that don't appear in current
  Nayana output (`c`, `j`, `q`, `x`) are available as glyph slots —
  either as ligatures for IPA digraphs (tʃ → c, dʒ → j) or as the
  rendering shape for IPA codepoints with phonetic precedent
  (e.g. Sanskrit IAST: `c` for /tʃ/, `j` for /dʒ/).
- **Greek letters fill IPA codepoint slots.** IPA being case-less,
  Greek capitals have no codepoint conflict and provide clean shapes
  (Δ for Latin d, δ for ð, α for ɑ).
- **Modifiers form a vocabulary.** The acute accent is a general-purpose
  Nayana modifier (s → /ʃ/, j → /ʒ/). The degree sign marks stress
  (`=` for /ə/, `=` with `°` above for /ʌ/).
- **Stress is encoded by element weight.** ɝ (stressed) uses solid V's;
  ɚ (unstressed) uses hollow circles. ʌ (stressed) adds a degree mark
  to the schwa `=`.

12 of 19 IPA characters have decided shapes; 1 Latin letter (d) is
customized; 7 IPA characters keep their default IPA glyphs unless
revisited. See the checklist for the full mapping.

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
│   ├── font-glyph-checklist.md  Per-character font shape decisions
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
- **Glyph shape design phase in progress** — most IPA characters that
  need custom Nayana shapes have been decided (12 of 19 IPA + 1 Latin
  letter). See `docs/font-glyph-checklist.md` for the full inventory
  and the visual-vocabulary section in Architectural Decisions above.
  The actual FontForge work to draw the glyphs is the next concrete
  font-side step.

### Engine — phases 1–18 shipped
All phases use position-based grapheme→phoneme alignment, with three
extensions to the basic rule shape: epsilon rules (phoneme:null,
fires on silent-letter pairs), stress-specific rules (phoneme:"AH0",
exact match), and stressed-only rules (phoneme:"AH+", matches
stressed AH at any non-zero stress).

| Phase | Theme                                             | New IPA introduced |
|-------|---------------------------------------------------|--------------------|
| 1     | `ph → f`                                          | —                  |
| 2     | c-ambiguity: `c → k/s`, `cc → k`                  | —                  |
| 3     | `ck → k`                                          | —                  |
| 4     | silent letters: `kn → n`, `wr → r`, `mb → m`      | —                  |
| 5     | long-i: `i/y → ai` (when /aɪ/), `gh` cleanup      | —                  |
| 6     | long-a: `a/ay/ai/ey → ei`, silent-e               | —                  |
| 7     | o-family: /oʊ/ → ou, /aʊ/ → au, silent a/u/h      | —                  |
| 8     | long-u: /uː/ → uː                                 | ː (length marker)  |
| 9     | long-e: /iː/ → iː                                 | —                  |
| 10    | schwa: a/e/i/o/u → ə (when AH0)                   | ə                  |
| 11    | th split: /θ/ vs /ð/                              | θ, ð               |
| 12    | missing consonants: ʃ, tʃ, ʒ, ŋ                   | ʃ, ʒ, ŋ (+ tʃ)    |
| 13    | short vowels + /dʒ/                               | ɪ, ʊ, ɛ, æ, ʌ, dʒ |
| 14    | r-colored vowels                                  | ɝ, ɚ               |
| 15    | spelling cleanup (geminates, silent letters,…)    | —                  |
| 16    | vowel completion: ɔː, ɑː, ɔɪ + silent-l           | ɔ, ɑ, ɔɪ           |
| 17    | voicing: s → z, ed → t, ss → ʃ, y/e → ɪ           | —                  |
| 18    | qu, ea→ɪ, ps→s, silent-g                          | —                  |

Each rule fires only when alignment confirms the grapheme matches the
expected phoneme. This handles tricky cases by construction:
*shepherd* (alignment is `p}P h}_`, so `ph→f` does not fire) and
*number* (alignment is `m}M b}B`, so `mb→m` does not fire).

552 unit tests cover positives, exception cases, capitalization
preservation, multi-rule composition, the engine extensions, and the
verbatim-escape mechanism. (2 pre-existing failures in the "English"
word case — engine drops a `g` between ŋ and l; tracked, not blocking.)

The reform is functionally complete for everyday English text — every
English phoneme that has an IPA glyph has been introduced. Remaining
work is per-word edge cases (queue's odd alignment, dialectal variation,
very rare loanwords) rather than systematic phoneme coverage.

### Verbatim-escape mechanism
The engine accepts two equivalent escape syntaxes for preserving text
as-typed (no phoneme lookup, no rewrite):

- `` `text` `` — backtick pair, Markdown-style
- `[[text]]` — double brackets, robust on keyboards where backtick is
  a dead key (US-International, many EU layouts)

Used for proper nouns whose CMUdict transcription is wrong, foreign
loanwords, intentional IPA segments, code identifiers. Escaped text
emerges as `<span class="nayana-verbatim">…</span>` and is also
honoured by the TTS endpoint (brackets stripped before synth).

### Tutor (public/) — production-ready
- `/` — landing
- `/learn` — nine-lesson pedagogical tour (re-ordered for ease of
  learning, not engine-build order). Each lesson has a Why? box, per-
  character intros, a Try-it comparison table with per-word 🔊 audio.
- `/type` — two modes: (1) primary, type/paste English and watch it
  become naYana word-by-word with a ▶ Play button for full-sentence
  audio; (2) IPA composer for typing phonemes directly via shortcuts.
- `/read` — sketch (parallel-text passages, toggleable views). Real
  curated content is the post-deploy follow-up.
- `/manifesto/` — published manifesto, bundled font.
- `/download` — font download + per-OS install + upcoming-keyboard-layouts notice.
- `/faq` — 14 Q&As with in-page TOC.
- `/developer` — internal tools, acid tests, design philosophy.
- `/harness` — engine debug rig (phase slider, multi-pron picker,
  URL-fetch tab). Same as the original test harness, now under `/harness`.

Persistent nav + footer injected by `site.js`; cache-control set to
`no-cache` server-side so every reload always revalidates.

### TTS (espeak-ng + Piper)
- `POST /api/tts` returns `audio/wav`. Auto-routes by content: plain
  English → Piper (neural, ~150 ms cold, ~13 ms cached); IPA → espeak-ng.
- Piper binary + voice model (`en_US-lessac-medium`) live in `vendor/`
  (gitignored). `make piper` downloads them locally. Dockerfile pulls
  them at image build time via the dedicated `piper-fetcher` stage.
- Override the voice via `NAYANA_PIPER_VOICE=/path/to/other.onnx`.
- Per-word audio on `/learn` plays the row's English text through Piper
  (natural voice with the correct pronunciation). Per-sentence audio on
  `/type` plays the user's left-pane English input through Piper.

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

For local audio playback during development:

```bash
make piper                       # downloads Piper binary + voice (~90 MB)
```

Without this, `/api/tts` returns 500 errors for English text (espeak-ng
fallback still works for IPA-only requests).

---

## Deployment

### Resource expectations
- Container size: ~440 MB (font + engine + Piper + voice model)
- Bare-metal disk: ~150 MB code + 90 MB Piper artefacts
- RAM: ~250 MB at idle (CMUdict 130k words loaded into JS heap;
  doesn't grow under load)
- CPU: idle ~0%; one core for ~150 ms per Piper TTS request
- Listens on `$PORT` (default 8080), all interfaces, HTTP only —
  always front with a TLS-terminating reverse proxy

### Build artefacts that must exist before image build
The runtime image bundles compiled artefacts that take too long to
build in CI. Run these once on a dev machine before `docker build`:

```bash
cd engine
npm install
npm run fetch-cmudict            # ~5 MB CMUdict download
python3 -m venv .venv
.venv/bin/pip install phonetisaurus
npm run align-cmudict            # ~10–15 min — DO NOT do this in Docker
```

Both `engine/data/cmudict.txt` and `engine/data/aligned-cmudict.corpus`
must be present in the build context. Without them the image still
builds but falls back to the tiny sample dictionary (engine returns
mostly-untranscribed words).

### Docker (recommended)

```bash
docker build -t nayana-tutor .
docker run -d --name nayana-tutor \
  --restart unless-stopped \
  -p 8080:8080 \
  nayana-tutor
```

Four stages: `font-builder` (FontForge → .otf) · `engine-builder` (Node
+ cmudict.json compile) · `piper-fetcher` (downloads Piper binary +
voice at build time) · `runtime` (node:20-slim + espeak-ng + everything
above).

### Bare-metal

```bash
# System dependencies
apt-get install -y nodejs npm espeak-ng
make piper                       # vendor/piper + voice
cd engine && npm ci --omit=dev
npm run build                    # cmudict.json + catalogue.json

# Run
PORT=8080 NODE_ENV=production node src/server.js
```

systemd unit (`/etc/systemd/system/nayana-tutor.service`):

```ini
[Unit]
Description=naYana tutor
After=network.target

[Service]
Type=simple
User=nayana
WorkingDirectory=/opt/nayana/engine
Environment=PORT=8080
Environment=NODE_ENV=production
Environment=NAYANA_PIPER_BIN=/opt/nayana/vendor/piper/piper
Environment=NAYANA_PIPER_VOICE=/opt/nayana/vendor/piper-voices/en_US-lessac-medium.onnx
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Reverse proxy alongside another service

Pick a port that doesn't collide with the existing service (`ss -ltnp`
to inventory). Two routing options:

**Subdomain — recommended** (`nayana.example.com`). Cleanest URLs,
no path-prefix bookkeeping. Every URL inside the tutor is rooted at
`/` (`/learn`, `/api/tts`, `/fonts/Nayana-Regular.otf` …) so it just
works.

```nginx
# /etc/nginx/sites-available/nayana
server {
    listen 80;
    server_name nayana.example.com;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl http2;
    server_name nayana.example.com;

    ssl_certificate     /etc/letsencrypt/live/nayana.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nayana.example.com/privkey.pem;

    # /api/tts can take ~2s for a long Piper sentence — bump the
    # default 60s timeout only if you stream very large text.
    proxy_read_timeout 30s;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Caddy alternative (auto-TLS):

```
nayana.example.com {
    reverse_proxy 127.0.0.1:8080
}
```

**Path prefix** (`example.com/nayana/`) is possible but currently
requires rewriting every absolute URL in the tutor's HTML/JS to
include the prefix. Subdomain avoids this entirely. If subdomain
isn't an option, the work to support a base path lives in:
`engine/src/server.js` (route declarations), `engine/public/site.js`
(NAV_LINKS), and inline `fetch('/api/…')` calls in `type.html`.

### TLS
- Let's Encrypt with certbot: `certbot --nginx -d nayana.example.com`
- Caddy handles TLS automatically, no extra config.

### Health check
- Container: `HEALTHCHECK` is in the Dockerfile (curls `/`).
- Manual: `curl -fsS http://127.0.0.1:8080/ > /dev/null && echo OK`
- Logs: `docker logs nayana-tutor` or `journalctl -u nayana-tutor`.

### Common gotchas
- **Audio broken, rest works** → Piper voice model missing or
  `NAYANA_PIPER_VOICE` env wrong. Verify with
  `echo hi | $NAYANA_PIPER_BIN --model $NAYANA_PIPER_VOICE -f /tmp/x.wav --quiet`
- **Engine returns mostly untranscribed words** → `data/cmudict.json`
  is the sample, not the full one. `npm run build` requires
  `data/cmudict.txt` to exist.
- **Server won't start, port collision** → `ss -ltnp | grep 8080`
  to find the conflict, change `PORT`.
- **Stale page in browser after redeploy** → server sends
  `Cache-Control: no-cache` so a normal refresh always revalidates.
  If a tab is stuck, hard-refresh once (Ctrl+Shift+R). Multiple Node
  processes on different ports can leave a tab pointed at a stale
  instance — `ss -ltnp | grep node` to see all listeners.
- **OOM at startup** → CMUdict load needs ~250 MB heap. On a small
  VPS, `--max-old-space-size=512` in the systemd `ExecStart` is safe.

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

A rule has shape `{ name, from, to, phoneme }`. The phoneme field
selects matching pairs in one of four modes:

1. **No-digit** (`phoneme: "F"`, `"AE"`, …) — matches the phoneme at any
   stress level. Stress digits are stripped before comparison, so `AE`
   matches `AE0`/`AE1`/`AE2`.
2. **Stress-specific** (`phoneme: "AH0"`) — exact match required including
   stress. Used for schwa (AH0) without firing on stressed /ʌ/ (AH1, AH2).
3. **Stressed-only** (`phoneme: "AH+"`) — matches at any non-zero stress
   (AH1 or AH2 but not AH0). Used for /ʌ/ without colliding with schwa.
4. **Epsilon** (`phoneme: null` or `""`) — matches when the pair's phoneme
   list is empty. Used for silent letters (gh, t, o, w, d, r, …).

In all four modes, the grapheme match is the same: `pair.graphemes.toLowerCase()
=== rule.from.toLowerCase()`.

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
