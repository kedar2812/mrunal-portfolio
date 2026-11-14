// Text + scroll effects: letter reveal, line pop, wave-fill words, brand path ticker,
// project ticker, service card swing-in, archive explosion, fade-ups, cursor, menu, form.
import { gsap } from 'gsap';
import { spring, bounceSpring, bezier, clamp, el, onVisible, reduceMotion, isTouch, SPARKLE, wavePath } from './util.js';

/* ───────── Letter reveal (hero wordmark) ─────────
   y 115% → 0, rotate 4° → 0, 1.4s, ease (.16,1,.3,1), stagger from the centre outward:
   delay = |mid − i| × .06 + i × .005. Replays every time it re-enters view. */
export function initLetterReveal() {
  document.querySelectorAll('.reveal-letters').forEach(host => {
    const text = host.dataset.text.toUpperCase(); host.textContent = '';
    const chars = [...text], mid = Math.floor(chars.length / 2);
    const spans = chars.map((c, i) => {
      const box = el('span', { class: 'ch ch--' + c.toLowerCase() });
      const inner = el('span', { text: c }); box.appendChild(inner); host.appendChild(box);
      return { inner, delay: Math.abs(mid - i) * .06 + i * .005, c };
    });
    // sparkle accents (reference wordmark has a sparkle i-dot and a sparkle cut-out counter)
    const u = spans.find(s => s.c === 'U');
    if (u) { const g = el('svg', { class: 'sparkle-in', viewBox: '0 0 100 100', 'aria-hidden': 'true' }, true); g.appendChild(el('path', { d: SPARKLE }, true)); u.inner.style.position = 'relative'; u.inner.appendChild(g); }
    const l = spans[spans.length - 1];
    const dot = el('svg', { class: 'sparkle-dot', viewBox: '0 0 100 100', 'aria-hidden': 'true' }, true);
    dot.appendChild(el('path', { d: SPARKLE }, true)); l.inner.style.position = 'relative'; l.inner.appendChild(dot);

    const ease = bezier(.16, 1, .3, 1);
    const hide = () => spans.forEach(s => gsap.set(s.inner, { yPercent: 115, rotate: 4 }));
    const show = () => spans.forEach(s => gsap.to(s.inner, { yPercent: 0, rotate: 0, duration: 1.4, ease, delay: s.delay, overwrite: true }));
    if (reduceMotion) return;
    hide();
    let shown = false;
    onVisible(host, vis => { if (vis && !shown) { shown = true; show(); } else if (!vis && shown) { shown = false; gsap.killTweensOf(spans.map(s => s.inner)); hide(); } }, { rootMargin: '-10% 0px' });
  });
}

/* ───────── Line pop (about paragraph) ─────────
   Each rendered line: scale 0 + rotateY 10° → 1, spring bounce .6 / 1.5s, .13s stagger, once in view. */
export function initLinePop() {
  document.querySelectorAll('.line-pop').forEach(p => {
    const words = p.textContent.trim().split(/\s+/);
    const build = () => {
      p.innerHTML = words.map(w => `<span class="w" style="display:inline-block">${w}</span>`).join(' ');
      const lines = []; let top = null;
      p.querySelectorAll('.w').forEach(w => { if (w.offsetTop !== top) { lines.push([]); top = w.offsetTop; } lines[lines.length - 1].push(w.textContent); });
      p.innerHTML = lines.map(l => `<span class="ln">${l.join(' ')}</span>`).join('');
      return [...p.querySelectorAll('.ln')];
    };
    let lines = build(), played = false;
    const sp = bounceSpring({ bounce: .6, duration: 1.5 });
    if (!reduceMotion) gsap.set(lines, { scale: 0, rotateY: 10, transformPerspective: 800 });
    const play = () => { played = true; if (reduceMotion) return;
      lines.forEach((ln, i) => gsap.to(ln, { scale: 1, rotateY: 0, duration: sp.duration, ease: sp.ease, delay: .13 * i })); };
    onVisible(p, v => { if (v && !played) play(); }, { threshold: 0 });
    let rw = innerWidth; addEventListener('resize', () => { if (Math.abs(innerWidth - rw) < 40) return; rw = innerWidth; lines = build(); if (!played && !reduceMotion) gsap.set(lines, { scale: 0, rotateY: 10 }); });
  });
}

/* ───────── Wave-fill giant words ─────────
   Fit-to-width; hard-edged bottom→top colour wipe tied to scroll:
   progress over [element top at 90% vh → at 30% vh], fill level = p×1.5 − .25 */
export function initWaveText(register) {
  const items = [...document.querySelectorAll('.wave-text')].map(h => {
    h.style.setProperty('--base', h.dataset.base); h.style.setProperty('--fill', h.dataset.fill);
    return { h };
  });
  const fit = () => items.forEach(({ h }) => {
    h.style.fontSize = '100px';
    const avail = h.clientWidth - 40, w = h.scrollWidth - 40;
    const r = h.getBoundingClientRect(); const range = document.createRange(); range.selectNodeContents(h);
    const tw = range.getBoundingClientRect().width || w;
    h.style.fontSize = (100 * avail / tw) + 'px';
    h.style.lineHeight = '1';
  });
  document.fonts.ready.then(fit); fit(); addEventListener('resize', fit);
  register(() => {
    const vh = innerHeight;
    items.forEach(({ h }) => {
      const top = h.getBoundingClientRect().top;
      const p = clamp((vh * .9 - top) / (vh * .6), 0, 1);
      const level = clamp(p * 1.5 - .25, 0, 1);
      h.style.setProperty('--p', (level * 100).toFixed(2) + '%');
    });
  });
}

/* ───────── Brand pills along a wavy SVG path ───────── */
const WAVE_D = 'M0.75 425.233C0.75 425.233 844.936 14.7884 1394.41 1.68034C1990.72 -12.5451 2312.75 433.534 2909.08 425.233C3477.15 417.325 4350.75 1.68034 4350.75 1.68034';
// Words about Mrunal's work + personality (not client names)
const BRANDS = [
  { n: 'bold type', m: 'Aa', c: '#ff9ee4' }, { n: 'good food', m: '✿', c: '#f2edc7' }, { n: 'captions', m: '“ ”', c: '#a8bfff' },
  { n: 'a little chaos', m: '✦', c: '#fff2a8' }, { n: 'reels', m: '▶', c: '#ff9ee4' }, { n: 'brief → post', m: '→', c: '#f2edc7' },
  { n: 'hooks', m: '?!', c: '#a8bfff' }, { n: 'figma', m: '◐', c: '#fff2a8' },
];
export function initBrandTicker(register) {
  const wrap = document.getElementById('brands'); if (!wrap) return;
  const svg = el('svg', { width: 0, height: 0, style: { position: 'absolute' } }, true);
  const path = el('path', { d: WAVE_D }, true); svg.appendChild(path); wrap.appendChild(svg);
  const L0 = path.getTotalLength();
  const tilt = [-20, 0, 8, -6, 14, 0, -10, 6];
  const items = []; const MAX = 18;
  for (let i = 0; i < MAX; i++) {
    const b = BRANDS[i % BRANDS.length];
    const node = el('div', { class: 'brand', style: { background: b.c } });
    node.innerHTML = `<div>${b.m}<small>${b.n}</small></div>`; wrap.appendChild(node);
    items.push({ node, tilt: tilt[i % tilt.length] });
  }
  let W = 0, H = 0, sx = 1, sy = 1, itemW = 158, itemH = 100, lenPx = 1, count = 10;
  const size = () => {
    W = wrap.clientWidth; H = wrap.clientHeight; itemW = items[0].node.offsetWidth; itemH = items[0].node.offsetHeight;
    sx = W / 4351; sy = Math.max(20, H - itemH - 20) / 426;
    let len = 0, prev = null; for (let k = 0; k <= 200; k++) { const p = path.getPointAtLength(k / 200 * L0), q = { x: p.x * sx, y: p.y * sy }; if (prev) len += Math.hypot(q.x - prev.x, q.y - prev.y); prev = q; }
    lenPx = len; count = clamp(Math.floor(len / (itemW + 34)), 3, MAX);
    items.forEach((it, i) => it.node.style.display = i < count ? '' : 'none');
  };
  size(); addEventListener('resize', size);
  let offset = 0, speed = 70, hover = false, dragging = false, lastX = 0, vel = 0, visible = false;
  wrap.addEventListener('mouseenter', () => hover = true); wrap.addEventListener('mouseleave', () => hover = false);
  wrap.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; wrap.setPointerCapture(e.pointerId); wrap.classList.add('is-drag'); });
  wrap.addEventListener('pointermove', e => { if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; offset += dx * 1.2; vel = dx * 60; });
  const end = () => { dragging = false; wrap.classList.remove('is-drag'); };
  wrap.addEventListener('pointerup', end); wrap.addEventListener('pointercancel', end);
  onVisible(wrap, v => visible = v);
  // entrance: y 170 → 0 spring(k362,c100)
  const sp = spring({ stiffness: 362, damping: 100 });
  if (!reduceMotion) { gsap.set(wrap, { y: 170 }); onVisible(wrap, v => { if (v) gsap.to(wrap, { y: 0, duration: sp.duration, ease: sp.ease }); }); }
  let last = performance.now();
  register(() => {
    const now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!visible) return;
    if (!dragging) { offset += (reduceMotion ? 0 : speed * (hover ? .8 : 1)) * dt + vel * dt; vel *= .92; }
    // items evenly spaced along the path; offset is in px of path length
    for (let i = 0; i < count; i++) {
      const it = items[i];
      const u = (((i / count) + offset / lenPx) % 1 + 1) % 1;
      const pt = path.getPointAtLength(u * L0);
      const x = pt.x * sx - itemW / 2, y = pt.y * sy + 10;
      const fade = Math.min(u, 1 - u) / .07; // fade at both ends
      it.node.style.opacity = clamp(fade, 0, 1).toFixed(3);
      it.node.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${it.tilt}deg)`;
    }
  });
}

/* ───────── Projects ticker (desktop) + category stickers ───────── */
export function initProjects(register) {
  const track = document.getElementById('projectTrack'); if (!track) return;
  track.querySelectorAll('.project').forEach(p => {
    const [a, b] = (p.dataset.cat || '').split('|');
    const st = el('div', { class: 'sticker', 'aria-hidden': 'true' });
    const svg = el('svg', { viewBox: '0 0 100 100' }, true); svg.appendChild(el('path', { d: wavePath(9, 38, 7.5, 128) }, true));
    st.appendChild(svg); st.appendChild(el('div', { class: 'sticker__txt', html: '' }));
    st.lastChild.innerHTML = `<small>${a}</small><b>${b}</b>`;
    p.prepend(st);
  });
  const originals = [...track.children];
  const clone = () => originals.forEach(n => { const c = n.cloneNode(true); c.classList.add('is-clone'); c.setAttribute('aria-hidden', 'true'); c.querySelectorAll('a').forEach(a => a.tabIndex = -1); track.appendChild(c); });
  clone(); clone();
  let x = 0, setW = 0, visible = false; const mq = matchMedia('(max-width:809px)');
  const measure = () => { const first = originals[0], gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 120; setW = originals.reduce((s, n) => s + n.offsetWidth, 0) + gap * originals.length; };
  measure(); addEventListener('resize', measure); document.fonts.ready.then(measure);
  onVisible(track, v => visible = v, { rootMargin: '200px' });
  let last = performance.now();
  register(() => {
    const now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!visible || mq.matches || reduceMotion) return;
    x -= 100 * dt; if (-x >= setW) x += setW;
    track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
  });
}

/* ───────── Service cards swing in (rotate ±30, scale .7 → 0/1, spring k500 c60) ───────── */
export function initSwing() {
  const sp = spring({ stiffness: 500, damping: 60 });
  document.querySelectorAll('.swing').forEach(c => {
    if (reduceMotion) return;
    const rot = +c.dataset.rot || -30; gsap.set(c, { rotate: rot, scale: .7 });
    onVisible(c, v => { if (v) gsap.to(c, { rotate: 0, scale: 1, duration: sp.duration * 1.6, ease: sp.ease, overwrite: true });
      else if (c.getBoundingClientRect().top > 0) gsap.set(c, { rotate: rot, scale: .7 }); }, { threshold: .05 });
  });
}

/* ───────── Archive explosion (scroll-scrubbed) ───────── */
export function initArchive(register) {
  const zone = document.getElementById('archiveScroll'), stack = document.getElementById('archiveStack'); if (!zone) return;
  const cards = [...stack.querySelectorAll('.arc:not(.arc--front)')].map(n => ({ n, x: +n.dataset.x, y: +n.dataset.y, s: +n.dataset.s }));
  const smooth = t => t * t * (3 - 2 * t);
  register(() => {
    const r = zone.getBoundingClientRect(), vh = innerHeight;
    if (r.bottom < -100 || r.top > vh + 100) return;
    const p = clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
    // phase A: stack appears (opacity 0, scale .9 → 1) as the zone arrives
    const a = clamp((vh - r.top) / vh, 0, 1);
    stack.style.opacity = reduceMotion ? 1 : (.0 + a).toFixed(3);
    stack.style.transform = `${matchMedia('(max-width:809px)').matches ? 'scale(.56) ' : ''}scale(${(.9 + .1 * a).toFixed(4)})`;
    const e = smooth(clamp((p - .08) / .8, 0, 1)) * (innerWidth < 810 ? .62 : 1);
    cards.forEach(c => { c.n.style.transform = `translate3d(${(c.x * e).toFixed(1)}px,${(c.y * e).toFixed(1)}px,0) scale(${(1 + (c.s - 1) * e).toFixed(4)})`; });
  });
}

/* ───────── Fade-up (contact pricing block) ───────── */
export function initFadeUp() {
  const ease = bezier(.22, .85, .56, 1);
  document.querySelectorAll('.fade-up').forEach(n => {
    if (reduceMotion) { n.style.opacity = 1; n.style.transform = 'none'; return; }
    onVisible(n, v => { if (v) gsap.to(n, { y: 0, opacity: 1, duration: .8, delay: .25, ease }); }, { threshold: .5 });
    gsap.set(n, { y: 50, opacity: 0 });
  });
}

/* ───────── Hero wordmark parallax (speed 110 → y = −0.1 × scroll) ───────── */
export function initParallax(register) {
  const nodes = [...document.querySelectorAll('.parallax')];
  register(() => { const y = scrollY; if (y > innerHeight * 1.5) return; nodes.forEach(n => n.style.translate = `0 ${(y * (+n.dataset.speed || -.1)).toFixed(1)}px`); });
}

/* ───────── Sparkle cursor with trail ───────── */
export function initCursor() {
  if (isTouch) return;
  const layer = document.getElementById('cursor'), star = layer.querySelector('.cursor__star');
  document.documentElement.classList.add('has-cursor');
  let x = -100, y = -100, lx = 0, ly = 0, acc = 0, visible = false;
  addEventListener('pointermove', e => {
    x = e.clientX; y = e.clientY;
    star.style.transform = `translate3d(${x - 20}px,${y - 20}px,0)`;
    if (!visible) { visible = true; layer.classList.add('is-on'); }
    const interactive = e.target.closest('a,button,input,textarea,label,.thumb,.tag,.flower,.brands');
    layer.classList.toggle('is-off', !!interactive);
    const d = Math.hypot(x - lx, y - ly); acc += d; lx = x; ly = y;
    if (acc > 26 && !interactive && !reduceMotion) { acc = 0; spawn(x + (Math.random() - .5) * 18, y + (Math.random() - .5) * 18); }
  }, { passive: true });
  document.addEventListener('mouseleave', () => { visible = false; layer.classList.remove('is-on'); });
  function spawn(px, py) {
    const s = 10 + Math.random() * 12;
    const n = el('svg', { class: 'spark', viewBox: '0 0 100 100', width: s, height: s, style: { left: px + 'px', top: py + 'px' } }, true);
    n.appendChild(el('path', { d: SPARKLE }, true)); n.style.setProperty('--life', (.6 + Math.random() * .4) + 's');
    layer.appendChild(n); n.addEventListener('animationend', () => n.remove());
  }
}

/* ───────── Menu ───────── */
export function initMenu(lenis) {
  const menu = document.getElementById('menu'), btn = document.getElementById('menuBtn');
  const set = open => { menu.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', open); btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); };
  btn.addEventListener('click', e => { e.stopPropagation(); set(!menu.classList.contains('is-open')); });
  document.addEventListener('click', e => { if (!menu.contains(e.target)) set(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); const t = id === '#top' ? 0 : document.querySelector(id); if (t === null) return;
    e.preventDefault(); set(false);
    if (lenis) lenis.scrollTo(t, { duration: 1.4, easing: x => 1 - Math.pow(1 - x, 4) }); else (t === 0 ? scrollTo({ top: 0, behavior: 'smooth' }) : t.scrollIntoView({ behavior: 'smooth' }));
  }));
}

/* ───────── Contact form → WhatsApp / email ───────── */
export function initForm() {
  const f = document.getElementById('contactForm'); if (!f) return;
  f.addEventListener('submit', e => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(f));
    const msg = `Hi Mrunal! I'm ${d.name}${d.brand ? ' from ' + d.brand : ''}.\n\nWhat I need: ${d.msg}${d.platform ? '\nPlatform: ' + d.platform : ''}${d.email ? '\nEmail: ' + d.email : ''}`;
    window.open('https://api.whatsapp.com/send?phone=919834380461&text=' + encodeURIComponent(msg), '_blank', 'noopener');
  });
}
