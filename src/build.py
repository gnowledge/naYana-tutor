"""
build.py — Nayana font builder

Generic build entry point. Phases are pluggable modules in src/nayana/phases/.
Each phase contributes glyph generators and GSUB rules. The CLI selects
which phases to apply.

Usage:
    fontforge -script src/build.py --input INPUT.otf --output OUTPUT.otf \\
              --phases vowel_marker [--phase-2 ...] [--all]

    # Build with just the vowel marker phase (default for v0.1)
    fontforge -script src/build.py -i Comic.otf -o Nayana.otf

    # Build with multiple phases enabled
    fontforge -script src/build.py -i Comic.otf -o Nayana.otf \\
              --phases vowel_marker schwa_marker

    # Build with all registered phases
    fontforge -script src/build.py -i Comic.otf -o Nayana.otf --all

Phases must be registered in src/nayana/phases/__init__.py.
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

    # Apply each phase in registration order. Each phase mutates `font`.
    for name in phase_names:
        phase = get_phase(name)
        print(f"Applying phase: {name} (feature: {phase.feature_tag})")
        phase.apply(font)

    set_metadata(font, family=FAMILY_NAME, name_prefix=FONT_NAME_PREFIX,
                 version=VERSION, phases=phase_names)
    save_font(font, output_path)
    print(f"Wrote {output_path} (Nayana {VERSION}, phases: {phase_names})")


def main():
    parser = argparse.ArgumentParser(
        description="Build a Nayana font derivative.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"Available phases: {', '.join(REGISTRY.keys()) or '(none registered)'}"
    )
    parser.add_argument("-i", "--input", required=True,
                        help="Path to source font (OTF/TTF)")
    parser.add_argument("-o", "--output", required=True,
                        help="Path to write derivative font")
    parser.add_argument("--phases", nargs="+", default=["vowel_marker"],
                        help="Phases to apply (default: vowel_marker)")
    parser.add_argument("--all", action="store_true",
                        help="Apply all registered phases (overrides --phases)")
    parser.add_argument("--list-phases", action="store_true",
                        help="List registered phases and exit")
    args = parser.parse_args()

    if args.list_phases:
        if not REGISTRY:
            print("No phases registered.")
        else:
            print("Registered phases:")
            for name, cls in REGISTRY.items():
                print(f"  {name:20s} {cls.feature_tag}  — {cls.description}")
        return

    phases = list(REGISTRY.keys()) if args.all else args.phases

    # Validate
    unknown = [p for p in phases if p not in REGISTRY]
    if unknown:
        parser.error(f"Unknown phases: {unknown}. "
                     f"Available: {list(REGISTRY.keys())}")

    build(args.input, args.output, phases)


if __name__ == "__main__":
    main()
