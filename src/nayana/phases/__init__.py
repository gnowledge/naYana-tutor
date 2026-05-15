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

# All previously-programmatic phases (vowel_marker, ipa_glyphs, ipa_ligatures)
# have been baked into fonts/source/Nayana-Regular.sfd, which is now the
# canonical source. Their .py files are kept in this directory as a record
# of how those shapes/lookups were originally produced — useful if anyone
# ever needs to regenerate from Comic Neue + code, but not run by default.
#
# To register a new programmatic phase: import its class here and add it
# to REGISTRY. The build will pick it up via --phases <name> or --all.
REGISTRY = {}


def get_phase(name):
    """Look up a phase by name and return an instance."""
    if name not in REGISTRY:
        raise KeyError(f"Unknown phase: {name}. Available: {list(REGISTRY.keys())}")
    return REGISTRY[name]()


__all__ = ["Phase", "REGISTRY", "get_phase"]
