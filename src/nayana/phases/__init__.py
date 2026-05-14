"""
Phases — pluggable transformations applied to a font.

Each phase is a class inheriting from Phase. To register a new phase,
import it here and add it to REGISTRY.

A phase's job: mutate a fontforge font object to add the visual change
that defines this phase. Typically this means:
  1. Generating new glyph variants (e.g. vowels with strokes underneath)
  2. Registering a GSUB lookup that maps base glyphs to those variants
  3. Wiring the lookup to an OpenType feature (typically a stylistic set)

Phases are independent — applying phase B does not require phase A to
have been applied. They register different feature tags (ss01, ss02,
...) and don't interfere with each other's glyph names. Users opt into
each phase via CSS:

    font-feature-settings: "ss01" on, "ss02" on;
"""

from nayana.phases.base import Phase
from nayana.phases.vowel_marker import VowelMarkerPhase
from nayana.phases.ipa_glyphs import IpaGlyphsPhase
from nayana.phases.ipa_ligatures import IpaLigaturesPhase

# Registry: maps phase name (CLI string) to phase class. Order matters
# only for the --all CLI flag, which applies phases in registration order.
REGISTRY = {
    "vowel_marker": VowelMarkerPhase,
    "ipa_glyphs": IpaGlyphsPhase,
    "ipa_ligatures": IpaLigaturesPhase,
}


def get_phase(name):
    """Look up a phase by name and return an instance."""
    if name not in REGISTRY:
        raise KeyError(f"Unknown phase: {name}. Available: {list(REGISTRY.keys())}")
    return REGISTRY[name]()


__all__ = ["Phase", "REGISTRY", "get_phase"]
