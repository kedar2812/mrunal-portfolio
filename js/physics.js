// Matter.js physics: service tags that rain in (drag / throw / cursor push, max tilt 25°)
// and the footer pile of scalloped flower badges.
import Matter from 'matter-js';
import { el, onVisible, reduceMotion, isTouch, wavePath, clamp } from './util.js';

const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Events } = Matter;
const COLORS = ['#a8bfff', '#ff9ee4'];

function makeWorld(container, { gravity = 1 } = {}) {
  const engine = Engine.create({ gravity: { x: 0, y: gravity } });
  const world = engine.world;
  let walls = [];
  const build = (W, H) => {
    walls.forEach(w => Composite.remove(world, w));
    const t = 200;
    walls = [
      Bodies.rectangle(W / 2, H + t / 2, W * 3, t, { isStatic: true }),
      Bodies.rectangle(-t / 2, H / 2 - 2000, t, H * 2 + 4000, { isStatic: true }),
      Bodies.rectangle(W + t / 2, H / 2 - 2000, t, H * 2 + 4000, { isStatic: true }),
    ];
    Composite.add(world, walls);
  };
  // pointer drag — desktop only (Matter's touch handlers would block page scrolling on phones)
  if (isTouch) return { engine, world, build };
  const mouse = Mouse.create(container);
  mouse.pixelRatio = 1;
  // stop Matter from swallowing wheel scrolling
  container.removeEventListener('wheel', mouse.mousewheel); container.removeEventListener('mousewheel', mouse.mousewheel); container.removeEventListener('DOMMouseScroll', mouse.mousewheel);
  const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: .2, damping: .1, render: { visible: false } } });
  Composite.add(world, mc);
  return { engine, world, build, mouse, mc };
}

/* ---------- Service tags ---------- */
export function initServiceTags(register) {
  document.querySelectorAll('.svc .tags').forEach((host, ci) => {
    const labels = host.dataset.tags.split('|');
    const card = host.parentElement;
    let world, bodies = [], started = false, W = 0, H = 0;
    const nodes = labels.map((t, i) => {
      const n = el('div', { class: 'tag', text: t, style: { background: COLORS[(i + ci) % 2], visibility: 'hidden' } });
      host.appendChild(n); return n;
    });
    const start = () => {
      if (started) return; started = true;
      W = card.clientWidth; H = card.clientHeight;
      world = makeWorld(host); world.build(W, H);
      host.style.pointerEvents = 'auto';
      nodes.forEach((n, i) => {
        const w = n.offsetWidth, h = n.offsetHeight;
        const x = clamp(w / 2 + 10 + Math.random() * (W - w - 20), w / 2, W - w / 2);
        const b = Bodies.rectangle(x, -h - i * 70, w, h, { chamfer: { radius: 12 }, restitution: .45, friction: .4, frictionAir: .012, density: .002, angle: (Math.random() - .5) * .5 });
        b._node = n; b._w = w; b._h = h; bodies.push(b);
        setTimeout(() => { Composite.add(world.world, b); n.style.visibility = 'visible'; }, reduceMotion ? 0 : i * 50);
      });
      if (reduceMotion) { for (let k = 0; k < 400; k++) Engine.update(world.engine, 16); }
    };
    host.style.pointerEvents = 'none';
    onVisible(card, v => { if (v) start(); }, { threshold: .35 });

    // cursor push
    const ptr = { x: -999, y: -999 };
    card.addEventListener('pointermove', e => { const r = card.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; });
    card.addEventListener('pointerleave', () => { ptr.x = ptr.y = -999; });
    let visible = false; onVisible(card, v => visible = v);
    const maxTilt = 25 * Math.PI / 180;
    let last = performance.now();
    register(() => {
      const now = performance.now(), dt = Math.min(32, now - last); last = now;
      if (!started || !visible) return;
      if (!isTouch) bodies.forEach(b => {
        const dx = b.position.x - ptr.x, dy = b.position.y - ptr.y, d = Math.hypot(dx, dy);
        if (d < 90 && d > 1) Body.applyForce(b, b.position, { x: dx / d * .0035 * b.mass, y: dy / d * .0035 * b.mass - .001 * b.mass });
      });
      Engine.update(world.engine, dt);
      bodies.forEach(b => {
        if (b.angle > maxTilt || b.angle < -maxTilt) { Body.setAngle(b, clamp(b.angle, -maxTilt, maxTilt)); Body.setAngularVelocity(b, b.angularVelocity * -.3); }
        b._node.style.transform = `translate3d(${(b.position.x - b._w / 2).toFixed(1)}px,${(b.position.y - b._h / 2).toFixed(1)}px,0) rotate(${b.angle.toFixed(3)}rad)`;
      });
    });
  });
}

/* ---------- Footer flowers ---------- */
// Mrunal's world — her craft and personality
const WORDS = ['bold type', 'good food', 'chaos', 'captions', 'reels', 'hooks', 'figma', 'pink', 'storyboards', 'trends', 'big ideas', 'brief → post'];
export function initFooterPhysics(register) {
  const host = document.getElementById('footerPhysics'); if (!host) return;
  const footer = host.parentElement;
  let world, items = [], started = false, visible = false;
  const start = () => {
    if (started) return; started = true;
    const W = host.clientWidth, H = host.clientHeight;
    world = makeWorld(host); world.build(W, H);
    const small = W < 810, n = small ? 8 : WORDS.length;
    for (let i = 0; i < n; i++) {
      const R = (small ? 46 : 70) + Math.random() * (small ? 18 : 34);
      const node = el('div', { class: 'flower', style: { width: R * 2 + 'px', height: R * 2 + 'px' } });
      const svg = el('svg', { viewBox: '0 0 100 100' }, true); svg.appendChild(el('path', { d: wavePath(10, 42, 6, 160) }, true));
      node.appendChild(svg); node.appendChild(el('span', { text: WORDS[i % WORDS.length], style: { transform: `rotate(${(Math.random() - .5) * 50}deg)` } }));
      host.appendChild(node);
      const b = Bodies.circle(R + Math.random() * (W - 2 * R), -R - i * 90, R * .96, { restitution: .35, friction: .3, frictionAir: .008, density: .0015 });
      b._node = node; b._r = R; items.push(b);
      setTimeout(() => Composite.add(world.world, b), reduceMotion ? 0 : i * 120);
    }
    if (reduceMotion) for (let k = 0; k < 600; k++) Engine.update(world.engine, 16);
  };
  onVisible(footer, v => { visible = v; if (v) start(); }, { threshold: .3 });
  let last = performance.now();
  register(() => {
    const now = performance.now(), dt = Math.min(32, now - last); last = now;
    if (!started || !visible) return;
    Engine.update(world.engine, dt);
    items.forEach(b => { b._node.style.transform = `translate3d(${(b.position.x - b._r).toFixed(1)}px,${(b.position.y - b._r).toFixed(1)}px,0) rotate(${b.angle.toFixed(3)}rad)`; });
  });
}
