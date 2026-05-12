"""
Base class for phases.

A Phase mutates a fontforge font in-place. The contract is:

    class MyPhase(Phase):
        name = "my_phase"
        feature_tag = "ss02"
        description = "Brief one-line description"

        def apply(self, font):
            # Generate glyph variants, register GSUB lookup
            ...
"""


class Phase:
    """Abstract base class for a font transformation phase."""

    # Short identifier used as CLI argument and in feature names. lowercase_underscore.
    name = ""

    # OpenType feature tag this phase activates (4 chars, typically ssNN).
    feature_tag = ""

    # Human-readable description shown in --list-phases.
    description = ""

    def apply(self, font):
        """Mutate the font in-place. Subclasses must implement."""
        raise NotImplementedError


# ---- Helpers shared across phases --------------------------------------------

def add_single_substitution_lookup(font, feature_tag, lookup_name,
                                    substitutions, scripts=None):
    """Register a GSUB single-substitution lookup wired to the given feature.

    substitutions: dict mapping source glyph name -> target glyph name.
    scripts: list of (script, [language, ...]) tuples. Defaults to latn/dflt
             and DFLT/dflt.
    """
    if scripts is None:
        scripts = [("latn", ("dflt",)), ("DFLT", ("dflt",))]

    subtable_name = f"{lookup_name}_subtable"

    font.addLookup(
        lookup_name,
        "gsub_single",
        (),
        ((feature_tag, tuple(scripts)),),
    )
    font.addLookupSubtable(lookup_name, subtable_name)

    for src, tgt in substitutions.items():
        if src in font and tgt in font:
            font[src].addPosSub(subtable_name, tgt)
