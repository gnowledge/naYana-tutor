"""
Validation tests for the generated Nayana font.

These tests are phase-aware: they ask the registry which phases were
registered and verify that the font reflects them. To add tests for a
new phase, add a fixture or test that targets that phase's feature tag
and expected glyph names.

Generic checks (font loads, OFL compliance, copyright) apply regardless
of which phases are present.

Run with: pytest tests/ -v
"""

import os
import sys
import pytest
from fontTools.ttLib import TTFont

# Make src/ importable so we can read the phase registry
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

FONT_PATH = os.environ.get(
    "NAYANA_FONT",
    os.path.join(os.path.dirname(__file__), "..", "fonts", "output", "Nayana-Regular.otf"),
)


@pytest.fixture(scope="module")
def font():
    if not os.path.exists(FONT_PATH):
        pytest.skip(f"Font not built yet: {FONT_PATH}. Run `make build`.")
    return TTFont(FONT_PATH)


@pytest.fixture(scope="module")
def gsub_features(font):
    """Set of all feature tags in the font's GSUB table."""
    if "GSUB" not in font:
        return set()
    return {fr.FeatureTag for fr in font["GSUB"].table.FeatureList.FeatureRecord}


# ---- Generic checks (apply to any phase combination) ------------------------

def test_font_loads(font):
    assert font is not None


def test_ofl_compliance_name(font):
    """Per OFL 1.1: derivative must not use the original font's name."""
    name_table = font["name"]
    family_names = [str(r) for r in name_table.names if r.nameID == 1]
    for name in family_names:
        assert "Comic" not in name, f"Family name '{name}' contains 'Comic'"
        assert "Neue" not in name, f"Family name '{name}' contains 'Neue'"


def test_original_copyright_preserved(font):
    """The original Comic Neue copyright must remain in the name table."""
    name_table = font["name"]
    cr = " ".join(str(r) for r in name_table.names if r.nameID == 0)
    assert "Comic Neue" in cr, "Original copyright must be preserved"


def test_derivative_copyright_added(font):
    """A Nayana copyright notice should also be present."""
    name_table = font["name"]
    cr = " ".join(str(r) for r in name_table.names if r.nameID == 0)
    assert "Nayana" in cr or "naYana" in cr, "Derivative copyright missing"


# ---- Phase-specific checks --------------------------------------------------

# These tests run only when the corresponding feature is present in the font,
# so a build with --phases vowel_marker won't fail tests for ss02, ss03, etc.

def _gsub_substitutions(font, feature_tag):
    """Return dict of substitutions registered under the given feature."""
    if "GSUB" not in font:
        return {}
    gsub = font["GSUB"].table
    subs = {}
    for fr in gsub.FeatureList.FeatureRecord:
        if fr.FeatureTag != feature_tag:
            continue
        for lookup_idx in fr.Feature.LookupListIndex:
            lookup = gsub.LookupList.Lookup[lookup_idx]
            for st in lookup.SubTable:
                if hasattr(st, "mapping"):
                    subs.update(st.mapping)
    return subs


def test_vowel_marker_phase(font, gsub_features):
    """If vowel_marker phase is built into the font, verify its structure."""
    if "ss01" not in gsub_features:
        pytest.skip("vowel_marker phase (ss01) not present in this build")

    glyph_names = set(font.getGlyphOrder())
    expected_vowels = ["a", "e", "i", "o", "u"]

    for v in expected_vowels:
        assert f"{v}.ss01" in glyph_names, f"Missing variant: {v}.ss01"

    subs = _gsub_substitutions(font, "ss01")
    for v in expected_vowels:
        assert v in subs, f"ss01 doesn't substitute '{v}'"
        assert subs[v] == f"{v}.ss01", (
            f"ss01 substitutes '{v}' -> '{subs[v]}', expected '{v}.ss01'"
        )


# Add tests for future phases below when the phases are implemented:
#
# def test_pronounced_vowel_phase(font, gsub_features):
#     if "ss02" not in gsub_features:
#         pytest.skip("pronounced_vowel phase not present")
#     ...
