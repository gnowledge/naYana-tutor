"""
VowelMarkerPhase — adds a baseline stroke under each Latin vowel letter.

This is the first phase in the Nayana adoption sequence. It introduces
no new glyphs (in the sense of new shapes); it adds a horizontal stroke
beneath the existing vowel letterforms. The reader's task is only to
notice where vowels are.

Configuration is in nayana.config.VOWEL_MARKER, so the geometry can be
tuned without touching this file.
"""

from nayana.phases.base import Phase, add_single_substitution_lookup
from nayana.config import VOWEL_MARKER


class VowelMarkerPhase(Phase):
    name = "vowel_marker"
    feature_tag = "ss01"
    description = "Baseline stroke under each Latin vowel (a, e, i, o, u)"

    def apply(self, font):
        cfg = VOWEL_MARKER
        upm = font.em
        scale = upm / 1000.0

        substitutions = {}
        for v in cfg["vowels"]:
            variant_name = f"{v}.{self.feature_tag}"
            self._add_marked_glyph(font, v, variant_name, cfg, scale)
            substitutions[v] = variant_name

        add_single_substitution_lookup(
            font,
            feature_tag=self.feature_tag,
            lookup_name="vowel_marker_lookup",
            substitutions=substitutions,
        )

    @staticmethod
    def _add_marked_glyph(font, source_name, target_name, cfg, scale):
        """Create target_name as a copy of source_name plus a baseline stroke."""
        if source_name not in font:
            raise KeyError(f"Source glyph '{source_name}' not in font")

        src = font[source_name]
        thickness = cfg["stroke_thickness"] * scale
        drop = cfg["stroke_drop"] * scale
        pad = cfg["stroke_padding_x"] * scale

        tgt = font.createChar(-1, target_name)
        tgt.width = src.width

        font.selection.select(source_name)
        font.copy()
        font.selection.select(target_name)
        font.paste()

        pen = tgt.glyphPen(replace=False)
        x0, x1 = -pad, src.width + pad
        y_top = -drop
        y_bot = -drop - thickness
        pen.moveTo((x0, y_top))
        pen.lineTo((x1, y_top))
        pen.lineTo((x1, y_bot))
        pen.lineTo((x0, y_bot))
        pen.closePath()
        pen = None  # finalize

        tgt.removeOverlap()
        tgt.round()
