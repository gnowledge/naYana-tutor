# Contributing to Nayana

Contributions welcome. The project is at an early stage where any of
these are useful:

## Per-phase contributions

**Stroke geometry tuning**: open `samples/test.html` at multiple sizes
and OS rendering stacks. Note where the stroke is too thin/thick or
where it collides with descenders. Open an issue with screenshots.

**Reading studies**: does each phase affect reading speed? In which
direction? A small WPM study would inform which phases should be
enabled by default in tools we ship.

**Edge cases**: text that renders strangely — vowels missing the
marker, kerning oddities, non-ASCII vowel handling, etc.

## New phases

The architecture supports plugging in new phases. See
`docs/structure.md` "Adding a new phase" for the recipe. Phases that
would be especially useful right now:

- **pronounced_vowel** — needs CMUdict integration design
- **schwa_marker** — straightforward once pronounced_vowel exists
- Capital vowel support for the existing vowel_marker phase

## Process

1. Open an issue first for substantial changes.
2. Small fixes can go straight to PR.
3. Run `make test` before submitting.
4. New design decisions belong in `docs/`.

## Code style

- Python: black-formatted, line length 88.
- FontForge scripts: clarity over cleverness; build is not perf-critical.
- Markdown: prose, not bulleted-everything.

## License

Code under MIT (`LICENSE-CODE`). Docs under CC BY 4.0 (`LICENSE-DOCS`).
By submitting a PR you agree to license your contribution accordingly.
