// Shared helpers: springs (Framer-Motion-accurate), shape generators, misc.

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;

/* ---------- Springs ----------
   Simulates a damped spring (mass m, stiffness k, damping c) from 0 → 1 and
   returns { ease, duration } so it can drive GSAP tweens with the exact curve
   Framer Motion would produce. */
const springCache = new Map();
export function spring({ stiffness = 100, damping = 10, mass = 1 } = {}) {
  const key = `${stiffness}|${damping}|${mass}`;
  if (springCache.has(key)) return springCache.get(key);
  const dt = 1 / 600; let x = 0, v = 0, t = 0; const samples = [0];
  let still = 0;
  while (t < 10) {
    const a = (-stiffness * (x - 1) - damping * v) / mass;
    v += a * dt; x += v * dt; t += dt; samples.push(x);
    if (Math.abs(x - 1) < 0.0005 && Math.abs(v) < 0.005) { if (++still > 30) break; } else still = 0;
  }
  const n = samples.length - 1, duration = n * dt;
  const ease = p => { if (p >= 1) return 1; const f = p * n, i = Math.floor(f); return lerp(samples[i], samples[Math.min(i + 1, n)], f - i); };
  const out = { ease, duration };
  springCache.set(key, out);
  return out;
}
// Framer's duration/bounce spring flavour (e.g. {bounce:.6, duration:1.5})
export function bounceSpring({ bounce = 0.25, duration = 0.8 } = {}) {
  const stiffness = Math.pow((2 * Math.PI) / duration, 2);
  const damping = 2 * (1 - bounce) * Math.sqrt(stiffness);
  return spring({ stiffness, damping, mass: 1 });
}
export const bezier = (x1, y1, x2, y2) => {
  // cubic-bezier easing function
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = t => ((ax * t + bx) * t + cx) * t, sy = t => ((ay * t + by) * t + cy) * t;
  const dx = t => (3 * ax * t + 2 * bx) * t + cx;
  return x => { let t = x; for (let i = 0; i < 8; i++) { const e = sx(t) - x; if (Math.abs(e) < 1e-5) break; const d = dx(t); if (Math.abs(d) < 1e-6) break; t -= e / d; } return sy(clamp(t, 0, 1)); };
};

/* ---------- Shapes (ported maths from the reference stamp library) ---------- */
function ring(n, rf) { const pts = []; for (let r = 0; r < n; r++) { const a = -Math.PI / 2 + Math.PI * 2 * r / n, d = rf(a, r); pts.push({ x: 50 + Math.cos(a) * d, y: 50 + Math.sin(a) * d }); } return pts; }
function smooth(pts, t = .18) {
  let d = `M ${pts[0].x.toFixed(3)} ${pts[0].y.toFixed(3)}`; const r = pts.length;
  for (let i = 0; i < r; i++) { const a = pts[(i - 1 + r) % r], o = pts[i], s = pts[(i + 1) % r], c = pts[(i + 2) % r];
    d += ` C ${(o.x + (s.x - a.x) * t).toFixed(3)} ${(o.y + (s.y - a.y) * t).toFixed(3)}, ${(s.x - (c.x - o.x) * t).toFixed(3)} ${(s.y - (c.y - o.y) * t).toFixed(3)}, ${s.x.toFixed(3)} ${s.y.toFixed(3)}`; }
  return d + ' Z';
}
export const starPoints = (n, R, r) => ring(n * 2, (a, i) => i % 2 === 0 ? R : r).map(p => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ');
export const wavePath = (lobes, base, amp, res = 96, phase = 0) => smooth(ring(res, r => base + amp * Math.cos(lobes * r + phase)), .12);
export const SPARK = 'M50 3 C55 31 61 40 97 50 C61 60 55 69 50 97 C45 69 39 60 3 50 C39 40 45 31 50 3 Z';
export const SPARKLE = 'M50 0C57 34 66 43 100 50C66 57 57 66 50 100C43 66 34 57 0 50C34 43 43 34 50 0Z';

export function shapeSVG(shape) {
  switch (shape) {
    case 'star': return { tag: 'polygon', attr: { points: starPoints(5, 46, 21) }, sharp: true, inset: .34 };
    case 'burst': return { tag: 'polygon', attr: { points: starPoints(24, 48, 39) }, sharp: true, inset: .34 };
    case 'spark': return { tag: 'path', attr: { d: SPARK }, inset: .34 };
    case 'flower': return { tag: 'path', attr: { d: wavePath(8, 35.5, 10.5, 128) }, inset: .39 };
    case 'daisy': return { tag: 'path', attr: { d: wavePath(12, 35, 10, 144) }, inset: .39 };
    case 'scallop': return { tag: 'path', attr: { d: wavePath(14, 40.5, 5.8, 168) }, inset: .39 };
    case 'seal': return { tag: 'path', attr: { d: wavePath(20, 41.5, 4.6, 180) }, inset: .39 };
    case 'manyStar': return { tag: 'polygon', attr: { points: starPoints(14, 47, 34) }, sharp: true, inset: .34 };
    default: return { tag: 'path', attr: { d: wavePath(6, 39, 6, 120, Math.PI / 6) }, inset: .39 };
  }
}
export const svgNS = 'http://www.w3.org/2000/svg';
export function el(tag, attrs = {}, ns) {
  const e = ns ? document.createElementNS(svgNS, tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k === 'text') e.textContent = v;
    else e.setAttribute(k, v);
  }
  return e;
}

/* ---------- Visibility helper ---------- */
export function onVisible(node, cb, opts = { threshold: 0 }) {
  const io = new IntersectionObserver(es => es.forEach(e => cb(e.isIntersecting, e)), opts);
  io.observe(node); return io;
}
