# bench

A quick, pretty **WoW raid bench roller**. Enter your raiders, pick how many to bench, and let a d20 decide who sits out — then copy the result straight into Discord.

## How it works

- Every raider on the roster rolls a **d20** (1–20).
- The **lowest roll(s)** sit the bench. You choose how many.
- Ties on the bench boundary trigger an automatic **re-roll** (just like calling a re-roll on tied `/roll` results in game).
- **Copy for Discord** puts the result on your clipboard as a ready-to-paste code block:

  ```txt
  BENCH ROLL  —  26 May 2026
  Benched (1): Illidan
  ----------------------------
   3  Illidan  <-- BENCH
   9  Jaina
  14  Thrall
  18  Anduin
  20  Sylvanas
  ```

Everything runs **client-side** in the browser — no backend, nothing stored.

## Stack

- Plain HTML / CSS / vanilla JS (no build step).
- Served by an unprivileged `nginx` container on port `8080`.
- Image published to `ghcr.io/geekxflood/bench` by GitHub Actions on every push to `main`.

## Local development

Just open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Container

```sh
docker build -t bench .
docker run --rm -p 8080:8080 bench
# visit http://localhost:8080
```

## Deployment

Runs on the geekxflood Kubernetes cluster via GitOps (ArgoCD):

- Helm chart: [`geekxflood/helm-charts` → `charts/bench`](https://github.com/geekxflood/helm-charts/tree/main/charts/bench)
- ArgoCD Application: [`geekxflood/applicationset` → `argocd/apps/tools/bench.yaml`](https://github.com/geekxflood/applicationset/blob/main/argocd/apps/tools/bench.yaml)
- Internal: `bench.local.geekxflood.io` (Cilium Gateway) · Public: `bench.geekxflood.io` (Cloudflare Tunnel)
- `argocd-image-updater` redeploys automatically when a new image is pushed.
