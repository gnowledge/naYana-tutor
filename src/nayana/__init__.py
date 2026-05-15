"""
nayana — phased phonetic reform of English orthography via OpenType font.

This package contains the build pipeline. Phases live in `nayana.phases`.
Font I/O helpers live in `nayana.font_io`.
"""

# Single source of truth for project metadata. Update VERSION when releasing.
#
# Family name is "Nayana English" so the OS font picker and font-info dialogs
# clearly show the dialect scope. v1 is English-only; future dialects/languages
# (Indian English, RP, etc.) will ship as sibling families like "Nayana Hindi".
# CSS @font-face references the file by URL and aliases it to whatever name
# the stylesheet wants ('Nayana'), so this metadata change is non-breaking
# for the harness pages.
VERSION = "0.1.0"
FAMILY_NAME = "Nayana English"
FONT_NAME_PREFIX = "Nayana"

# OFL 1.1 compliance: when building a derivative, this string is appended
# to the source font's existing copyright. The original copyright is
# preserved unchanged.
DERIVATIVE_COPYRIGHT = (
    "Derivative work 'Nayana' — Nayana project, gnowledge lab. "
    "Licensed under SIL Open Font License 1.1. "
    "https://www.gnowledge.org/projects/naYana"
)
