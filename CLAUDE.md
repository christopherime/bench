# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page **WoW raid bench roller**: every raider rolls a d20, the lowest roll(s) sit the bench, ties on the cut boundary trigger an automatic re-roll. Everything runs client-side in the browser — no backend, no build step, nothing stored.

## Commands

```sh
# Local dev — no build, just serve the folder (or open index.html directly)
python3 -m http.server 8080      # http://localhost:8080

# Build & run the production container (unprivileged nginx on :8080)
docker build -t bench .
docker run --rm -p 8080:8080 bench
```

There are no tests, linters, or package manager — vanilla HTML/CSS/JS only.

## Architecture

Three source files, loaded statically:

- `index.html` — markup and element IDs. JS reaches DOM nodes by these IDs (see the `els` map in `app.js`), so renaming an `id` here breaks the wiring.
- `assets/js/app.js` — all behavior. Key functions: `parseNames` (splits the roster textarea on newlines/commas), `rollBench` (rolls + re-rolls), `isAmbiguous` (detects a tie straddling the bench cut), `toDiscord` (formats the fenced code block for clipboard), `renderResults`. State lives in the module-level `lastRoll` so Copy and Re-cast reuse the last result.
- `assets/css/style.css` — the "Bench Rite" arcane theme (animations, the SVG d20 die states `casting`/`settle`).

The bench logic: sort all d20 rolls ascending, the lowest `benchCount` sit out. If `rolls[benchCount-1] === rolls[benchCount]` (a tie crosses the boundary), re-roll the whole roster, up to 50 attempts.

## Deployment

Push to `main` triggers `.github/workflows/build.yaml`, which builds and pushes `ghcr.io/geekxflood/bench` (tags: `latest`, short SHA, timestamp). The workflow deliberately uses **only `actions/*`** and plain `docker` shell commands — do not introduce `docker/*` or other third-party actions (the cluster's runners can't reliably download them).

`nginx.conf` serves the static files on `:8080` and exposes `/healthz` for Kubernetes probes. Deployment is GitOps via ArgoCD (Helm chart + Application live in separate `geekxflood` repos; `argocd-image-updater` redeploys on new images).
