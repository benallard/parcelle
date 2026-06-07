# AGENTS.md — Parcelle codebase guide

For human contributors and AI agents working on this repository.

## What this is

**Parcelle / Working the Land** is an interactive web experience about agricultural field path planning. A visitor follows a tractor working a field — passively at first, then with increasing agency. The experience is narrative-first, geometry-second.

No framework. No build step. Vanilla HTML/CSS/JS with ES modules. Runs on GitHub Pages directly from `main`.

## Running locally

Because ES modules are used, a local server is required — `file://` won't work.

```bash
cd parcelle
python3 -m http.server
# then open http://localhost:8000
```

## File structure

```
parcelle/
  index.html                 Shell: layout, font links, CSS imports, one <script type="module">
  README.md                  User-facing intro
  AGENTS.md                  This file

  css/
    base.css                 Reset, CSS variables (palette, fonts), loading veil
    narrative.css            Left panel: layout, narrative blocks, field selector thumbnails
    canvas.css               Right panel: canvas, dissolve veil, field badge

  data/
    fields.json              Named field polygon definitions (rectangle, triangle, hansen)
                             Normalised [0,1] coords. Add new fields here.

  js/
    main.js                  Entry point. Loads data, sets up canvas, sequences narrative
                             beats, orchestrates chapters via shared state object.

    utils.js                 Pure math helpers: rnd, rndInt, lerp, hypot, clamp,
                             segNormal, segPoint. No side effects, no imports.

    canvas.js                Canvas setup and resize. Exports: canvas, ctx, setupCanvas(),
                             canvasSize(), dissolve(callback, duration).

    fields.js                Field data: loadFields() fetches data/fields.json into
                             NAMED_FIELDS. generateRandom() builds a randomised L-ish
                             polygon. buildPoly(def, W, H) scales + applies notch cut.
                             polyArea(pts) shoelace formula.

    render.js                Renders a field definition to the canvas. Handles edge types
                             (road, river, hedge), gate, farmhouse, tractor placement.
                             Call renderField(def) to redraw the scene.

    tractor.js               Draws a top-down pencil-sketch tractor. Self-contained —
                             replace this file to update the tractor asset without touching
                             anything else. Signature:
                             drawTractor(ctx, x, y, angle, sz, opts)

    chapters/
      ch0-field.js           Chapter 0: field selection. Builds thumbnail grid, handles
                             field switching with dissolve transition. Emits 'fieldSelected'.

      ch1-machine.js         Chapter 1: machine selection. (scaffolded — not yet built)
      ch2-attachment.js      Chapter 2: implement selection. (scaffolded — not yet built)
      ch3-headland.js        Chapter 3: headland derivation + visualisation. (not yet built)
      ch4-firstpass.js       Chapter 4: first pass, corner manoeuvre. (not yet built)
```

## Architecture principles

**Chapters are independent.** Each chapter receives the shared `state` object and emits events through it. Chapters do not import each other. `main.js` is the only file that knows the sequence.

**State flows one way.** Chapters write to `state` and emit events. `main.js` listens and decides what to do next (unlock the next chapter, update narrative, etc.).

**Canvas is always in sync.** `renderField(def)` is idempotent — call it any time to redraw. `dissolve(callback)` handles the cream-fade transition before a redraw.

**tractor.js is a replaceable asset.** The drawing logic is self-contained. Swap the file, keep the signature, nothing else breaks.

## Shared state object (main.js)

```js
state = {
  currentField:  object | null,   // active field definition
  randomField:   object | null,   // current random field (regenerated on ↺)
  machine:       object | null,   // ch1: selected machine (turning radius, etc.)
  attachment:    object | null,   // ch2: selected implement

  on(event, fn)        // subscribe
  emit(event, payload) // publish
}
```

## Field definition format

```js
{
  name:        string,   // display name
  desc:        string,   // one-line description for thumbnail
  verts:       [{x, y}], // normalised [0,1] polygon vertices, clockwise
  roadEdge:    number,   // index of edge that is a road
  riverEdge:   number,   // index of edge that is a river/ditch
  notchCorner: number,   // index of corner cut for farmhouse (-1 if none)
  gateT:       number,   // position of gate along road edge [0,1]
}
```

## Visual language

Three colour states — everything on canvas is in one of these:

| State       | Meaning                        | Colour                  |
|-------------|--------------------------------|-------------------------|
| **Active**  | What is happening right now    | `--green-active #4a7c55`|
| **Secondary**| Present but not the focus     | `--amber-secondary`     |
| **Settled** | Past, done, receding           | `--brown-settled #8a7055`|

Geography (boundary, river, road, farmhouse) sits outside these three states — permanent, consistent tone throughout.

Transitions between states: slow CSS opacity fade (~2s), not a hard switch.

## What to build next

1. `ch1-machine.js` — machine type selector (compact / row-crop / large). Sets `state.machine.turningRadius`.
2. `ch2-attachment.js` — implement selector. Sets `state.attachment` (workingWidth, lateralOffset, liftable, flipType).
3. `ch3-headland.js` — derives headland width from `ceil(turningRadius / workingWidth) * workingWidth`, visualises the two zones.
4. Corner manoeuvre geometry — arc + reverse, using Dubins path principles. See literature notes below.

## Literature & prior art

- **Dubins paths** — minimum-length paths between two poses with a minimum turn radius. The mathematical backbone for headland turn geometry.
- **Reeds-Shepp curves** — extends Dubins to include reverse. Relevant for the arc + reverse corner manoeuvre.
- **Søren Hansen (Aarhus University)** — headland turning manoeuvres in agricultural vehicles. The Hansen field in `fields.json` is his benchmark.
- **Courseplay** (github.com/Courseplay) — open-source Farming Simulator mod. Working Lua implementation of headland corner turns (`headland.lua`). Two modes: smooth (arc only, accepts missed triangle) and turn (arc + reverse, full coverage).
- **AgOpenGPS / AgValoniaGPS** (github.com/AgOpenGPS-Official) — open-source precision agriculture guidance. C# implementation of U-turn and headland manoeuvres.
- **ISO 11783 (ISOBUS)** — industry standard for farm machinery communication, includes path planning concepts.
