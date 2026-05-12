"""
nayana — phased phonetic reform of English orthography via OpenType font.

This package contains the build pipeline. Phases live in `nayana.phases`.
Font I/O helpers live in `nayana.font_io`.
"""

# Single source of truth for project metadata. Update VERSION when releasing.
VERSION = "0.1.0"
FAMILY_NAME = "Nayana"
FONT_NAME_PREFIX = "Nayana"

# OFL 1.1 compliance: when building a derivative, this string is appended
# to the source font's existing copyright. The original copyright is
# preserved unchanged.
DERIVATIVE_COPYRIGHT = (
    "Derivative work 'Nayana' — Nayana project, gnowledge lab. "
    "Licensed under SIL Open Font License 1.1. "
    "https://www.gnowledge.org/projects/naYana"
)
