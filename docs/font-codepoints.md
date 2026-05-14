# Nayana font — codepoint and glyph-name reference

A practical lookup table for editing Nayana glyphs in FontForge (or any
font editor). Each row gives the IPA character, its Unicode codepoint, the
FontForge glyph name (Adobe Glyph List where applicable, else our own
private name), and the current build strategy.

For deeper rationale on each shape choice see
[`font-glyph-checklist.md`](./font-glyph-checklist.md). For the build
pipeline that produces these glyphs see
[`../src/nayana/phases/glyph_builders.py`](../src/nayana/phases/glyph_builders.py).

## How to find a glyph in FontForge

- **By codepoint**: `View → Goto…` (or `Ctrl+Shift+>`), then type the
  codepoint as `uni0259` or paste the character `ə` directly.
- **By glyph name**: `View → Goto…`, type the name from the table below
  (`schwa`, `esh`, `eng`, etc.).
- **By scrolling**: the glyphs we add land at their natural Unicode block
  positions — IPA Extensions (U+0250–U+02AF) and Spacing Modifier Letters
  (U+02B0–U+02FF). Custom shapes for Latin letters (`æ`, `ð`, `d`) sit in
  Basic Latin / Latin-1 Supplement.

## Shapes the engine emits

### Decided shapes (12 IPA codepoints + 1 Latin letter)

| Symbol | Codepoint | Glyph name              | Current build strategy                                  | Designed shape                            |
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

To inspect the substitution in FontForge: `Element → Font Info → Lookups`,
find the `liga` lookup, view the `ipa_ligatures_subtable`.

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

1. Open the built font in FontForge:
   `fontforge fonts/output/Nayana-Regular.otf`
2. Navigate to a glyph using the table above.
3. Edit the splines visually.
4. `File → Generate Fonts…` to write a new OTF.

After manual edits, **rebuilding from source will overwrite your
changes** — the build pipeline in `src/nayana/phases/glyph_builders.py`
is the source of truth. To preserve a manual edit, port it back into the
relevant builder function (or have the builder skip glyphs that already
exist with the right shape).
