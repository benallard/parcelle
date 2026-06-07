/**
 * tractor.js
 * Draws a top-down pencil-sketch tractor.
 * Self-contained — replace this file to update the tractor asset.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x       - centre position x
 * @param {number} y       - centre position y
 * @param {number} angle   - heading in radians (0 = pointing up / north)
 * @param {number} sz      - body length in pixels
 * @param {object} opts    - { state: 'active'|'secondary' }
 */
export function drawTractor(ctx, x, y, angle, sz, opts = {}) {
  const state = opts.state || 'active';
  const alpha = state === 'secondary' ? 0.55 : 1.0;

  const ink   = '#1e1a12';
  const fill  = '#ede8dc';
  const wfill = '#c8c0a8';

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);

  // ── Body ────────────────────────────────────────
  ctx.beginPath();
  ctx.roundRect(-sz * 0.18, -sz * 0.50, sz * 0.36, sz, [sz * 0.06]);
  ctx.fillStyle   = fill;
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth   = 1.2;
  ctx.stroke();

  // ── Rear wheels (wide, top-down rectangles) ─────
  [[-1], [1]].forEach(([s]) => {
    const wx = s > 0 ? sz * 0.20 : -sz * 0.33;
    ctx.beginPath();
    ctx.roundRect(wx, sz * 0.05, sz * 0.12, sz * 0.38, 2);
    ctx.fillStyle   = wfill;
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth   = 1;
    ctx.stroke();
    // tread lines
    ctx.save();
    ctx.globalAlpha *= 0.38;
    ctx.strokeStyle = ink;
    ctx.lineWidth   = 0.7;
    for (let i = 1; i <= 4; i++) {
      const ty = sz * 0.05 + sz * 0.38 * i / 5;
      ctx.beginPath();
      ctx.moveTo(wx, ty);
      ctx.lineTo(wx + sz * 0.12, ty);
      ctx.stroke();
    }
    ctx.restore();
  });

  // ── Front wheels (narrower, closer together) ────
  [-1, 1].forEach(s => {
    const wx = s > 0 ? sz * 0.10 : -sz * 0.22;
    ctx.beginPath();
    ctx.roundRect(wx, -sz * 0.46, sz * 0.11, sz * 0.20, 2);
    ctx.fillStyle   = wfill;
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth   = 0.9;
    ctx.stroke();
  });

  // ── Steering wheel ───────────────────────────────
  ctx.beginPath();
  ctx.arc(0, -sz * 0.08, sz * 0.07, 0, Math.PI * 2);
  ctx.strokeStyle = ink;
  ctx.lineWidth   = 1;
  ctx.stroke();

  // ── Seat (arc) ───────────────────────────────────
  ctx.beginPath();
  ctx.arc(0, sz * 0.28, sz * 0.10, Math.PI * 0.1, Math.PI * 0.9);
  ctx.strokeStyle = ink;
  ctx.lineWidth   = 1.8;
  ctx.stroke();

  // ── Exhaust pipe (right side, front) ────────────
  ctx.beginPath();
  ctx.roundRect(sz * 0.10, -sz * 0.44, sz * 0.04, sz * 0.10, 1);
  ctx.fillStyle   = '#b0a080';
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth   = 0.7;
  ctx.stroke();

  // ── Smoke wisps ──────────────────────────────────
  ctx.save();
  ctx.strokeStyle = '#9a9080';
  ctx.lineWidth   = 0.9;
  ctx.globalAlpha *= 0.38;
  ctx.beginPath();
  ctx.moveTo(sz * 0.12, -sz * 0.46);
  ctx.bezierCurveTo(sz * 0.18, -sz * 0.56, sz * 0.10, -sz * 0.66, sz * 0.15, -sz * 0.76);
  ctx.stroke();
  ctx.globalAlpha *= 0.5;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(sz * 0.12, -sz * 0.46);
  ctx.bezierCurveTo(sz * 0.06, -sz * 0.58, sz * 0.14, -sz * 0.68, sz * 0.09, -sz * 0.80);
  ctx.stroke();
  ctx.restore();

  // ── Three-point hitch ────────────────────────────
  ctx.save();
  ctx.setLineDash([2, 3]);
  ctx.strokeStyle = '#4a3820';
  ctx.lineWidth   = 0.9;
  ctx.globalAlpha *= 0.55;
  [[-sz * 0.10, sz * 0.46], [sz * 0.10, sz * 0.46], [0, sz * 0.52]].forEach(([hx, hy]) => {
    ctx.beginPath();
    ctx.moveTo(hx * 0.5, sz * 0.40);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(hx, hy, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#a09070';
    ctx.fill();
  });
  ctx.setLineDash([]);
  ctx.restore();

  ctx.restore();
}
