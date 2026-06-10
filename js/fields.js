/**
 * fields.js
 * Named field definitions and random field generator.
 * Fields are normalised to a [0,1] coordinate space,
 * scaled to canvas pixels at render time.
 */

import { rnd, rndInt } from './utils.js';

// ── NAMED FIELDS ─────────────────────────────────────────────────────
export let NAMED_FIELDS = {};

export async function loadFields() {
  const res  = await fetch('./data/fields.json');
  NAMED_FIELDS = await res.json();
  return NAMED_FIELDS;
}

// ── RANDOM GENERATOR ─────────────────────────────────────────────────
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
    notchT:      rnd(0.22, 0.32),
    gateT:       rnd(0.25, 0.72),
    _generated:  true,
  };
}

// ── POLYGON BUILDER ───────────────────────────────────────────────────
// Scales normalised verts to canvas pixels.
// If def has a notchCorner, cuts a rectangular plot from that corner
// representing the farmhouse + garden. Two clean right-angle bends
// replace the original corner vertex.
//
// Given corner C with adjacent verts A (prev) and B (next):
//
//   A
//   |
//   p1               ← on C→A edge, distance d from C
//   |
//   p1r────p2        ← p1r is the inner rectangle corner
//           |          p2 is on C→B edge, same distance d from C
//           B
//
// The original corner C is now the garden interior — excluded from
// the workable field polygon.
//
export function buildPoly(def, W, H) {
  const scaled = def.verts.map(v => ({ x: v.x * W, y: v.y * H }));

  if (def.notchCorner < 0) return scaled;

  const n    = scaled.length;
  const nc   = def.notchCorner % n;
  const prev = (nc - 1 + n) % n;
  const next = (nc + 1) % n;

  // t: fraction of adjacent edge length used for notch depth.
  // Stored on def at generation time; default 0.18 for named fields.
  const t  = def.notchT || 0.18;

  const C  = scaled[nc];
  const A  = scaled[prev];
  const B  = scaled[next];

  // Unit vectors along each edge away from the corner
  const lenCA = Math.hypot(A.x - C.x, A.y - C.y);
  const lenCB = Math.hypot(B.x - C.x, B.y - C.y);
  if (lenCA < 1 || lenCB < 1) return scaled; // degenerate, skip notch

  const eCA = { x: (A.x - C.x) / lenCA, y: (A.y - C.y) / lenCA };
  const eCB = { x: (B.x - C.x) / lenCB, y: (B.y - C.y) / lenCB };

  // Square notch depth — same on both edges
  const d = Math.min(lenCA, lenCB) * t;

  // Three replacement points (corner becomes these three):
  const p1  = { x: C.x + eCA.x * d,               y: C.y + eCA.y * d               }; // on C→A
  const p1r = { x: C.x + eCA.x * d + eCB.x * d,   y: C.y + eCA.y * d + eCB.y * d   }; // inner corner
  const p2  = { x: C.x + eCB.x * d,               y: C.y + eCB.y * d               }; // on C→B

  const poly = [];
  for (let i = 0; i < n; i++) {
    if (i === nc) { poly.push(p1, p1r, p2); }
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
