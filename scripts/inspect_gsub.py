"""
inspect_gsub.py — dump a font's GSUB table in human-readable form.

Useful for verifying that any registered phase (ss01, ss02, ...)
substitutes what you expect.

Usage:
    python scripts/inspect_gsub.py fonts/output/Nayana-Regular.otf
    python scripts/inspect_gsub.py path/to/font.otf --feature ss01

Requires: pip install fonttools
"""

import argparse
from fontTools.ttLib import TTFont


def dump_gsub(font_path, feature_filter=None):
    font = TTFont(font_path)

    if "GSUB" not in font:
        print(f"{font_path}: no GSUB table")
        return

    gsub = font["GSUB"].table
    feature_records = gsub.FeatureList.FeatureRecord
    lookup_list = gsub.LookupList.Lookup

    print(f"\nFont: {font_path}")
    all_tags = sorted({fr.FeatureTag for fr in feature_records})
    print(f"Features in GSUB: {all_tags}\n")

    for i, fr in enumerate(feature_records):
        tag = fr.FeatureTag
        if feature_filter and tag != feature_filter:
            continue

        print(f"Feature {i}: '{tag}'")
        print(f"  Lookup indices: {list(fr.Feature.LookupListIndex)}")

        for lookup_idx in fr.Feature.LookupListIndex:
            lookup = lookup_list[lookup_idx]
            print(f"  Lookup {lookup_idx} (type {lookup.LookupType}):")
            for st_idx, subtable in enumerate(lookup.SubTable):
                if hasattr(subtable, "mapping"):
                    print(f"    Subtable {st_idx} (single substitution):")
                    for src, tgt in sorted(subtable.mapping.items()):
                        print(f"      {src!r:>12} -> {tgt!r}")
                else:
                    print(f"    Subtable {st_idx}: {type(subtable).__name__}")
        print()


def main():
    parser = argparse.ArgumentParser(description="Dump GSUB table from a font.")
    parser.add_argument("font", help="Path to OTF/TTF file")
    parser.add_argument("--feature", default=None,
                        help="Filter to one feature tag (e.g. ss01)")
    args = parser.parse_args()
    dump_gsub(args.font, feature_filter=args.feature)


if __name__ == "__main__":
    main()
