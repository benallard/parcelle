/**
 * utils.js
 * Shared math and geometry helpers.
 */

export const rnd    = (a, b) => a + Math.random() * (b - a);
export const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
export const lerp   = (a, b, t) => a + (b - a) * t;
export const hypot  = (a, b) => Math.hypot(a, b);
export const clamp  = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Perpendicular unit normal to segment (a→b), pointing left */
export function segNormal(ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len = Math.hypot(dx, dy);
  return { x: -dy / len, y: dx / len };
}

/** Point along segment a→b at parameter t */
export function segPoint(ax, ay, bx, by, t) {
  return { x: lerp(ax, bx, t), y: lerp(ay, by, t) };
}
