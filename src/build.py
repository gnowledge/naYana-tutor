"""
build.py — Nayana font builder

Loads the canonical Nayana source (a FontForge SFD), applies any
registered programmatic phases on top, sets metadata, and writes an OTF.

The SFD at fonts/source/Nayana-Regular.sfd is the source of truth for
glyph shapes, OT lookups (vowel-marker ss01, ipa_ligatures liga), and
font metadata. Hand-edits land there directly.

Programmatic phases are kept around for systematic transformations that
are easier to express as code than as glyph-by-glyph editing — but right
now, no phases are registered by default. The Phase infrastructure is
preserved for future use (e.g. adding a new ligature class wholesale).

Usage:
    fontforge -script src/build.py -i SOURCE.sfd -o OUTPUT.otf
    fontforge -script src/build.py -i SOURCE.sfd -o OUTPUT.otf \\
              --phases foo bar
"""

import argparse
import sys
import os

# Make 'nayana' package importable when run via `fontforge -script`
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__))))

from nayana import VERSION, FAMILY_NAME, FONT_NAME_PREFIX
from nayana.phases import REGISTRY, get_phase
from nayana.font_io import open_font, set_metadata, save_font


def build(input_path, output_path, phase_names):
    """Apply the named phases to the input font and write to output."""
    font = open_font(input_path)

    for name in phase_names:
        phase = get_phase(name)
        print(f"Applying phase: {name} (feature: {phase.feature_tag})")
        phase.apply(font)

    set_metadata(font, family=FAMILY_NAME, name_prefix=FONT_NAME_PREFIX,
                 version=VERSION, phases=phase_names)
    save_font(font, output_path)
    if phase_names:
        print(f"Wrote {output_path} (Nayana {VERSION}, phases: {phase_names})")
    else:
        print(f"Wrote {output_path} (Nayana {VERSION}, no phases — pure SFD passthrough)")


def main():
    parser = argparse.ArgumentParser(
        description="Build the Nayana font from its SFD source.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"Registered phases: {', '.join(REGISTRY.keys()) or '(none)'}"
    )
    parser.add_argument("-i", "--input", required=True,
                        help="Path to source font (SFD, OTF, or TTF)")
    parser.add_argument("-o", "--output", required=True,
                        help="Path to write the OTF")
    parser.add_argument("--phases", nargs="*", default=[],
                        help="Programmatic phases to apply on top of the source "
                             "(default: none — SFD is taken as-is)")
    parser.add_argument("--all", action="store_true",
                        help="Apply all registered phases (overrides --phases)")
    parser.add_argument("--list-phases", action="store_true",
                        help="List registered phases and exit")
    args = parser.parse_args()

    if args.list_phases:
        if not REGISTRY:
            print("No phases registered. (SFD is the source of truth.)")
        else:
            print("Registered phases:")
            for name, cls in REGISTRY.items():
                print(f"  {name:20s} {cls.feature_tag}  — {cls.description}")
        return

    phases = list(REGISTRY.keys()) if args.all else args.phases

    unknown = [p for p in phases if p not in REGISTRY]
    if unknown:
        parser.error(f"Unknown phases: {unknown}. "
                     f"Available: {list(REGISTRY.keys())}")

    build(args.input, args.output, phases)


if __name__ == "__main__":
    main()
