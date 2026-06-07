/**
 * fields.js
 * Named field definitions and random field generator.
 * Fields are normalised to a [0,1] coordinate space,
 * scaled to canvas pixels at render time.
 */

import { rnd, rndInt } from './utils.js';

// ── NAMED FIELDS ─────────────────────────────────────────────────────
// Loaded from data/fields.json at init. Exported after load.
export let NAMED_FIELDS = {};

export async function loadFields() {
  const res  = await fetch('./data/fields.json');
  NAMED_FIELDS = await res.json();
  return NAMED_FIELDS;
}

// ── RANDOM GENERATOR ─────────────────────────────────────────────────
// Produces an L-ish irregular polygon with a farmhouse notch corner.
export function generateRandom() {
  const nv = rndInt(5, 7);
  const startAngle = rnd(0, Math.PI * 2 / nv);
  const verts = [];

  for (let i = 0; i < nv; i++) {
    const base = startAngle + Math.PI * 2 * i / nv;
    const a    = base + rnd(-0.22, 0.22);
    const r    = rnd(0.70, 1.0);
    verts.push({
      x: 0.5 + Math.cos(a) * r * 0.40,
      y: 0.5 + Math.sin(a) * r * 0.40,
    });
  }

  const roadEdge  = rndInt(0, nv - 1);
  const riverEdge = (roadEdge + rndInt(2, Math.max(2, Math.floor(nv / 2)))) % nv;

  return {
    name:        'Random',
    desc:        'Never quite the same.',
    verts,
    roadEdge,
    riverEdge,
    notchCorner: rndInt(0, nv - 1),
    notchT:      rnd(0.14, 0.22),
    gateT:       rnd(0.25, 0.72),
    _generated:  true,
  };
}

// ── POLYGON BUILDER ───────────────────────────────────────────────────
// Scales normalised verts to canvas pixels.
// If def has a notchCorner, cuts that corner to represent the farmhouse.
export function buildPoly(def, W, H) {
  const scaled = def.verts.map(v => ({ x: v.x * W, y: v.y * H }));

  if (def.notchCorner < 0) return scaled;

  const n    = scaled.length;
  const nc   = def.notchCorner % n;
  const prev = (nc - 1 + n) % n;
  const next = (nc + 1) % n;
  // Use a fixed notch fraction stored on def (set once at generation time).
  // Falls back to 0.18 for named fields that don't specify one.
  const t = def.notchT || 0.18;

  const p1 = {
    x: scaled[nc].x + (scaled[prev].x - scaled[nc].x) * t,
    y: scaled[nc].y + (scaled[prev].y - scaled[nc].y) * t,
  };
  const p2 = {
    x: scaled[nc].x + (scaled[next].x - scaled[nc].x) * t,
    y: scaled[nc].y + (scaled[next].y - scaled[nc].y) * t,
  };
  // pm exactly on bisector — no jitter, stable across redraws
  const pm = {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };

  const poly = [];
  for (let i = 0; i < n; i++) {
    if (i === nc) { poly.push(p1, pm, p2); }
    else          { poly.push({ ...scaled[i] }); }
  }
  return poly;
}

// ── POLY AREA (shoelace) ──────────────────────────────────────────────
export function polyArea(pts) {
  let a = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    a += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return Math.abs(a) / 2;
}
