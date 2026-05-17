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

# The SFD is the canonical source — hand-edits in FontForge / Glyphr Studio
# land there. Comic Neue is kept around as a fallback / reference but is no
# longer the build input.
SRC_FONT       := fonts/source/Nayana-Regular.sfd
COMIC_NEUE_SRC := fonts/source/ComicNeue-Regular.otf
OUT_FONT       := fonts/output/Nayana-Regular.otf
BUILD_SCRIPT   := src/build.py

# Default phase set. None — the SFD is taken as-is. Override on the
# command line if a programmatic phase needs to run on top of the SFD:
#   make build PHASES="some_new_phase"
PHASES ?=

COMIC_NEUE_URL := https://github.com/crozynski/comicneue/raw/master/Fonts/OTF/ComicNeue-Regular.otf

DIST_DIR  := build/dist
VERSION   := $(shell python3 -c "import sys; sys.path.insert(0,'src'); from nayana import VERSION; print(VERSION)" 2>/dev/null || echo "dev")
DIST_NAME := Nayana-$(VERSION)

.PHONY: all build build-all list-phases test sample package inspect clean download clean-all piper

all: build

download: $(COMIC_NEUE_SRC)

$(COMIC_NEUE_SRC):
	@mkdir -p fonts/source
	@echo "Downloading Comic Neue Regular (reference / fallback)..."
	@curl -L -o $(COMIC_NEUE_SRC) $(COMIC_NEUE_URL)
	@echo "Downloaded to $(COMIC_NEUE_SRC)"

# Download Piper neural TTS binary + the en_US-lessac-high voice model.
# Used by /api/tts for natural-voice English synthesis. ~160 MB on disk.
# Run once after cloning the repo if you want audio playback to work
# during local dev (Docker fetches these itself, see Dockerfile).
# We use the "high" Lessac variant rather than "medium" because the
# medium model mispronounces rare phonemes like /ʒ/.
PIPER_BIN_URL   := https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz
PIPER_VOICE_URL := https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/high/en_US-lessac-high.onnx
PIPER_VOICE_CFG := https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/high/en_US-lessac-high.onnx.json

piper: vendor/piper/piper vendor/piper-voices/en_US-lessac-high.onnx

vendor/piper/piper:
	@mkdir -p vendor
	@echo "Downloading Piper neural TTS binary..."
	@curl -sL -o /tmp/piper.tgz $(PIPER_BIN_URL)
	@tar -xzf /tmp/piper.tgz -C vendor/
	@rm /tmp/piper.tgz
	@chmod +x vendor/piper/piper vendor/piper/espeak-ng
	@echo "Installed Piper at vendor/piper/"

vendor/piper-voices/en_US-lessac-high.onnx:
	@mkdir -p vendor/piper-voices
	@echo "Downloading Piper voice model (en_US-lessac-high, ~110 MB)..."
	@curl -sL -o vendor/piper-voices/en_US-lessac-high.onnx      $(PIPER_VOICE_URL)
	@curl -sL -o vendor/piper-voices/en_US-lessac-high.onnx.json $(PIPER_VOICE_CFG)
	@echo "Installed voice at vendor/piper-voices/"

list-phases:
	fontforge -script $(BUILD_SCRIPT) -i $(SRC_FONT) -o /tmp/_unused.otf --list-phases

build: $(OUT_FONT)

$(OUT_FONT): $(BUILD_SCRIPT) $(SRC_FONT) $(wildcard src/nayana/*.py) $(wildcard src/nayana/phases/*.py)
	@mkdir -p fonts/output
	fontforge -script $(BUILD_SCRIPT) -i $(SRC_FONT) -o $(OUT_FONT) $(if $(PHASES),--phases $(PHASES))
	@echo ""
	@echo "Built $(OUT_FONT)"
	@echo "Phases applied: $(if $(PHASES),$(PHASES),(none — pure SFD passthrough))"

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
