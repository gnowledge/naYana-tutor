# OFL 1.1 Compliance

This project distributes a derivative of Comic Neue under the SIL Open
Font License 1.1.

## Conditions on derivatives (OFL §1)

**Original font name must not be used for the derivative.** This project
names the derivative "Nayana"; neither "Comic" nor "Neue" appears in
the family name, font name, or full name fields. Verified by
`tests/test_font_structure.py::test_ofl_compliance_name`.

## Required redistribution materials (OFL §2)

**The license text must accompany the font.** `fonts/output/OFL.txt`
ships with every release. `make package` produces a zip containing
the OTF, `OFL.txt`, `FONTLOG.txt`, and `README.md`.

**Original copyright notices must be preserved.** The build pipeline
preserves Comic Neue's original copyright in the font's `name` table
(record ID 0) and appends our own derivative copyright. Verified by
`tests/test_font_structure.py::test_original_copyright_preserved`.

## License inheritance (OFL §1, §3)

The generated font (`fonts/output/Nayana-Regular.otf`) is OFL 1.1.
The build script (`src/`) is original code, MIT-licensed
(`LICENSE-CODE`). Documentation (`docs/`) is CC BY 4.0
(`LICENSE-DOCS`). These three licenses are independent.

## Restrictions (OFL §4)

Not selling the font alone — not applicable to this project.

## Sources

- OFL 1.1 text: https://scripts.sil.org/OFL
- OFL FAQ: https://scripts.sil.org/OFL-FAQ_web
- Comic Neue repository: https://github.com/crozynski/comicneue
