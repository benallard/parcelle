/**
 * render.js
 * Renders a field definition onto the canvas.
 */

import { ctx, canvasSize } from './canvas.js';
import { buildPoly, polyArea } from './fields.js';
import { drawTractor } from './tractor.js';
import { lerp, hypot } from './utils.js';

// ── WAVY LINE ─────────────────────────────────────────────────────────
function wavyLine(x1, y1, x2, y2, amp, freq) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = hypot(dx, dy);
  if (len < 1) return;
  const nx  = -dy / len, ny = dx / len;
  const steps = Math.ceil(len / freq);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (let i = 1; i <= steps; i++) {
    const t  = i / steps;
    const t2 = (i - 0.5) / steps;
    const w  = Math.sin(i * Math.PI) * amp;
    ctx.quadraticCurveTo(
      lerp(x1, x2, t2) + nx * w, lerp(y1, y2, t2) + ny * w,
      lerp(x1, x2, t),            lerp(y1, y2, t)
    );
  }
}

// ── ROAD EDGE ─────────────────────────────────────────────────────────
function drawRoad(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = hypot(dx, dy);
  if (len < 1) return;
  const nx = -dy / len * 3.5, ny = dx / len * 3.5;

  ctx.save();
  ctx.strokeStyle = '#8a7a60'; ctx.lineWidth = 1.1; ctx.globalAlpha = 0.65;
  ctx.beginPath(); ctx.moveTo(a.x + nx, a.y + ny); ctx.lineTo(b.x + nx, b.y + ny); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(a.x - nx, a.y - ny); ctx.lineTo(b.x - nx, b.y - ny); ctx.stroke();
  ctx.strokeStyle = '#b0a070'; ctx.lineWidth = 0.6; ctx.setLineDash([8, 6]);
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// ── GATE ──────────────────────────────────────────────────────────────
// Draws gate by erasing a segment-aligned strip, not an axis-aligned rect.
function drawGate(a, b, gateT) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = hypot(dx, dy);
  if (len < 1) return null;
  const gdx = dx / len, gdy = dy / len;         // along edge
  const nx  = -dy / len,  ny =  dx / len;       // perpendicular (into field)
  const { W, H } = canvasSize();
  const gw  = Math.min(W, H) * 0.06;
  const gx  = lerp(a.x, b.x, gateT);
  const gy  = lerp(a.y, b.y, gateT);
  const pad = 6; // perp padding to clear both road lines

  ctx.save();

  // Erase gate gap using a parallelogram aligned to the edge
  ctx.fillStyle = '#f4efe4';
  ctx.beginPath();
  ctx.moveTo(gx - gdx * gw / 2 - nx * pad,  gy - gdy * gw / 2 - ny * pad);
  ctx.lineTo(gx + gdx * gw / 2 - nx * pad,  gy + gdy * gw / 2 - ny * pad);
  ctx.lineTo(gx + gdx * gw / 2 + nx * pad,  gy + gdy * gw / 2 + ny * pad);
  ctx.lineTo(gx - gdx * gw / 2 + nx * pad,  gy - gdy * gw / 2 + ny * pad);
  ctx.closePath();
  ctx.fill();

  // Posts
  [-gw / 2, gw / 2].forEach(off => {
    ctx.beginPath();
    ctx.arc(gx + gdx * off, gy + gdy * off, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#6a5838'; ctx.fill();
  });

  // Bar
  ctx.strokeStyle = '#7a6848'; ctx.lineWidth = 1.3; ctx.setLineDash([3, 2]);
  ctx.beginPath();
  ctx.moveTo(gx - gdx * gw * 0.44, gy - gdy * gw * 0.44);
  ctx.lineTo(gx + gdx * gw * 0.44, gy + gdy * gw * 0.44);
  ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();

  // Return inward-pointing normal (toward field centre)
  return { gx, gy, gdx, gdy, nx, ny };
}

// ── RIVER EDGE ────────────────────────────────────────────────────────
function drawRiver(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = hypot(dx, dy);
  if (len < 1) return;
  const ox = -dy / len * 5, oy = dx / len * 5;

  ctx.save();
  ctx.strokeStyle = '#7a9aaa'; ctx.lineWidth = 2; ctx.globalAlpha = 0.65;
  wavyLine(a.x, a.y, b.x, b.y, 4, 16); ctx.stroke();
  ctx.strokeStyle = '#9ab4c2'; ctx.lineWidth = 0.8; ctx.globalAlpha = 0.35;
  wavyLine(a.x + ox, a.y + oy, b.x + ox, b.y + oy, 3, 12); ctx.stroke();
  ctx.restore();
}

// ── HEDGE EDGE ────────────────────────────────────────────────────────
function drawHedge(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = hypot(dx, dy);
  if (len < 1) return;
  const ndx = -dy / len * 4, ndy = dx / len * 4;

  ctx.save();
  ctx.strokeStyle = '#3a3020'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.70;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  const steps = Math.floor(len / 11);
  ctx.lineWidth = 0.7; ctx.globalAlpha = 0.28;
  for (let s = 1; s < steps; s++) {
    const t = s / steps;
    ctx.beginPath();
    ctx.moveTo(lerp(a.x, b.x, t),        lerp(a.y, b.y, t));
    ctx.lineTo(lerp(a.x, b.x, t) + ndx,  lerp(a.y, b.y, t) + ndy);
    ctx.stroke();
  }
  ctx.restore();
}

// ── FARMHOUSE ─────────────────────────────────────────────────────────
// Placed at the notch corner vertex (inside the field, not on the cut edge).
function drawFarmhouse(cx, cy, W, H) {
  const hs = Math.min(W, H) * 0.038;
  ctx.save();
  // House body
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = '#d4c4a8'; ctx.strokeStyle = '#5a4830'; ctx.lineWidth = 1;
  ctx.fillRect(cx - hs, cy - hs * 0.7, hs * 2, hs * 1.4);
  ctx.strokeRect(cx - hs, cy - hs * 0.7, hs * 2, hs * 1.4);
  // Roof tone
  ctx.fillStyle = '#b8a888'; ctx.globalAlpha = 0.55;
  ctx.fillRect(cx - hs * 0.88, cy - hs * 0.58, hs * 1.76, hs * 1.16);
  // Door
  ctx.fillStyle = '#7a6040'; ctx.globalAlpha = 0.8;
  ctx.fillRect(cx - 3, cy + hs * 0.05, 6, hs * 0.5);
  // Garden patch
  ctx.strokeStyle = '#6a8a5a'; ctx.lineWidth = 0.8;
  ctx.fillStyle = 'rgba(90,130,70,.13)'; ctx.globalAlpha = 0.65;
  ctx.beginPath();
  ctx.ellipse(cx + hs * 1.5, cy, hs * 0.85, hs * 0.6, 0.3, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

// ── MAIN RENDER ───────────────────────────────────────────────────────
export function renderField(def) {
  const { W, H } = canvasSize();

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f4efe4';
  ctx.fillRect(0, 0, W, H);

  const poly  = buildPoly(def, W, H);
  const nOrig = def.verts.length;

  // ── Field fill ──────────────────────────────────────────────────────
  ctx.beginPath();
  poly.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.fillStyle = 'rgba(150,132,95,0.08)';
  ctx.fill();

  // ── Edges ────────────────────────────────────────────────────────────
  // Walk original edges. A notch corner expands to 3 poly points (span=3),
  // all other edges are span=1.
  let pi = 0;
  let tractorGate = null;

  for (let i = 0; i < nOrig; i++) {
    const isNotch = def.notchCorner >= 0 && (i === def.notchCorner % nOrig);
    const span    = isNotch ? 3 : 1;

    const isRoad  = i === (def.roadEdge  % nOrig);
    const isRiver = i === (def.riverEdge % nOrig);

    if (isNotch) {
      // Notch replaces corner C with three poly points: p1, p1r, p2.
      // p1 and p2 are on the two edges adjacent to C.
      // p1r is the inner rectangle corner (the garden interior).
      //
      // Segments to draw:
      //   outer: prev_poly_point → p1  (handled by previous iteration)
      //   notch side 1: p1 → p1r      (always hedge)
      //   notch side 2: p1r → p2      (always hedge)
      //   outer: p2 → next_poly_point (handled by NEXT iteration)
      //          BUT if this is the last orig edge, next iteration
      //          doesn't exist — we must draw p2→poly[0] ourselves.
      //
      // Road/river on this orig edge runs p1→p2 (outer span, not through house).
      const p1   = poly[pi];
      const p1r  = poly[(pi + 1) % poly.length];
      const p2   = poly[(pi + 2) % poly.length];
      const pnxt = poly[(pi + 3) % poly.length]; // first point of next edge

      // Two rectangular notch sides (always hedge)
      drawHedge(p1, p1r);
      drawHedge(p1r, p2);

      // p2 → pnxt: the segment connecting the notch back to the main polygon.
      // This is NEVER drawn by the next iteration (which starts at pnxt),
      // so we must draw it here.
      drawHedge(p2, pnxt);

      // Outer boundary type on this orig edge: road or river runs
      // along p1→p2 (the straight outer boundary, not through house).
      if (isRoad) {
        drawRoad(p1, p2);
        const gate = drawGate(p1, p2, def.gateT);
        if (gate) tractorGate = gate;
      }
      // River coinciding with notch: skip — makes no geographic sense.
    } else {
      const a = poly[pi];
      const b = poly[(pi + span) % poly.length];
      if (isRiver) {
        drawRiver(a, b);
      } else if (isRoad) {
        drawRoad(a, b);
        const gate = drawGate(a, b, def.gateT);
        if (gate) tractorGate = gate;
      } else {
        drawHedge(a, b);
      }
    }

    pi = (pi + span) % poly.length;
  }

  // ── Farmhouse ────────────────────────────────────────────────────────
  // Place at the original corner vertex (C) — which is now inside the
  // rectangular notch recess, outside the workable field.
  if (def.notchCorner >= 0) {
    const nc = def.notchCorner % nOrig;
    const fx = def.verts[nc].x * W;
    const fy = def.verts[nc].y * H;
    drawFarmhouse(fx, fy, W, H);
  }

  // ── Tractor ──────────────────────────────────────────────────────────
  // Parked on road, outside the gate, pointing into the field.
  if (tractorGate) {
    const { gx, gy, nx, ny } = tractorGate;
    // Determine which normal direction points toward the field centroid
    const cx = def.verts.reduce((s, v) => s + v.x, 0) / nOrig * W;
    const cy = def.verts.reduce((s, v) => s + v.y, 0) / nOrig * H;
    const dot = nx * (cx - gx) + ny * (cy - gy);
    // inward = toward field, outward = toward road (where tractor parks)
    const outx = dot > 0 ? -nx : nx;
    const outy = dot > 0 ? -ny : ny;

    const sz = Math.min(W, H) * 0.055;
    const tx = gx + outx * sz * 1.4;
    const ty = gy + outy * sz * 1.4;
    // Tractor faces inward
    const angle = Math.atan2(-outy, -outx) + Math.PI / 2;
    drawTractor(ctx, tx, ty, angle, sz);
  }

  // ── Badge ─────────────────────────────────────────────────────────────
  const pxPerM = W / 140;
  const areaHa = (polyArea(poly) / (pxPerM * pxPerM)) / 10000;
  document.getElementById('badge-area').textContent = areaHa.toFixed(1);
  document.getElementById('badge-name').textContent = def.name;
  document.getElementById('field-badge').classList.add('visible');
}
