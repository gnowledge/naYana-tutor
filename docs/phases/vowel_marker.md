# Phase: vowel_marker

**Status**: shipped
**Feature tag**: `ss01`
**Module**: `src/nayana/phases/vowel_marker.py`
**Config**: `src/nayana/config.py` → `VOWEL_MARKER`

## What it does

Adds a horizontal stroke at the baseline beneath each Latin vowel
letter (`a`, `e`, `i`, `o`, `u`). The letterforms above the stroke are
unchanged.

## Why a stroke (not a dot, color, weight change)

Considered alternatives:

- **Color**: requires color-emoji-style font tables (COLR/CPAL or SVG).
  Inconsistent rendering across applications.
- **Weight change** (e.g., bold vowels): interferes with semantic bold.
- **Dot below**: works but visually noisier than a stroke. Strokes
  also connect across vowel clusters (`audio`, `queue`), suggesting
  "vowel zone" as a continuous concept.
- **Underline**: collides with semantic underline (links, emphasis).
- **Different glyph shapes**: defers the visual change to a later
  phase. This phase's whole point is zero learning cost on day one.

The stroke at baseline is also the visual element naYana's vowel
design uses (horizontal line with modifier on top), so this phase
prepares the reader for the eventual `glyph_replacement` phase.

## Why ss01 and not the base codepoint

Placing the stroked vowel directly at U+0061 would work but has
problems:

1. The user can never see plain text in this font — no escape hatch.
2. Copy-paste from a Nayana-rendered page into another font shows a
   plain `a` with the visual tool gone, no warning.
3. There's no reversible toggle for A/B comparison or learning.

`ss01` is the OpenType-standard way to say "alternate visual treatment
the user opts into." Disabling falls back to the base font seamlessly.

## Configuration

In `src/nayana/config.py`:

```python
VOWEL_MARKER = {
    "vowels":           ["a", "e", "i", "o", "u"],
    "stroke_thickness": 40,   # 1000-UPM units
    "stroke_drop":      30,   # distance baseline to stroke top
    "stroke_padding_x": 20,   # extension past advance width
}
```

Values are in 1000-UPM units; they scale automatically to the font's
actual em size.

### Tuning guidelines

- **Stroke thickness** should match the weight of the letterforms.
  Comic Neue Regular: 40 reads as matching. Bold variants would need
  ~60–80.
- **Stroke drop** — most likely to be wrong on first pass. Too small:
  glues to the letter, looks like an underline. Too large: detaches
  visually, fails to read as part of the vowel.
- **Stroke padding** is a semantic choice:
  - Padding > 0: adjacent vowels' strokes merge → vowel clusters
    read as a continuous "vowel zone." Bias toward future
    `diphthong` phase.
  - Padding ≤ 0: each vowel has a discrete stroke. Better for
    letter-by-letter reading instruction.

## What this phase deliberately does NOT handle

- **`y` as vowel**: `y` is a vowel in `happy`, `gym` but a consonant in
  `yes`, `yellow`. Position-based heuristics get ~95% accuracy.
  Deferred to `pronounced_vowel`, which handles it via dictionary.
- **Silent vowels**: every vowel letter is marked, including silent
  ones. Intentional. `pronounced_vowel` distinguishes them.
- **Vowel digraphs as units**: `ea`, `ou`, `ai` get two adjacent
  strokes. `diphthong` will unify them.
- **Capital vowels**: ASCII `A`, `E`, `I`, `O`, `U` not yet handled.
  Add to config if needed; stroke geometry may need separate tuning
  since capitals sit higher.
- **Non-ASCII vowels**: `é`, `à`, `ö` etc. not handled. For French,
  Spanish, German typesetting in this font, marker won't appear on
  accented vowels.

## Known limitations

- The friendly name "Vowel Marker" for ss01 cannot currently be set
  through FontForge's high-level Python API. Apps will display "ss01"
  as the feature name. Setting it requires writing a `FeatureParams`
  record in GSUB referencing name table IDs 256–356; planned for a
  later cleanup using fontTools.
- OTF only. TTF can be added by changing `font.generate()` extension.

## Test surfaces

`samples/test.html` includes seven scenarios for tuning this phase:

1. Single-letter inspection — geometry tuning at display size
2. Side-by-side off/on — A/B comparison
3. Descender collision — line-height threshold finder
4. Size sweep — legibility at body sizes (10–18px)
5. Reading passage — sustained reading
6. Edge cases — silent vowels, irregular spellings
7. All-vowel and no-vowel words — kerning and degenerate cases

Edit `VOWEL_MARKER` in config, run `make build && make sample`,
refresh the browser. End-to-end iteration in seconds.
