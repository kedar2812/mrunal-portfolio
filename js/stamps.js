// Hero sticker field — port of the reference "stamp" behaviour:
// spin / wobble / float layers, cursor push reaction, click-to-stamp (max 8), links.
import { shapeSVG, el, svgNS, reduceMotion, isTouch } from './util.js';

const C = { pink: '#ff9ee4', pinkSoft: '#ffb5f0', magenta: '#bd4f9e', cream: '#f2edc7', butter: '#fff2a8', peri: '#a8bfff', plum: '#2b1619' };

const STAMPS = [
  { shape: 'burst', size: 420, x: 4, y: 13, rotation: -146, color: C.pink, border: C.pinkSoft, bw: 10,
    text: 'social media manager . social media manager . social media manager .', textPos: 'ring', textSize: 25, textColor: C.magenta, ringAngle: -180, ringInset: 0,
    autoRotate: 29, dir: 'reverse', motion: 'rotate', speed: 14, rotateAmount: 7, react: { r: 185, s: 31 } },
  { shape: 'star', size: 420, x: 95, y: 27, rotation: 10, color: C.peri, border: C.cream, bw: 7,
    text: 'based in india', textPos: 'center', textSize: 26, textOffset: -9, textColor: C.cream,
    motion: 'rotate', speed: 9, rotateAmount: 7, react: { r: 210, s: 16 } },
  { shape: 'spark', size: 284, x: 9, y: 82, rotation: 17, color: C.butter, text: 'selected work', textPos: 'center', textSize: 20, textColor: C.pink,
    motion: 'all', speed: 7.2, rotateAmount: 5, move: 7, react: { r: 175, s: 14 }, link: '#work' },
  { shape: 'flower', size: 221, x: 94, y: 84, rotation: -8, color: C.pink, border: C.cream, bw: 5, text: 'hire', textPos: 'center', textSize: 31, textOffset: 3, textColor: C.magenta,
    autoRotate: 12, motion: 'floatRotate', speed: 8.5, rotateAmount: 4, move: 8, react: { r: 180, s: 12 }, link: '#contact' }
];
const SPAWN_POOL = [
  { shape: 'seal', color: C.butter, text: 'viral', textColor: C.magenta },
  { shape: 'daisy', color: C.peri, text: 'reels', textColor: C.cream },
  { shape: 'star', color: C.pink, border: C.cream, bw: 5, text: 'yum', textColor: C.magenta },
  { shape: 'burst', color: C.cream, text: 'new post', textColor: C.magenta },
  { shape: 'spark', color: C.pink, text: 'glow', textColor: C.cream },
  { shape: 'scallop', color: C.magenta, text: 'hooks', textColor: C.cream },
  { shape: 'flower', color: C.butter, text: 'caption', textColor: C.pink },
];

let uid = 0;
function buildArt(cfg, size) {
  const wrap = el('div', { style: { position: 'relative', width: '100%', height: '100%' } });
  const enter = el('div', { class: reduceMotion ? '' : 'm-enter', style: { position: 'absolute', inset: 0, animationDelay: (cfg.delay || 0) + 's' } });
  const s = shapeSVG(cfg.shape);
  const svg = el('svg', { viewBox: '0 0 100 100', 'aria-hidden': 'true' }, true);
  const shp = el(s.tag, { ...s.attr, fill: cfg.color, stroke: cfg.border || 'none', 'stroke-width': cfg.bw || 0,
    'stroke-linejoin': s.sharp ? 'miter' : 'round', 'stroke-miterlimit': s.sharp ? 12 : 4, 'vector-effect': 'non-scaling-stroke' }, true);
  svg.appendChild(shp); enter.appendChild(svg); wrap.appendChild(enter);
  if (cfg.text) {
    const scale = size / (cfg.size || size);
    const fs = Math.max(4, (cfg.textSize || 12) * Math.max(scale, .5));
    if (cfg.textPos === 'ring') {
      const b = size, bw = cfg.bw ? cfg.bw / 2 : 0, inset = Math.min(cfg.ringInset ?? 12, b * .3);
      const R = Math.max(8, b * s.inset - inset - bw - fs * .55), w = b / 2, T = w - R, id = 'ring' + (++uid);
      const rs = el('svg', { viewBox: `0 0 ${b} ${b}`, class: reduceMotion ? '' : 'm-enter-text', style: { position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none', animationDelay: ((cfg.delay || 0) + .26) + 's' } }, true);
      const defs = el('defs', {}, true);
      defs.appendChild(el('path', { id, d: `M ${T},${w} A ${R},${R} 0 1,1 ${w + R},${w} A ${R},${R} 0 1,1 ${T},${w}`, transform: `rotate(${cfg.ringAngle || 0} ${w} ${w})` }, true));
      const txt = el('text', { fill: cfg.textColor, 'font-family': 'Sofia Sans Extra Condensed, sans-serif', 'font-weight': 600, 'font-size': fs, 'letter-spacing': '.02em' }, true);
      const tp = el('textPath', { href: '#' + id, startOffset: '50%', 'text-anchor': 'middle' }, true); tp.textContent = cfg.text;
      txt.appendChild(tp); rs.append(defs, txt); wrap.appendChild(rs);
    } else {
      const lab = el('div', { class: 'stamp__label ' + (reduceMotion ? '' : 'm-enter-text'), text: cfg.text,
        style: { fontSize: fs + 'px', color: cfg.textColor, top: `calc(50% + ${(cfg.textOffset || 0) * Math.max(scale, .5)}px)`, animationDelay: ((cfg.delay || 0) + .26) + 's' } });
      wrap.appendChild(lab);
    }
  }
  return wrap;
}
function motionLayers(cfg, size, art) {
  const m = reduceMotion ? 'static' : (cfg.motion || 'static');
  const doFloat = ['float', 'floatRotate', 'all'].includes(m), doWobble = ['rotate', 'floatRotate', 'all'].includes(m);
  const outer = el('div', { style: { width: size + 'px', height: size + 'px', transform: `rotate(${cfg.rotation || 0}deg)`, transformOrigin: '50% 50%' } });
  const spin = el('div', { class: cfg.autoRotate && !reduceMotion ? 'm-spin' : '', style: { width: '100%', height: '100%', animationDuration: (cfg.autoRotate || 12) + 's', animationDirection: cfg.dir || 'normal' } });
  const wob = el('div', { class: doWobble ? 'm-wobble' : '', style: { width: '100%', height: '100%', animationDuration: (cfg.speed || 7) + 's' } });
  wob.style.setProperty('--wob', (cfg.rotateAmount ?? 4) + 'deg');
  const flt = el('div', { class: doFloat ? 'm-float' : '', style: { width: '100%', height: '100%', animationDuration: (cfg.speed || 7) + 's' } });
  flt.style.setProperty('--flt', (cfg.move ?? 8) + 'px');
  flt.appendChild(art); wob.appendChild(flt); spin.appendChild(wob); outer.appendChild(spin);
  return outer;
}

export function initStamps() {
  const field = document.getElementById('stamps');
  const nodes = []; // {react, cfg, x, y}
  const scaleNow = () => { const w = field.clientWidth; return w <= 809 ? .42 : Math.min(1, w / 1600); };
  let scale = scaleNow(), spawned = [];

  function place(cfg, x, y, size, spawn) {
    const host = el('div', { class: 'stamp', 'data-stamp': 'true', style: { left: x + '%', top: y + '%', zIndex: spawn ? 2 : 1 } });
    const react = el('div', { class: 'stamp__react', style: { width: size + 'px', height: size + 'px' } });
    const center = el('div', { class: 'stamp__center' + (spawn && !reduceMotion ? ' m-pop' : ''), style: { width: size + 'px', height: size + 'px' } });
    if (spawn) center.style.setProperty('--pop', '.5');
    const body = motionLayers(cfg, size, buildArt(cfg, size));
    if (cfg.link) { const a = el('a', { href: cfg.link, 'aria-label': cfg.text, class: 'native-cursor', style: { display: 'block', width: size + 'px', height: size + 'px' } }); a.appendChild(body); center.appendChild(a); }
    else center.appendChild(body);
    react.appendChild(center); host.appendChild(react); field.appendChild(host);
    const n = { host, react, cfg, x, y }; nodes.push(n); return n;
  }
  const build = () => {
    field.querySelectorAll('.stamp').forEach(s => s.remove()); nodes.length = 0; spawned = [];
    STAMPS.forEach((c, i) => place({ ...c, delay: .15 + i * .08 }, c.x, c.y, Math.max(24, c.size * scale), false));
  };
  build();
  let rw; addEventListener('resize', () => { clearTimeout(rw); rw = setTimeout(() => { const s = scaleNow(); if (Math.abs(s - scale) > .02) { scale = s; build(); } }, 200); });

  // cursor push
  const ptr = { x: 0, y: 0, inside: false }; let raf = 0;
  const update = () => {
    raf = 0; const r = field.getBoundingClientRect();
    nodes.forEach(({ react, cfg, x, y }) => {
      const k = cfg.react; if (!k || !ptr.inside || isTouch) { react.style.transform = 'translate3d(0,0,0)'; return; }
      const ax = x / 100 * r.width, ay = y / 100 * r.height, dx = ptr.x - ax, dy = ptr.y - ay, d = Math.hypot(dx, dy);
      const R = Math.max(30, k.r * scale); if (!d || d >= R) { react.style.transform = 'translate3d(0,0,0)'; return; }
      const f = k.s * scale * (1 - d / R), mx = -dx / d * f, my = -dy / d * f;
      react.style.transform = `translate3d(${mx.toFixed(2)}px,${my.toFixed(2)}px,0)`;
    });
  };
  const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
  const card = field.parentElement;
  card.addEventListener('pointermove', e => { const r = field.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.inside = true; queue(); });
  card.addEventListener('pointerleave', () => { ptr.inside = false; queue(); });
  nodes.forEach(n => n.react.style.transition = 'transform .35s cubic-bezier(.2,.9,.2,1)');

  // click to stamp
  let down = null;
  field.addEventListener('pointerdown', e => { if (e.button === 0) down = { x: e.clientX, y: e.clientY }; });
  field.addEventListener('pointerup', e => {
    const d = down; down = null; if (!d || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 10) return;
    if (e.target.closest('a')) return;
    const r = field.getBoundingClientRect();
    const base = SPAWN_POOL[Math.floor(Math.random() * SPAWN_POOL.length)];
    const size = Math.max(24, 180 * 1.2 * scale);
    const cfg = { ...base, size: 180, textSize: 26, textPos: 'center', motion: 'floatRotate', speed: 6 + Math.random() * 4, rotateAmount: 5, move: 6,
      rotation: (Math.random() * 2 - 1) * 25, autoRotate: Math.random() < .35 ? 14 : 0, react: { r: 160, s: 14 } };
    const n = place(cfg, (e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100, size, true);
    n.react.style.transition = 'transform .35s cubic-bezier(.2,.9,.2,1)';
    spawned.push(n);
    if (spawned.length > 8) { const old = spawned.shift(); old.host.style.transition = 'opacity .3s, transform .3s'; old.host.style.opacity = 0; old.host.style.transform = 'scale(.6)';
      setTimeout(() => { old.host.remove(); const i = nodes.indexOf(old); if (i > -1) nodes.splice(i, 1); }, 300); }
  });
}
