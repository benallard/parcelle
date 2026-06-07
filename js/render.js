/**
 * render.js
 * Renders a field definition onto the canvas.
 * Handles edge types (road, river, hedge), farmhouse, gate, tractor.
 */

import { ctx, canvasSize } from './canvas.js';
import { buildPoly, polyArea } from './fields.js';
import { drawTractor } from './tractor.js';
import { lerp, hypot } from './utils.js';

// ── WAVY LINE ─────────────────────────────────────────────────────────
function wavyLine(x1, y1, x2, y2, amp, freq) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = hypot(dx, dy);
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
      lerp(x1, x2, t),           lerp(y1, y2, t)
    );
  }
}

// ── ROAD EDGE ────────────────────────────────────────────────────────
function drawRoad(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = hypot(dx, dy);
  const nx = -dy / len * 3.5, ny = dx / len * 3.5;

  ctx.save();
  ctx.strokeStyle = '#8a7a60';
  ctx.lineWidth   = 1.1;
  ctx.globalAlpha = 0.65;
  ctx.beginPath(); ctx.moveTo(a.x + nx, a.y + ny); ctx.lineTo(b.x + nx, b.y + ny); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(a.x - nx, a.y - ny); ctx.lineTo(b.x - nx, b.y - ny); ctx.stroke();
  ctx.strokeStyle = '#b0a070';
  ctx.lineWidth   = 0.6;
  ctx.setLineDash([8, 6]);
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// ── GATE ─────────────────────────────────────────────────────────────
function drawGate(a, b, gateT) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = hypot(dx, dy);
  const gdx = dx / len, gdy = dy / len;
  const nx  = -dy / len * 3.5, ny = dx / len * 3.5;
  const { W, H } = canvasSize();
  const gw  = Math.min(W, H) * 0.06;
  const gx  = lerp(a.x, b.x, gateT);
  const gy  = lerp(a.y, b.y, gateT);

  ctx.save();
  // Clear road lines in gap
  ctx.fillStyle = '#f4efe4';
  ctx.fillRect(gx - gdx * gw / 2 - Math.abs(nx) - 1,
               gy - gdy * gw / 2 - Math.abs(ny) - 1,
               gdx * gw + Math.abs(nx) * 2 + 2,
               gdy * gw + Math.abs(ny) * 2 + 2);
  // Posts
  [-gw / 2, gw / 2].forEach(off => {
    ctx.beginPath();
    ctx.arc(gx + gdx * off, gy + gdy * off, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#6a5838';
    ctx.fill();
  });
  // Bar
  ctx.strokeStyle = '#7a6848';
  ctx.lineWidth   = 1.3;
  ctx.setLineDash([3, 2]);
  ctx.beginPath();
  ctx.moveTo(gx - gdx * gw * 0.44, gy - gdy * gw * 0.44);
  ctx.lineTo(gx + gdx * gw * 0.44, gy + gdy * gw * 0.44);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  return { gx, gy, gdx, gdy, nx: -dy / len, ny: dx / len };
}

// ── RIVER EDGE ───────────────────────────────────────────────────────
function drawRiver(a, b) {
  ctx.save();
  ctx.strokeStyle = '#7a9aaa';
  ctx.lineWidth   = 2;
  ctx.globalAlpha = 0.65;
  wavyLine(a.x, a.y, b.x, b.y, 4, 16);
  ctx.stroke();

  const dx = b.x - a.x, dy = b.y - a.y, len = hypot(dx, dy);
  const ox = -dy / len * 5, oy = dx / len * 5;
  ctx.strokeStyle = '#9ab4c2';
  ctx.lineWidth   = 0.8;
  ctx.globalAlpha = 0.35;
  wavyLine(a.x + ox, a.y + oy, b.x + ox, b.y + oy, 3, 12);
  ctx.stroke();
  ctx.restore();
}

// ── HEDGE EDGE ───────────────────────────────────────────────────────
function drawHedge(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = hypot(dx, dy);
  ctx.save();
  ctx.strokeStyle = '#3a3020';
  ctx.lineWidth   = 1.5;
  ctx.globalAlpha = 0.70;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  // Tick marks suggesting hedge
  const steps = Math.floor(len / 11);
  const ndx   = -dy / len * 4, ndy = dx / len * 4;
  ctx.lineWidth   = 0.7;
  ctx.globalAlpha = 0.28;
  for (let s = 1; s < steps; s++) {
    const t = s / steps;
    ctx.beginPath();
    ctx.moveTo(lerp(a.x, b.x, t),          lerp(a.y, b.y, t));
    ctx.lineTo(lerp(a.x, b.x, t) + ndx,    lerp(a.y, b.y, t) + ndy);
    ctx.stroke();
  }
  ctx.restore();
}

// ── FARMHOUSE ────────────────────────────────────────────────────────
function drawFarmhouse(ncv, W, H) {
  const hs = Math.min(W, H) * 0.038;
  ctx.save();
  ctx.globalAlpha = 0.88;
  ctx.fillStyle   = '#d4c4a8';
  ctx.strokeStyle = '#5a4830';
  ctx.lineWidth   = 1;
  ctx.fillRect(ncv.x - hs, ncv.y - hs * 0.7, hs * 2, hs * 1.4);
  ctx.strokeRect(ncv.x - hs, ncv.y - hs * 0.7, hs * 2, hs * 1.4);
  ctx.fillStyle   = '#b8a888';
  ctx.globalAlpha = 0.55;
  ctx.fillRect(ncv.x - hs * 0.88, ncv.y - hs * 0.58, hs * 1.76, hs * 1.16);
  // Door
  ctx.fillStyle   = '#7a6040';
  ctx.globalAlpha = 0.8;
  ctx.fillRect(ncv.x - 3, ncv.y + hs * 0.05, 6, hs * 0.5);
  // Garden
  ctx.strokeStyle = '#6a8a5a';
  ctx.lineWidth   = 0.8;
  ctx.fillStyle   = 'rgba(90,130,70,.13)';
  ctx.globalAlpha = 0.65;
  ctx.beginPath();
  ctx.ellipse(ncv.x + hs * 1.5, ncv.y, hs * 0.85, hs * 0.6, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// ── MAIN RENDER ──────────────────────────────────────────────────────
export function renderField(def) {
  const { W, H } = canvasSize();

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f4efe4';
  ctx.fillRect(0, 0, W, H);

  const poly  = buildPoly(def, W, H);
  const nOrig = def.verts.length;

  // Field fill
  ctx.beginPath();
  poly.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.fillStyle = 'rgba(150,132,95,0.08)';
  ctx.fill();

  // Draw each original edge
  // Track poly index separately since notch expands one orig edge to 3 poly points
  let pi = 0;
  let tractorPlacement = null;

  for (let i = 0; i < nOrig; i++) {
    const isNotch = (i === ((def.notchCorner + nOrig) % nOrig));
    const span    = isNotch ? 3 : 1;
    const a       = poly[pi];
    const b       = poly[(pi + span) % poly.length];

    const isRoad  = (i % nOrig) === (def.roadEdge  % nOrig);
    const isRiver = (i % nOrig) === (def.riverEdge % nOrig);

    if (isRiver) {
      drawRiver(a, b);
    } else if (isRoad) {
      drawRoad(a, b);
      const gate = drawGate(a, b, def.gateT);
      tractorPlacement = { gate, a, b };
    } else {
      drawHedge(a, b);
    }

    pi = (pi + span) % poly.length;
  }

  // Farmhouse
  if (def.notchCorner >= 0) {
    const nc  = def.notchCorner % nOrig;
    const ncv = { x: def.verts[nc].x * W, y: def.verts[nc].y * H };
    drawFarmhouse(ncv, W, H);
  }

  // Tractor — parked on road, outside gate, facing field
  if (tractorPlacement) {
    const { gate } = tractorPlacement;
    const { gx, gy, nx, ny } = gate;

    // Field centroid (rough) to determine inward direction
    const cx = def.verts.reduce((s, v) => s + v.x, 0) / nOrig * W;
    const cy = def.verts.reduce((s, v) => s + v.y, 0) / nOrig * H;
    const toCx = cx - gx, toCy = cy - gy;
    // Normal pointing outward from field
    const outx = (nx * toCx + ny * toCy) < 0 ? nx : -nx;
    const outy = (nx * toCx + ny * toCy) < 0 ? ny : -ny;

    const sz = Math.min(W, H) * 0.055;
    const tx = gx + outx * sz * 1.2;
    const ty = gy + outy * sz * 1.2;
    // Tractor faces inward = opposite of outward normal
    const tractorAngle = Math.atan2(-outy, -outx) + Math.PI / 2;
    drawTractor(ctx, tx, ty, tractorAngle, sz);
  }

  // Badge
  const pxPerM  = W / 140;
  const areaHa  = (polyArea(poly) / (pxPerM * pxPerM)) / 10000;
  document.getElementById('badge-area').textContent = areaHa.toFixed(1);
  document.getElementById('badge-name').textContent = def.name;
  document.getElementById('field-badge').classList.add('visible');
}
