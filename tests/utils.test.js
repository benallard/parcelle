import { describe, it, expect } from 'vitest';
import { rnd, rndInt, lerp, hypot, clamp, segNormal, segPoint } from '../js/utils.js';

describe('rnd', () => {
  it('stays within bounds', () => {
    for (let i = 0; i < 200; i++) {
      const v = rnd(2, 5);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThan(5);
    }
  });
});

describe('rndInt', () => {
  it('returns integers within inclusive bounds', () => {
    const seen = new Set();
    for (let i = 0; i < 500; i++) {
      const v = rndInt(0, 3);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(3);
      seen.add(v);
    }
    // All four values should appear
    expect(seen.size).toBe(4);
  });
});

describe('lerp', () => {
  it('returns a at t=0', ()  => expect(lerp(10, 20, 0)).toBe(10));
  it('returns b at t=1', ()  => expect(lerp(10, 20, 1)).toBe(20));
  it('returns mid at t=0.5', () => expect(lerp(10, 20, 0.5)).toBe(15));
});

describe('hypot', () => {
  it('3-4-5 triangle', () => expect(hypot(3, 4)).toBe(5));
  it('zero', ()           => expect(hypot(0, 0)).toBe(0));
});

describe('clamp', () => {
  it('clamps below', () => expect(clamp(-1, 0, 10)).toBe(0));
  it('clamps above', () => expect(clamp(11, 0, 10)).toBe(10));
  it('passes through', () => expect(clamp(5, 0, 10)).toBe(5));
});

describe('segNormal', () => {
  it('horizontal segment: normal points downward in canvas coords (y-axis inverted)', () => {
    // Canvas: y increases downward. A segment pointing right (+x)
    // has its left-hand normal pointing downward (+y), not upward.
    const n = segNormal(0, 0, 10, 0);
    expect(n.x).toBeCloseTo(0);
    expect(n.y).toBeCloseTo(1);
  });
  it('normal is unit length', () => {
    const n = segNormal(0, 0, 3, 4);
    expect(Math.hypot(n.x, n.y)).toBeCloseTo(1);
  });
});

describe('segPoint', () => {
  it('t=0 returns start', () => {
    const p = segPoint(0, 0, 10, 10, 0);
    expect(p.x).toBe(0); expect(p.y).toBe(0);
  });
  it('t=1 returns end', () => {
    const p = segPoint(0, 0, 10, 10, 1);
    expect(p.x).toBe(10); expect(p.y).toBe(10);
  });
  it('t=0.5 returns midpoint', () => {
    const p = segPoint(0, 0, 10, 20, 0.5);
    expect(p.x).toBe(5); expect(p.y).toBe(10);
  });
});
