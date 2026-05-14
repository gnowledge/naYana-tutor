# Nayana — build automation
#
# Targets:
#   make build        Generate the derivative font (default phases)
#   make build-all    Generate with all registered phases enabled
#   make list-phases  Show which phases are available
#   make test         Run validation tests on the generated font
#   make sample       Copy generated font to samples/ for browser testing
#   make package      Create a distribution zip
#   make inspect      Dump GSUB and name tables for inspection
#   make download     Download source font(s) if missing
#   make clean        Remove generated artifacts

SRC_FONT     := fonts/source/ComicNeue-Regular.otf
OUT_FONT     := fonts/output/Nayana-Regular.otf
BUILD_SCRIPT := src/build.py

# Default phase set. Override on the command line:
#   make build PHASES="vowel_marker schwa_marker"
PHASES ?= vowel_marker ipa_glyphs ipa_ligatures

COMIC_NEUE_URL := https://github.com/crozynski/comicneue/raw/master/Fonts/OTF/ComicNeue-Regular.otf

DIST_DIR  := build/dist
VERSION   := $(shell python3 -c "import sys; sys.path.insert(0,'src'); from nayana import VERSION; print(VERSION)" 2>/dev/null || echo "dev")
DIST_NAME := Nayana-$(VERSION)

.PHONY: all build build-all list-phases test sample package inspect clean download clean-all

all: build

download: $(SRC_FONT)

$(SRC_FONT):
	@mkdir -p fonts/source
	@echo "Downloading Comic Neue Regular..."
	@curl -L -o $(SRC_FONT) $(COMIC_NEUE_URL)
	@echo "Downloaded to $(SRC_FONT)"

list-phases:
	fontforge -script $(BUILD_SCRIPT) -i $(SRC_FONT) -o /tmp/_unused.otf --list-phases

build: $(OUT_FONT)

$(OUT_FONT): $(BUILD_SCRIPT) $(SRC_FONT) $(wildcard src/nayana/*.py) $(wildcard src/nayana/phases/*.py)
	@mkdir -p fonts/output
	fontforge -script $(BUILD_SCRIPT) -i $(SRC_FONT) -o $(OUT_FONT) --phases $(PHASES)
	@echo ""
	@echo "Built $(OUT_FONT)"
	@echo "Phases applied: $(PHASES)"

build-all: $(SRC_FONT)
	@mkdir -p fonts/output
	fontforge -script $(BUILD_SCRIPT) -i $(SRC_FONT) -o $(OUT_FONT) --all

test: $(OUT_FONT)
	python3 -m pytest tests/ -v

sample: $(OUT_FONT)
	@cp $(OUT_FONT) samples/
	@echo "Open samples/test.html in your browser."

inspect: $(OUT_FONT)
	@echo "=== Features ==="
	@otfinfo --features $(OUT_FONT) || true
	@echo ""
	@echo "=== Names ==="
	@otfinfo --info $(OUT_FONT) | head -20 || true
	@echo ""
	@echo "=== GSUB ==="
	@python3 scripts/inspect_gsub.py $(OUT_FONT) || true

package: $(OUT_FONT)
	@mkdir -p $(DIST_DIR)/$(DIST_NAME)
	@cp $(OUT_FONT) $(DIST_DIR)/$(DIST_NAME)/
	@cp fonts/output/OFL.txt $(DIST_DIR)/$(DIST_NAME)/ 2>/dev/null || \
	    cp LICENSE-FONT $(DIST_DIR)/$(DIST_NAME)/OFL.txt 2>/dev/null || \
	    echo "Warning: OFL.txt not found"
	@cp FONTLOG.txt $(DIST_DIR)/$(DIST_NAME)/ 2>/dev/null || true
	@cp README.md $(DIST_DIR)/$(DIST_NAME)/
	@cd $(DIST_DIR) && zip -r $(DIST_NAME).zip $(DIST_NAME)
	@echo "Created $(DIST_DIR)/$(DIST_NAME).zip"

clean:
	rm -rf build/
	rm -f fonts/output/*.otf
	rm -f samples/Nayana-Regular.otf
	@echo "Cleaned generated artifacts."

clean-all: clean
	rm -f fonts/source/*.otf
	@echo "Also removed downloaded source fonts."
