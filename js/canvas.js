/**
 * canvas.js
 * Canvas setup, resize handling, and dissolve transition.
 */

export const canvas = document.getElementById('field-canvas');
export const ctx    = canvas.getContext('2d');
const veil          = document.getElementById('canvas-veil');

/** Resize canvas to match its CSS display size at device pixel ratio. */
export function setupCanvas() {
  const dpr     = window.devicePixelRatio || 1;
  const W       = canvas.offsetWidth;
  const H       = canvas.offsetHeight;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function canvasSize() {
  return { W: canvas.offsetWidth, H: canvas.offsetHeight };
}

/**
 * Dissolve transition: fade canvas to cream, run callback, fade back in.
 * @param {Function} callback - called while veil is opaque
 * @param {number} duration   - total half-transition in ms (default 500)
 */
export function dissolve(callback, duration = 500) {
  veil.classList.add('dissolving');
  setTimeout(() => {
    callback();
    veil.classList.remove('dissolving');
  }, duration);
}
