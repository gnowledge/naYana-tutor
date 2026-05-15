# Nayana font — codepoint and glyph-name reference

A practical lookup table for editing Nayana glyphs in any font editor
(Glyphr Studio, FontForge, Birdfont, RoboFont, …). Each row gives the
IPA character, its Unicode codepoint, the canonical glyph name (Adobe
Glyph List where applicable, else our own private name), and the
current build strategy.

For deeper rationale on each shape choice see
[`font-glyph-checklist.md`](./font-glyph-checklist.md). For the build
pipeline that produces these glyphs see
[`../src/nayana/phases/glyph_builders.py`](../src/nayana/phases/glyph_builders.py).

## How to find a glyph

Codepoints and glyph names are the same across editors; only the
navigation UI differs.

- **By codepoint**: paste the character (`ə`) into the editor's
  goto/search field, or type the hex (`0259` / `U+0259` / `uni0259`).
  - *FontForge*: `View → Goto…` (`Ctrl+Shift+>`).
  - *Glyphr Studio*: `Edit Glyphs` page → the left-side glyph chooser
    has a search box; type the character or codepoint.
- **By glyph name**: type the name (`schwa`, `esh`, `eng`, …) into the
  editor's name search.
- **By scrolling Unicode blocks**:

| Block                     | Range          | Nayana glyphs that live here                                  |
|---------------------------|----------------|---------------------------------------------------------------|
| Basic Latin               | U+0020–007F    | `d` (U+0064) — the only Basic Latin glyph we reshape          |
| Latin-1 Supplement        | U+0080–00FF    | `æ` (U+00E6), `ð` (U+00F0)                                    |
| Latin Extended-A          | U+0100–017F    | `ŋ` (U+014B)                                                  |
| IPA Extensions            | U+0250–02AF    | `ɑ` 0251, `ɚ` 025A, `ɝ` 025D, `ə` 0259, `ʃ` 0283, `ʒ` 0292, `ʌ` 028C |
| Spacing Modifier Letters  | U+02B0–02FF    | `ː` (U+02D0)                                                  |

So if you're scrolling IPA Extensions looking for `æ` or `ð`, you won't
find them there — they live in Latin-1 Supplement, where Unicode placed
them in the original 1991 spec because they're also letters in Old
English, Norwegian, Icelandic, etc.

## Shapes the engine emits

### Decided shapes (12 IPA codepoints + 1 Latin letter)

| Symbol | Codepoint | Glyph name              | Current build strategy                                                         | Designed shape                            |
|--------|-----------|-------------------------|---------------------------------------------------------|-------------------------------------------|
| æ      | U+00E6    | `ae`                    | clone of `a` splines                                    | Latin `a`                                 |
| ð      | U+00F0    | `eth`                   | drawn: oval bowl + arching curl-stroke                  | Greek small `δ`                           |
| ʃ      | U+0283    | `esh`                   | clone of `sacute`                                       | `s` with acute accent (Sanskrit IAST ś)   |
| ʒ      | U+0292    | `ezh`                   | clone of `uni0237` (dotless j) + acute reference        | dotless-j with acute accent               |
| ə      | U+0259    | `schwa`                 | reference to `endash` (baseline) + `hyphen` (top)       | long dash + shorter dash, baseline-aligned|
| ʌ      | U+028C    | `turnv`                 | reference to `endash` + `hyphen` + `degree`             | schwa stack + `°` stress mark             |
| ɑ      | U+0251    | `alphaipa`              | drawn: two interlinked hollow ovals                     | proportionality `∝` (or Greek α)          |
| ŋ      | U+014B    | `eng`                   | clone of `n` + drawn descender oval                     | `n` with `b`-bowl tail below baseline     |
| ɝ      | U+025D    | `rhookschwastressed`    | drawn: 4 stroked-arm parallelograms                     | two V's stacked (∨ over ∧) with gap       |
| ɚ      | U+025A    | `schwarhotic`           | drawn: 2 hollow rings stacked                           | two `°` circles stacked with gap          |
| ː      | U+02D0    | `lengthmark`            | drawn: 2 triangles, points facing                       | triangular colon                          |
| d      | U+0064    | `d`                     | drawn: hollow triangle, x-height tall                   | Greek capital `Δ`                         |

### Ligature targets (private glyphs, no codepoint)

The OpenType `liga` GSUB substitution maps a sequence of two glyphs to a
single ligature glyph. The targets carry no codepoint — they are reached
only via the substitution.

| Source sequence | Target glyph name | Current shape | Designed shape |
|-----------------|-------------------|---------------|----------------|
| `t` + `esh`     | `tesh.lig`        | clone of `c`            | Latin `c` (Sanskrit IAST)           |
| `d` + `ezh`     | `dezh.lig`        | clone of `uni0237`      | dotless-j (Sanskrit IAST, dotless to avoid /ʒ/ collision) |

To inspect the substitution:

- *FontForge*: `Element → Font Info → Lookups`, find the `liga` lookup,
  view the `ipa_ligatures_subtable`.
- *Glyphr Studio*: `Ligatures` page lists every multi-glyph sequence with
  its target glyph; the two Nayana entries are `t + esh` and `d + ezh`.

### Codepoints the engine emits but Nayana hasn't designed yet

These currently fall through to whatever IPA-supporting font the system
provides. Add a Nayana shape via a builder in
`src/nayana/phases/glyph_builders.py` once a design is agreed.

| Symbol | Codepoint | Suggested glyph name | Where it appears |
|--------|-----------|----------------------|------------------|
| ɪ      | U+026A    | `iota` / `Ismall`    | bit → bɪt        |
| ʊ      | U+028A    | `upsilonlatin`       | book → bʊk       |
| ɛ      | U+025B    | `epsilon`            | bed → bɛd        |
| ɔ      | U+0254    | `oopen`              | call → kɔːl      |
| θ      | U+03B8    | `theta`              | thin → θɪn       |

## Source-glyph inventory (Comic Neue, what's available to copy)

Useful when designing a new Nayana shape and wanting to start from an
existing Comic Neue glyph rather than drawing from scratch.

| Glyph                    | Codepoint | Comic Neue name | Notes                              |
|--------------------------|-----------|-----------------|------------------------------------|
| Latin lowercase a–z      | U+0061–7A | `a`–`z`         | full set                           |
| Latin uppercase A–Z      | U+0041–5A | `A`–`Z`         | full set                           |
| capital `J`              | U+004A    | `J`             | candidate base for ʒ/dʒ            |
| dotless `ȷ`              | U+0237    | `uni0237`       | currently used for ʒ and dʒ ligature|
| `ś` (s + acute)          | U+015B    | `sacute`        | currently used for ʃ                |
| combining acute          | U+0301    | `acutecomb`     | composable mark                    |
| `°` degree               | U+00B0    | `degree`        | composable mark; used in ʌ          |
| `=` equals               | U+003D    | `equal`         | (was used for ə pre-v2)             |
| `–` en-dash              | U+2013    | `endash`        | currently used as ə bottom stroke   |
| `-` hyphen               | U+002D    | `hyphen`        | currently used as ə top stroke      |
| `—` em-dash              | U+2014    | `emdash`        | available                          |
| `_` underscore           | U+005F    | `underscore`    | sits at baseline                   |
| `ð` eth (Comic Neue's)   | U+00F0    | `eth`           | original shape; we replace it      |
| `æ` ae (Comic Neue's)    | U+00E6    | `ae`            | original shape; we replace it      |

## Codepoints **not** in Comic Neue (would need to be added or drawn)

If a desired shape is one of these, you'll be drawing from scratch:

| Glyph              | Codepoint | Why we wanted it          |
|--------------------|-----------|---------------------------|
| Greek small δ      | U+03B4    | original ð design source  |
| Greek capital Δ    | U+0394    | original d → Δ design     |
| Greek small α      | U+03B1    | original ɑ design         |
| proportional ∝     | U+221D    | v2 ɑ design               |

Adding one of these to Comic Neue first (then referencing it from the
IPA codepoint) is one workflow; drawing the shape directly into the
IPA codepoint is the other. The current builders take the second path.

## Workflow for manual edits

1. Open the built font in your editor of choice:
   - *Glyphr Studio* (browser): https://www.glyphrstudio.com/app/ —
     `Open project → Load font from file` → pick
     `fonts/output/Nayana-Regular.otf`.
   - *FontForge* (desktop): `fontforge fonts/output/Nayana-Regular.otf`.
2. Navigate to a glyph using the codepoint or name from the tables above.
3. Edit the splines visually.
4. Export an OTF (`Save & Export → OTF` in Glyphr Studio;
   `File → Generate Fonts…` in FontForge).

**Caveat — rebuilding from source overwrites manual edits.** The build
pipeline in `src/nayana/phases/glyph_builders.py` is the source of
truth: every `make build` re-applies the programmatic shapes on top of
fresh Comic Neue. To make a hand-edit survive a rebuild, two options:

1. **Port the shape back into the builder.** Open the manually-edited
   glyph, read its splines (Glyphr Studio shows path data; FontForge
   shows a contour list), and translate them into pen-API calls inside
   the relevant `build_*` function. Most reliable.
2. **Skip the builder for that glyph.** Comment out its line in
   `IpaGlyphsPhase.BUILDERS` (in `ipa_glyphs.py`); place the
   hand-edited OTF at a known path and adjust the build to start from
   there. Brittle — easy to forget you've done it.
