# Source Fonts

Upstream fonts used as inputs. Not modified in place; build scripts
in src/ produce derivatives in fonts/output/.

## Comic Neue

- File: ComicNeue-Regular.otf
- Author: Craig Rozynski
- Version: 2.51
- License: SIL Open Font License 1.1
- Source: https://github.com/crozynski/comicneue
- Download: `make download` fetches automatically.

Selected because it is OFL-permissive, has friendly letterforms
appropriate for a literacy tool, and was itself developed as a
remediation of Comic Sans — fitting the spirit of naYana.

## Adding source fonts

Place OTF/TTF here, document provenance and license, verify the
license permits derivatives, adjust the Makefile and build scripts.
Most popular open-license fonts (Inter, Source Sans, Noto, etc.) are
OFL and permit derivatives.
