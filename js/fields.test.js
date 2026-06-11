import { describe, it, expect, beforeAll } from 'vitest';
import { generateRandom, buildPoly, polyArea } from '../js/fields.js';

// ── generateRandom ────────────────────────────────────────────────────
describe('generateRandom', () => {
  it('produces 5-7 vertices', () => {
    for (let i = 0; i < 50; i++) {
      const f = generateRandom();
      expect(f.verts.length).toBeGreaterThanOrEqual(5);
      expect(f.verts.length).toBeLessThanOrEqual(7);
    }
  });

  it('all verts are within [0,1]', () => {
    for (let i = 0; i < 50; i++) {
      const f = generateRandom();
      f.verts.forEach(v => {
        expect(v.x).toBeGreaterThanOrEqual(0);
        expect(v.x).toBeLessThanOrEqual(1);
        expect(v.y).toBeGreaterThanOrEqual(0);
        expect(v.y).toBeLessThanOrEqual(1);
      });
    }
  });

  it('roadEdge is a valid index', () => {
    for (let i = 0; i < 50; i++) {
      const f = generateRandom();
      expect(f.roadEdge).toBeGreaterThanOrEqual(0);
      expect(f.roadEdge).toBeLessThan(f.verts.length);
    }
  });

  it('riverEdge is a valid index and differs from roadEdge', () => {
    for (let i = 0; i < 50; i++) {
      const f = generateRandom();
      expect(f.riverEdge).toBeGreaterThanOrEqual(0);
      expect(f.riverEdge).toBeLessThan(f.verts.length);
      expect(f.riverEdge).not.toBe(f.roadEdge);
    }
  });

  it('notchCorner is a valid index', () => {
    for (let i = 0; i < 50; i++) {
      const f = generateRandom();
      expect(f.notchCorner).toBeGreaterThanOrEqual(0);
      expect(f.notchCorner).toBeLessThan(f.verts.length);
    }
  });

  it('notchCorner differs from roadEdge', () => {
    for (let i = 0; i < 100; i++) {
      const f = generateRandom();
      expect(f.notchCorner).not.toBe(f.roadEdge);
    }
  });

  it('notchCorner differs from riverEdge', () => {
    for (let i = 0; i < 100; i++) {
      const f = generateRandom();
      expect(f.notchCorner).not.toBe(f.riverEdge);
    }
  });

  it('gateT is within [0,1]', () => {
    for (let i = 0; i < 50; i++) {
      const f = generateRandom();
      expect(f.gateT).toBeGreaterThanOrEqual(0);
      expect(f.gateT).toBeLessThanOrEqual(1);
    }
  });
});

// ── buildPoly ─────────────────────────────────────────────────────────
describe('buildPoly', () => {
  const W = 800, H = 600;

  it('scales verts to canvas size', () => {
    const def = {
      verts: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }],
      notchCorner: -1,
    };
    const poly = buildPoly(def, W, H);
    expect(poly[0].x).toBe(0);   expect(poly[0].y).toBe(0);
    expect(poly[1].x).toBe(W);   expect(poly[1].y).toBe(0);
    expect(poly[2].x).toBe(W);   expect(poly[2].y).toBe(H);
    expect(poly[3].x).toBe(0);   expect(poly[3].y).toBe(H);
  });

  it('no notch: vertex count unchanged', () => {
    const def = {
      verts: [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.1 }, { x: 0.9, y: 0.9 }, { x: 0.1, y: 0.9 }],
      notchCorner: -1,
    };
    const poly = buildPoly(def, W, H);
    expect(poly.length).toBe(4);
  });

  it('notch adds 2 extra vertices (corner becomes 3 points)', () => {
    const def = {
      verts: [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.1 }, { x: 0.9, y: 0.9 }, { x: 0.1, y: 0.9 }],
      notchCorner: 0,
    };
    const poly = buildPoly(def, W, H);
    // 4 original verts, corner 0 replaced by 3 points → 6 total
    expect(poly.length).toBe(6);
  });

  it('notch points lie between original adjacent vertices', () => {
    const def = {
      verts: [
        { x: 0.5, y: 0.1 },  // 0 — notched
        { x: 0.9, y: 0.5 },  // 1
        { x: 0.5, y: 0.9 },  // 2
        { x: 0.1, y: 0.5 },  // 3
      ],
      notchCorner: 0,
    };
    const poly = buildPoly(def, W, H);
    // poly[0] should be between vert[0] and vert[3] (prev)
    // poly[2] should be between vert[0] and vert[1] (next)
    const v0 = { x: 0.5 * W, y: 0.1 * H };
    const vPrev = { x: 0.1 * W, y: 0.5 * H };
    const vNext = { x: 0.9 * W, y: 0.5 * H };

    // p1 should be closer to v0 than vPrev is
    const p1 = poly[0];
    expect(Math.hypot(p1.x - v0.x, p1.y - v0.y))
      .toBeLessThan(Math.hypot(vPrev.x - v0.x, vPrev.y - v0.y));
  });

  it('handles notchCorner at last index (wraps correctly)', () => {
    const def = {
      verts: [{ x: 0.1, y: 0.1 }, { x: 0.9, y: 0.1 }, { x: 0.9, y: 0.9 }, { x: 0.1, y: 0.9 }],
      notchCorner: 3,
    };
    expect(() => buildPoly(def, W, H)).not.toThrow();
    const poly = buildPoly(def, W, H);
    expect(poly.length).toBe(6);
  });
});

// ── polyArea ──────────────────────────────────────────────────────────
describe('polyArea', () => {
  it('unit square has area 1', () => {
    const pts = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];
    expect(polyArea(pts)).toBeCloseTo(1);
  });

  it('10×20 rectangle has area 200', () => {
    const pts = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 20 }, { x: 0, y: 20 }];
    expect(polyArea(pts)).toBeCloseTo(200);
  });

  it('right triangle with legs 3 and 4 has area 6', () => {
    const pts = [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 0, y: 4 }];
    expect(polyArea(pts)).toBeCloseTo(6);
  });

  it('is positive regardless of vertex winding order', () => {
    const cw  = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];
    const ccw = [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 0 }];
    expect(polyArea(cw)).toBeGreaterThan(0);
    expect(polyArea(ccw)).toBeGreaterThan(0);
  });
});

// ── headland width derivation ─────────────────────────────────────────
describe('headland width derivation', () => {
  const headlandWidth = (turningRadius, workingWidth) =>
    Math.ceil(turningRadius / workingWidth) * workingWidth;

  it('is always a whole number of passes', () => {
    const cases = [
      [5, 3], [6, 3], [7, 3], [5, 2.5], [12, 4], [3, 3], [2, 3],
    ];
    cases.forEach(([r, w]) => {
      const hw = headlandWidth(r, w);
      expect(hw % w).toBeCloseTo(0);
    });
  });

  it('is always >= turning radius', () => {
    for (let r = 2; r <= 20; r += 0.5) {
      for (let w = 1; w <= 12; w += 0.5) {
        expect(headlandWidth(r, w)).toBeGreaterThanOrEqual(r);
      }
    }
  });

  it('exact fit: radius equals working width', () => {
    expect(headlandWidth(3, 3)).toBe(3);
  });

  it('just over: needs two passes', () => {
    expect(headlandWidth(3.1, 3)).toBe(6);
  });
});

// ── edge coverage (regression for missing p2→pnxt segment) ───────────
import { generateRandom, buildPoly } from '../js/fields.js';

describe('edge coverage after notch', () => {
  function allEdgesCovered(def) {
    const poly  = buildPoly(def, 800, 600);
    const plen  = poly.length;
    const nOrig = def.verts.length;
    let pi = 0;
    const drawn = new Set();
    for (let i = 0; i < nOrig; i++) {
      const isNotch = def.notchCorner >= 0 && (i === def.notchCorner % nOrig);
      const span    = isNotch ? 3 : 1;
      if (isNotch) {
        drawn.add(`${pi}→${(pi+1)%plen}`);
        drawn.add(`${(pi+1)%plen}→${(pi+2)%plen}`);
        drawn.add(`${(pi+2)%plen}→${(pi+3)%plen}`);
      } else {
        drawn.add(`${pi}→${(pi+span)%plen}`);
      }
      pi = (pi + span) % plen;
    }
    for (let i = 0; i < plen; i++) {
      if (!drawn.has(`${i}→${(i+1)%plen}`)) return false;
    }
    return true;
  }

  it('covers all poly edges for 500 random fields', () => {
    for (let i = 0; i < 500; i++) {
      expect(allEdgesCovered(generateRandom())).toBe(true);
    }
  });
});
