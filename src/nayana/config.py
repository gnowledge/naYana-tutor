"""
Configuration for all phases.

Tunable parameters live here so phase logic stays separate from the
specific values being applied. To experiment with stroke geometry,
edit constants here and rebuild — no need to touch phase code.

All length values are in 1000-UPM font units. They scale automatically
to the font's actual em size at build time.
"""

# Phase: vowel_marker (ss01)
VOWEL_MARKER = {
    # Which letters get the stroke. To support uppercase, add "A", "E", etc.
    # Keep ASCII-only for now; non-ASCII vowels (é, à, ö) are deferred.
    "vowels": ["a", "e", "i", "o", "u"],

    # Vertical thickness of the stroke (1000-UPM units).
    "stroke_thickness": 40,

    # Distance from baseline to the top edge of the stroke (positive = below baseline).
    "stroke_drop": 30,

    # How far past the glyph's advance width the stroke extends. Positive
    # values let adjacent vowels' strokes connect ('audio'); zero or negative
    # gives discrete per-letter strokes.
    "stroke_padding_x": 20,
}

# Future phases register their own config dicts here:
#
# PRONOUNCED_VOWEL = { ... }   # ss02
# SCHWA_MARKER     = { ... }   # ss03
# LONG_SHORT       = { ... }   # ss04
# DIPHTHONG        = { ... }   # ss05
# GLYPH_REPLACEMENT = { ... }  # ss06+
