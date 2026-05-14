"""
IpaGlyphsPhase — adds the IPA glyphs the engine emits.

This phase is **always-on** (no OpenType feature tag). It does two things:

  1. Adds new glyphs at IPA codepoints that Comic Neue doesn't cover
     (schwa, esh, ezh, eng, alpha, length mark, the rhotic schwas, etc.).
  2. Replaces the shape of three existing glyphs with Nayana-designed
     shapes: æ → Latin `a`, ð → Greek `δ`, Latin `d` → Greek `Δ`.

Per shape decisions in docs/font-glyph-checklist.md (12 IPA + 1 Latin).

Five IPA codepoints (ɪ ʊ ɛ ɔ θ) are deferred — no Nayana shape decided yet,
so the font lets them fall through to system fallback. Add builders here
when shapes are agreed.
"""

from nayana.phases.base import Phase
from nayana.phases import glyph_builders


class IpaGlyphsPhase(Phase):
    name = "ipa_glyphs"
    feature_tag = ""  # always-on; no OT feature
    description = "Adds Nayana-designed shapes for IPA codepoints the engine emits"

    BUILDERS = [
        # Clones of existing Comic Neue glyphs
        ("ae",          glyph_builders.build_ae),
        ("esh",         glyph_builders.build_esh),
        # Compositions
        ("schwa",       glyph_builders.build_schwa),
        ("turnv",       glyph_builders.build_wedge),
        ("ezh",         glyph_builders.build_ezh),
        # Custom-drawn
        ("eth",         glyph_builders.build_eth),
        ("alphaipa",    glyph_builders.build_alpha_ipa),
        ("d-as-delta",  glyph_builders.build_d_as_delta),
        ("eng",         glyph_builders.build_eng),
        ("er-stressed", glyph_builders.build_er_stressed),
        ("er-unstress", glyph_builders.build_er_unstressed),
        ("lengthmark",  glyph_builders.build_length_mark),
    ]

    def apply(self, font):
        for label, builder in self.BUILDERS:
            try:
                builder(font)
            except Exception as e:
                raise RuntimeError(f"glyph builder failed: {label}: {e}") from e
