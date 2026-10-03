# AGENTS.md

Pac-Man clone in vanilla JS/HTML/CSS. No build, no package manager, no tests, no linter.

## Run

- Open `src/index.html` directly, or serve statically: `python3 -m http.server -d src` then visit `/`.
- There is nothing to install, build, lint, or test. Verify changes by playing in the browser and watching the console.

## Architecture

- `src/js/maze.js` — maze data only: `MAZE_STR` (31 strings × 28 chars), parsed into `MAZE`, plus `TUNNEL_ROW`, `PACMAN_START`, `GHOST_STARTS`.
- `src/js/game.js` — state and rules: `createGame()`, `update()`.
- `src/js/render.js` — canvas drawing: `draw()`.
- `src/js/main.js` — `requestAnimationFrame` loop, keyboard input, overlay/start screens.
- Scripts are **not** ES modules. They share state through globals attached to `window` (`window.MAZE`, `window.createGame`, `window.update`, `window.DIRS`, `window.draw`). Load order in `src/index.html` is load-bearing: maze → game → render → main. When adding a global, set `window.<name>` in the defining file, don't use `import`/`export`.
- `update()` returns early when `state === 'lost'`; `main.js` reacts to `state` (`won`/`lost`) to show overlays.

## Maze / coordinate conventions

- Tile codes: `0` empty/transitable, `1` wall, `2` dot, `3` ghost-pen door.
- Coordinates are cell-based `(x, y)` with origin top-left; `x ∈ [0,27]`, `y ∈ [0,30]`.
- Pac-Man collides with walls and doors; ghosts only with walls.
- Tunnel wrap only on `TUNNEL_ROW` (14), at the left/right edges.
- `MAZE` is pristine; each `createGame()` copies it into `game.grid` so eaten dots don't mutate the source.

## Conventions

- Identifiers in English; comments in Spanish. Match the existing terse style in the JS files.
- Canvas is `560×620` = 28×31 tiles of `TILE = 20`.

## Spec-driven workflow

- Feature work goes through the repo-local skills `/spec` (design, writes `specs/NN-slug.md`) and `/spec-impl` (implements only specs whose status means "Approved").
- `specs/` does not exist yet; the first spec starts at `01-`. `/spec` also creates `specs/.spec-config.yml` (controls `AutoCreateBranch`, default `true`).
- Read `.agents/skills/spec/template.md` before authoring a spec; specs are the contract, code follows the plan.
