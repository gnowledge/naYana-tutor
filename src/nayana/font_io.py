"""
Font I/O — open, configure, and save fonts.

Wraps FontForge's API in a slightly nicer interface and centralizes
OFL-compliance concerns (renaming, copyright preservation).
"""

import fontforge

from nayana import DERIVATIVE_COPYRIGHT


def open_font(path):
    """Open a source font for editing."""
    return fontforge.open(path)


def set_metadata(font, family, name_prefix, version, phases):
    """Set font metadata to OFL-compliant derivative values.

    - Strips the original family name (so 'Comic Neue' -> 'Nayana').
    - Appends our derivative copyright while preserving the original.
    - Records which phases were applied in the version string for traceability.
    """
    font.familyname = family
    font.fontname = f"{name_prefix}-Regular"
    font.fullname = f"{family} Regular"

    # Encode version + phase list. Apps typically display this in font info.
    phase_list = ",".join(phases) if phases else "none"
    font.version = f"{version} (phases: {phase_list})"

    existing_copyright = font.copyright or ""
    if "Nayana" not in existing_copyright:
        font.copyright = existing_copyright + "\n" + DERIVATIVE_COPYRIGHT


def save_font(font, path):
    """Generate the output font file."""
    font.generate(path)
    font.close()
