# Deploying the Nayana tutor

Phase 1 (current): single Docker image that serves both the static
documentation pages and the live English-to-Nayana engine. One artefact,
runs on any Docker host.

Phase 2 (later): split off pages that don't need the engine to a CDN /
GitHub Pages, leave only the live demo on the server. Wait until the
tutor design has stabilised before doing this — it adds deployment
complexity for a marginal cost saving.

---

## What's in the image

- Node 20 (slim) runtime
- Compiled font (`Nayana-Regular.otf`) built from
  `fonts/source/Nayana-Regular.sfd` via FontForge
- Compiled dictionary (`cmudict.json`, ~46 MB) from CMUdict + alignment +
  overrides
- Compiled phase catalogue (`catalogue.json`)
- Engine source + public/ (manifesto, glyph inventory, IPA keyboard,
  harness, scope test, word test, IPA inventory)

Final image size: ~300 MB. Most of it is the dictionary.

## Build prerequisites (one-time, on the host)

The dictionary alignment is slow (~10–15 minutes, requires Python +
phonetisaurus) so it isn't run inside the container. Generate the
alignment once on the host:

    cd engine
    npm install
    npm run fetch-cmudict          # downloads CMUdict (~3.6 MB)
    python3 -m venv .venv
    .venv/bin/pip install phonetisaurus
    npm run align-cmudict          # ~10–15 min, writes data/aligned-cmudict.corpus

After that, `engine/data/cmudict.txt` and
`engine/data/aligned-cmudict.corpus` exist and the Docker build can
proceed without external network or slow tooling.

## Build

    docker build -t nayana-tutor .

About 90 seconds on a warm cache; first build ~3 minutes
(downloads FontForge, Node base image, npm packages).

## Run

    docker run --rm -p 8080:8080 nayana-tutor

Open `http://localhost:8080`. Available pages:

- `/` — interactive harness (English → Nayana with phase slider)
- `/manifesto/` — published manifesto
- `/ipa-inventory.html` — every IPA codepoint with its glyph + keyboard shortcut
- `/ipa-keyboard.html` — type IPA via English-style shortcuts
- `/scope-test.html` — visual proof that Nayana font is scoped to rewritten spans
- `/wordtest.html` — proof page for individual glyphs

## Configuration

- `PORT` — listen port (default 8080)
- `NODE_ENV=production` set automatically in the image

## Hosting options

The image is a stock Node Express server. Anything that runs Docker
hosts it.

| Host | Notes |
|------|-------|
| **Fly.io** | Free tier covers low traffic. `fly launch` reads the Dockerfile directly. |
| **Railway** | Similar; deploy from git, automatic builds. |
| **Render** | Free tier with sleep; ~$7/month for always-on. |
| **DigitalOcean App Platform** | $5/month tier. |
| **Plain VPS** | Any Linux box with Docker installed. `docker run` + reverse proxy (nginx / Caddy) for TLS. |
| **gnowledge infrastructure** | If there's an internal docker host, deploy there — keeps the project under gnowledge.org. |

## Health check

The image declares an HTTP `HEALTHCHECK` against `localhost:$PORT`.
Most orchestrators (Docker Compose, Kubernetes, Fly, Railway) honour
this automatically.

## Future: splitting static from dynamic

When the tutor design has stabilised, the docs (manifesto, inventory,
keyboard, FAQ) can move to GitHub Pages or Cloudflare Pages — they
have no engine dependency, and CDN delivery is faster + cheaper than
serving them from the Node container.

The engine itself can also move client-side: `cmudict.json` is
~3 MB gzipped, fetchable on demand by the user's browser. That would
remove the need for any server at all (only `/api/fetch-url`, the
URL-rewrite-by-paste feature, would still need a tiny serverless
function for CORS).

Both moves are optional optimisations — the current single-image
deployment works fine for v1.
