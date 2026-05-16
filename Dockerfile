# syntax=docker/dockerfile:1.6
#
# Nayana tutor — multi-stage build.
#
# Stage 1 (font-builder): runs FontForge on the SFD source to produce
# Nayana-Regular.otf. Discarded after copy.
#
# Stage 2 (engine-builder): installs Node deps, compiles cmudict.json
# and catalogue.json from the source data files. Discarded after copy.
#
# Stage 3 (runtime): minimal image with Node + the compiled font +
# compiled dictionary + engine source + public/. Runs the Express
# server bound to $PORT (default 8080) on all interfaces.
#
# Build (after running `npm run fetch-cmudict && npm run align-cmudict`
# in engine/ on the host once — the alignment takes 10-15 min and
# isn't suitable for CI):
#
#   docker build -t nayana-tutor .
#
# Run:
#
#   docker run --rm -p 8080:8080 nayana-tutor
#   open http://localhost:8080

# ---- Stage 1: font ----
FROM debian:bookworm-slim AS font-builder
RUN apt-get update && apt-get install -y --no-install-recommends \
        fontforge \
        python3 \
        make \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*
# debian:bookworm-slim defaults to C/POSIX locale; FontForge's Python
# wrapper prints UTF-8 chars (em-dash) and crashes without a UTF-8 locale.
ENV LANG=C.UTF-8 PYTHONIOENCODING=utf-8
WORKDIR /build
COPY Makefile ./
COPY src/ ./src/
COPY fonts/ ./fonts/
RUN make build && ls -l fonts/output/

# ---- Stage 2: engine + compiled dictionary ----
FROM node:20-slim AS engine-builder
WORKDIR /build
COPY engine/package*.json ./
RUN npm ci --omit=dev
COPY engine/ ./
# Requires data/cmudict.txt + data/aligned-cmudict.corpus to have been
# populated on the host (see header). If missing, build-cmudict falls
# back to the small sample and the runtime engine has limited vocabulary.
RUN npm run build && \
    test -s data/cmudict.json && \
    test -s data/catalogue.json

# ---- Stage 2b: Piper neural TTS (binary + voice model) ----
# Piper provides natural-sounding neural TTS, used by /api/tts for
# English text. About 90 MB total (binary ~50 MB + lessac voice ~63 MB
# packed into ~26 MB tarball + 63 MB model).
FROM debian:bookworm-slim AS piper-fetcher
RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /piper-build
RUN curl -sL -o piper.tgz \
      https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz \
    && mkdir piper && tar -xzf piper.tgz -C . \
    && rm piper.tgz \
    && ls piper/
RUN mkdir -p voices && \
    curl -sL -o voices/en_US-lessac-medium.onnx \
      https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx && \
    curl -sL -o voices/en_US-lessac-medium.onnx.json \
      https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json && \
    ls -lh voices/

# ---- Stage 3: runtime ----
FROM node:20-slim AS runtime
LABEL org.opencontainers.image.title="Nayana tutor (English)" \
      org.opencontainers.image.description="Phonetic spelling reform of English orthography. v0.1." \
      org.opencontainers.image.source="https://github.com/gnowledge/naYana-tutor"

# espeak-ng powers the IPA-precise audio path (per-character demos in /learn,
# fallback when only IPA is available). Piper handles natural-voice TTS
# for plain English. Both are needed.
RUN apt-get update && apt-get install -y --no-install-recommends \
        espeak-ng \
    && rm -rf /var/lib/apt/lists/*

# Non-root user for security
RUN groupadd -r nayana && useradd -r -g nayana -m -d /home/nayana nayana
WORKDIR /app

# Install only production deps (smaller image; reusing the lockfile)
COPY engine/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled artifacts + source from previous stages
COPY --from=engine-builder /build/data/cmudict.json /build/data/catalogue.json ./data/
COPY engine/src/ ./src/
COPY engine/public/ ./public/

# Drop the font into both consumer paths
COPY --from=font-builder /build/fonts/output/Nayana-Regular.otf ./public/fonts/Nayana-Regular.otf
COPY --from=font-builder /build/fonts/output/Nayana-Regular.otf ./public/why/Nayana-Regular.otf

# Piper binary + voice model from the dedicated fetcher stage.
COPY --from=piper-fetcher /piper-build/piper   /opt/piper/
COPY --from=piper-fetcher /piper-build/voices  /opt/piper-voices/

RUN chown -R nayana:nayana /app /opt/piper /opt/piper-voices
USER nayana

ENV PORT=8080 \
    NODE_ENV=production \
    NAYANA_PIPER_BIN=/opt/piper/piper \
    NAYANA_PIPER_VOICE=/opt/piper-voices/en_US-lessac-medium.onnx
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "require('http').get('http://localhost:'+process.env.PORT, r => process.exit(r.statusCode===200?0:1))"

CMD ["node", "src/server.js"]
