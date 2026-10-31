# Endless Wake

A browser sailing game with two versions:

- **V4 · Living Tides**: a top-down sea rendered with Canvas 2D.
- **V5 · Voxel**: a three-dimensional archipelago rendered with WebGL.

Sail between islands, salvage cargo, fish, trade, and face hazards at sea. V4 saves voyages in the browser; V5 keeps the current voyage for the lifetime of the page.

## Controls

- Touch: drag on the scene to steer, or use the on-screen steering, sail, and action buttons.
- V4 keyboard: `A/D` steer, `W/S` raise or lower sails, `F` fish, `E` request docking, Space boosts, and `P` or `Esc` pauses.
- V5 keyboard: `A/D` steer, `W/S` adjust sails, `F/E` interact, `Q` fires, `M` opens the chart, `V` triggers an eruption, and `P` or `Esc` pauses.

## Run locally

Requires Node.js 22.13 or later and pnpm.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

The home page and `/v4/` open V4; `/v5/` opens the voxel version.

## Test and build

```sh
pnpm test
pnpm build:pages
```

The static build is written to `dist-pages`. To host under a subpath, set `PAGES_BASE_PATH` at build time, for example to `/game`. The output includes HTTP headers for hosts that support the `_headers` format.

Technical notes: [V4](docs/DESIGN-V4.md), [V5](docs/DESIGN-VOXEL.md), [world generation and streaming](docs/V5-WORLD-GENERATION-STREAMING.md), [models](docs/V5-MODEL-KIT.md), and [references](docs/REFERENCES.md).
