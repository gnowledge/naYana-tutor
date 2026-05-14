"""
IpaLigaturesPhase — adds OpenType GSUB ligatures for the two IPA digraphs.

Maps the t+esh sequence to a glyph rendered as Latin `c` (Sanskrit IAST
tradition, c being unused in current Nayana output), and d+esh+combining-…
no — d+ezh sequence to a glyph rendered as Latin `j` (j being unused
because Nayana uses `y` for /j/).

Always-on: registered to the `liga` feature, which is on by default in
all major shapers. Per AGENTS.md the y/j convention requires j to render
the dʒ ligature; this phase wires the substitution that makes that happen.
"""

from nayana.phases.base import Phase
from nayana.phases import glyph_builders


class IpaLigaturesPhase(Phase):
    name = "ipa_ligatures"
    feature_tag = "liga"
    description = "Ligates t+ʃ → c-shape and d+ʒ → j-shape"

    def apply(self, font):
        # The ligature targets are private glyphs (no codepoint).
        glyph_builders.build_c_ligature(font)
        glyph_builders.build_j_ligature(font)

        scripts = (("latn", ("dflt",)), ("DFLT", ("dflt",)))

        font.addLookup(
            "ipa_ligatures_lookup",
            "gsub_ligature",
            (),
            ((self.feature_tag, scripts),),
        )
        font.addLookupSubtable("ipa_ligatures_lookup", "ipa_ligatures_subtable")

        # tʃ: glyphs t + esh → tesh.lig (rendered as c)
        font["tesh.lig"].addPosSub(
            "ipa_ligatures_subtable", ("t", "esh")
        )
        # dʒ: glyphs d + ezh → dezh.lig (rendered as j)
        font["dezh.lig"].addPosSub(
            "ipa_ligatures_subtable", ("d", "ezh")
        )
